import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { TestCase } from '../models/TestCase';
import { Task, TaskStatus } from '../models/Task';
import { Role, RoleType } from '../models/roleModel'; // RoleType is needed for PROJECT_OWNER
import { UserDiscordLink } from '../models/UserDiscordLink';
import { User, IUser } from '../models/User';
import {
    generateProjectName,
    generateProjectDescription,
    generateTestCases,
    generateDevelopmentTasks,
    ITestCaseGenerationItem,
    ITaskGenerationItem
} from '../bots/labnexAI/chatgpt.service';

/**
 * @route   POST /api/integrations/discord/project-setup
 * @desc    Called by the Discord bot to set up a new project using natural language.
 *          Creates the project, test cases, and optionally tasks.
 * @access  Private (User authenticated by JWT, initiated by bot)
 */
export const createProjectFromDiscordNaturalLanguage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    interface ProjectSetupRequestBody {
      featureTopic: string;
      projectName?: string;
      coverageLevel: 'Light' | 'Medium' | 'Thorough';
      generateTasks: boolean;
      discordUserId: string; // This is the ID of the HUMAN Discord user
    }

    const {
      featureTopic,
      projectName: PprojectName, // Renamed to avoid conflict with Project model
      coverageLevel,
      generateTasks,
      discordUserId,
    }: ProjectSetupRequestBody = req.body;

    const botLabnexId = (req as any).user?._id;

    if (!botLabnexId) {
      console.error('[ProjectSetup] Critical: Bot authentication failed - req.user.id missing.');
      return res.status(401).json({ message: 'Bot authentication failed.' });
    }

    console.log(`[ProjectSetup] Received request from Discord User ID: ${discordUserId} (via authenticated Bot ID: ${botLabnexId})`);
    console.log(`[ProjectSetup] Payload: featureTopic="${featureTopic}", projectName="${PprojectName}", coverageLevel="${coverageLevel}", generateTasks=${generateTasks}`);

    if (!featureTopic || !coverageLevel || !discordUserId) {
      return res.status(400).json({
        message:
          'Missing required fields: featureTopic, coverageLevel, and discordUserId are required.',
      });
    }

    let actualLabnexUserId: Types.ObjectId | undefined = undefined;
    let actualLabnexUser: IUser | null = null;

    try {
      const userLink = await UserDiscordLink.findOne({ discordUserId }).populate('userId');
      
      if (!userLink || !userLink.userId) {
        console.warn(`[ProjectSetup] No Labnex user linked or userId missing for Discord User ID: ${discordUserId}`);
        return res.status(403).json({ message: `Discord user ${discordUserId} is not linked to a Labnex account. Please link your account first.` });
      }

      if (userLink.userId instanceof Types.ObjectId) {
        const userIdToFind = userLink.userId.toString();
        console.warn(`[ProjectSetup] User document was not populated for userId: ${userIdToFind}. Fetching manually.`);
        actualLabnexUser = await User.findById(userIdToFind);
        if (!actualLabnexUser) {
          console.warn(`[ProjectSetup] Labnex user not found for ID: ${userIdToFind}, linked to Discord User ID: ${discordUserId}`);
          return res.status(404).json({ message: `Labnex user account associated with Discord ID ${discordUserId} (using ID ${userIdToFind}) not found.` });
        }
        actualLabnexUserId = actualLabnexUser._id;
      } else {
        // Assuming userLink.userId is IUser, as it's not an ObjectId and passed the null/undefined check for userLink.userId itself
        actualLabnexUser = userLink.userId as IUser; // Cast for clarity if TS needs it
        // Check if actualLabnexUser is valid and has _id
        if (actualLabnexUser && actualLabnexUser._id) {
            actualLabnexUserId = actualLabnexUser._id;
        } else {
             // This case implies userLink.userId was some object but not a valid IUser
            console.error(`[ProjectSetup] Critical: userLink.userId was not ObjectId but not a valid IUser object. Value: ${JSON.stringify(userLink.userId)}`);
            return res.status(500).json({ message: "Internal server error: Corrupted user link data." });
        }
      }
      
      // Ensure actualLabnexUser and actualLabnexUserId are set before proceeding
      if (!actualLabnexUser || !actualLabnexUserId) {
        console.error(`[ProjectSetup] Failed to resolve Labnex user details after checks for Discord User ID: ${discordUserId}. User: ${actualLabnexUser}, UserID: ${actualLabnexUserId}`);
        return res.status(500).json({ message: "Internal server error: Failed to resolve user details." });
      }
      
      console.log(`[ProjectSetup] Verified Labnex User: ID ${actualLabnexUserId}, Name: ${actualLabnexUser.name} for Discord User ID: ${discordUserId}`);

    } catch (error) {
        console.error('[ProjectSetup] Error verifying Discord user link:', error);
        return res.status(500).json({ message: 'Error verifying user link.' });
    }

    let generatedProjectName: string | undefined = undefined;
    let generatedProjectDescription: string | undefined = undefined;
    let createdTestCasesDetails: ITestCaseGenerationItem[] = [];
    let createdTasksDetails: ITaskGenerationItem[] = [];
    let project: IProject | null = null;

    try {
      // AI Content Generation
      if (!PprojectName) {
        generatedProjectName = await generateProjectName(featureTopic);
        console.log(`[ProjectSetup] AI Generated Project Name: "${generatedProjectName}"`);
      }
      generatedProjectDescription = await generateProjectDescription(featureTopic);
      console.log(`[ProjectSetup] AI Generated Project Description: "${generatedProjectDescription}"`);

      const testCasesResult = await generateTestCases(featureTopic, coverageLevel, PprojectName || generatedProjectName || featureTopic);
      if (typeof testCasesResult === 'string') {
        throw new Error(`Failed to generate test cases: ${testCasesResult}`);
      }
      createdTestCasesDetails = testCasesResult;
      console.log(`[ProjectSetup] AI Generated Test Cases: ${createdTestCasesDetails.length} items`);

      if (generateTasks) {
        const tasksResult = await generateDevelopmentTasks(featureTopic, PprojectName || generatedProjectName || featureTopic);
        if (typeof tasksResult === 'string') {
          throw new Error(`Failed to generate tasks: ${tasksResult}`);
        }
        createdTasksDetails = tasksResult;
        console.log(`[ProjectSetup] AI Generated Tasks: ${createdTasksDetails.length} items`);
      }

      // Project Creation
      const finalProjectName = PprojectName || generatedProjectName || 'AI Generated Project';
      const finalProjectDescription = generatedProjectDescription || 'AI Generated Description';

      let projectCode = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      const generateCode = (): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };

      while (!isUnique && attempts < maxAttempts) {
        projectCode = generateCode();
        const existingProjectWithCode = await Project.findOne({ projectCode });
        if (!existingProjectWithCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        console.error('[ProjectSetup] Failed to generate a unique project code after several attempts.');
        return res.status(500).json({ message: 'Failed to generate a unique project identifier. Please try again.' });
      }

      console.log(`[ProjectSetup] Using Project Name: "${finalProjectName}", Code: "${projectCode}"`);

      project = new Project({
        name: finalProjectName,
        description: finalProjectDescription,
        owner: actualLabnexUserId,
        projectCode: projectCode,
        testCaseCount: 0,
        taskCount: 0,
      });
      project = await project.save();
      console.log(`[ProjectSetup] Project created with ID: ${project._id} for Labnex User: ${actualLabnexUserId}`);

      const ownerRole = new Role({
        userId: actualLabnexUserId,
        projectId: project._id,
        type: RoleType.PROJECT_OWNER, // Use the enum value
      });
      await ownerRole.save();
      console.log(`[ProjectSetup] Owner role created for User: ${actualLabnexUserId} in Project: ${project._id}`);

      // Test Case Creation
      const createdTestCasesDocs = [];
      if (createdTestCasesDetails && createdTestCasesDetails.length > 0) {
        for (const tcItem of createdTestCasesDetails) {
          let tcTitle = tcItem.title;
          let tcTitleAttempt = 0;
          let existingTestCase = await TestCase.findOne({ project: project._id, title: tcTitle });
          while (existingTestCase && tcTitleAttempt < 5) {
              tcTitleAttempt++;
              tcTitle = `${tcItem.title} (${tcTitleAttempt})`;
              existingTestCase = await TestCase.findOne({ project: project._id, title: tcTitle });
          }
          if (existingTestCase) {
              console.warn(`[ProjectSetup] Skipping test case due to non-unique title after attempts: ${tcItem.title}`);
              continue;
          }

          const testCaseDoc = new TestCase({
            project: project._id,
            title: tcTitle,
            description: tcItem.description,
            steps: tcItem.steps,
            expectedResult: tcItem.expectedResult,
            priority: tcItem.priority || 'Medium',
            createdBy: actualLabnexUserId,
          });
          createdTestCasesDocs.push(await testCaseDoc.save());
        }
      }
      console.log(`[ProjectSetup] ${createdTestCasesDocs.length} Test Cases persisted.`);
      if (project) project.testCaseCount = createdTestCasesDocs.length;


      // Task Creation
      const createdTasksDocs = [];
      if (generateTasks && createdTasksDetails && createdTasksDetails.length > 0) {
        let taskCounter = await Task.countDocuments({ project: project._id });
        for (const taskItem of createdTasksDetails) {
          taskCounter++;
          const taskReferenceId = `${projectCode}-TASK${taskCounter}`; // Use projectCode from this scope

          const taskDoc = new Task({
            project: project._id,
            title: taskItem.title,
            description: taskItem.description,
            priority: taskItem.priority || 'Medium',
            status: TaskStatus.TODO,
            createdBy: actualLabnexUserId,
            assignee: actualLabnexUserId,
            taskReferenceId: taskReferenceId,
          });
          createdTasksDocs.push(await taskDoc.save());
        }
      }
      console.log(`[ProjectSetup] ${createdTasksDocs.length} Tasks persisted.`);
      if (project) {
        project.taskCount = createdTasksDocs.length;
        await project.save(); 
      }

      return res.status(201).json({
        message: 'Project setup initiated successfully by AI!',
        project: {
          id: project._id,
          name: project.name,
          description: project.description,
          projectCode: project.projectCode,
          owner: actualLabnexUserId,
        },
        testCases: createdTestCasesDocs.map(tc => ({ id: tc._id, title: tc.title, priority: tc.priority })),
        tasks: createdTasksDocs.map(t => ({ id: t._id, title: t.title, priority: t.priority, taskReferenceId: t.taskReferenceId })),
      });

    } catch (error: any) {
      console.error('[ProjectSetup] Error during AI generation or DB operations:', error);
      const errorResponse: any = { message: 'Error setting up project with AI.' };
      if (error.isAxiosError) {
        errorResponse.details = error.response?.data || error.message;
      } else {
        errorResponse.details = error.message;
      }
      if (project && project._id) {
        errorResponse.partialProjectId = project._id;
        errorResponse.warning = "Project might have been partially created. Please check.";
      }
      return res.status(500).json(errorResponse);
    }
  };