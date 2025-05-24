import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { User } from '../models/User'; // Assuming User model might be needed
import { Role, RoleType, IRole } from '../models/roleModel';
import { Notification, NotificationType } from '../models/Notification';

const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;

/**
 * @route   GET /api/integrations/discord/my-projects
 * @desc    Called by the Discord bot to fetch projects for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const getProjectsForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId } = req.query;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }

    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });

        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked to any Labnex account.' });
        }

        const labnexUserId = link.userId;

        // Fetch projects where the user is the owner OR a member
        // Ensure labnexUserId is correctly formatted for the query, potentially as an ObjectId
        const projects = await Project.find({
            $or: [
                { owner: labnexUserId },
                { members: labnexUserId } // Assuming 'members' stores an array of user IDs
            ]
        }).select('name description'); // Select only name and _id (implicitly included)

        if (!projects || projects.length === 0) {
            return res.status(200).json([]); // Return empty array if no projects found
        }
        
        // Map to a simpler format if needed, otherwise return as is
        const projectData = projects.map(p => ({
            id: p._id,
            name: p.name,
            description: p.description,
        }));

        res.status(200).json(projectData);

    } catch (error) {
        console.error('Error fetching projects for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching projects.' });
    }
};

/**
 * @route   GET /api/integrations/discord/project-details
 * @desc    Called by the Discord bot to fetch specific project details for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const getProjectDetailsForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, projectIdentifier } = req.query;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }
    if (!projectIdentifier || typeof projectIdentifier !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid projectIdentifier in query parameters.' });
    }
    const trimmedProjectIdentifier = projectIdentifier.trim();

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'This Discord account is not linked to any Labnex account.' });
        }
        const labnexUserId = link.userId; // This is an ObjectId
        console.log(`[discordProjectController] Attempting to find project. Identifier: "${trimmedProjectIdentifier}", LabnexUserID: ${labnexUserId}`);

        let project;
        // Check if projectIdentifier is a valid ObjectId
        if (Types.ObjectId.isValid(trimmedProjectIdentifier)) {
            project = await Project.findById(trimmedProjectIdentifier)
                .populate('owner', 'name email') // Populate owner's name and email
                // .populate('members', 'name email'); // Optionally populate member details
        } else {
            // If not an ObjectId, assume it's a project name.
            // Fetch all projects accessible by the user and then filter by name.
            console.log(`[discordProjectController] Attempting name-based lookup for: "${trimmedProjectIdentifier}"`);
            const accessibleProjects = await Project.find({
                $or: [
                    { owner: labnexUserId },
                    { members: labnexUserId }
                ]
            }).populate('owner', 'name email'); // Populate owner for all, simplifies later access

            if (accessibleProjects && accessibleProjects.length > 0) {
                console.log(`[discordProjectController] Found ${accessibleProjects.length} accessible projects. Comparing names...`);
                accessibleProjects.forEach(p => {
                    console.log(`[discordProjectController] Comparing with: "${p.name}" (lowercase: "${p.name.toLowerCase()}") vs "${trimmedProjectIdentifier.toLowerCase()}"`);
                });
                project = accessibleProjects.find(
                    p => p.name.toLowerCase() === trimmedProjectIdentifier.toLowerCase()
                );
            } else {
                console.log(`[discordProjectController] No accessible projects found for user ${labnexUserId}.`);
            }
        }

        console.log(`[discordProjectController] Project found by query:`, project ? { id: project._id, name: project.name } : null);

        if (!project) {
            return res.status(404).json({ message: `Project not found with identifier: "${trimmedProjectIdentifier}".` });
        }

        // Verify user has access to this project
        console.log(`[discordProjectController] Verifying access. Project Owner: ${project.owner._id}, Members: ${project.members.map(m => m.toString())}`);
        const userIsOwner = project.owner._id.equals(labnexUserId);
        const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(labnexUserId));
        console.log(`[discordProjectController] User isOwner: ${userIsOwner}, isMember: ${userIsMember}`);

        if (!userIsOwner && !userIsMember) {
            return res.status(403).json({ message: 'You do not have permission to view this project.' });
        }
        
        // Construct a detailed response object
        // Ensure owner is populated and not null before accessing its properties
        const ownerName = (project.owner as any)?.name || 'N/A';

        const projectDetails = {
            id: project._id,
            name: project.name,
            description: project.description,
            owner: ownerName, // project.owner was populated with name and email
            isActive: project.isActive,
            memberCount: project.members.length,
            testCaseCount: project.testCaseCount, // Assuming this field exists
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };

        res.status(200).json(projectDetails);

    } catch (error) {
        console.error('Error fetching project details for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching project details.' });
    }
};

/**
 * @route   POST /api/integrations/discord/projects
 * @desc    Called by the Discord bot to create a new project for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const createProjectForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, projectName, description, projectCode } = req.body;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error for project creation.' });
    }

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret for project creation.' });
    }

    if (!discordUserId || !projectName) {
        return res.status(400).json({ message: 'Missing discordUserId or projectName in request body.' });
    }

    if (!projectCode) {
        return res.status(400).json({ message: 'Missing projectCode in request body.' });
    }

    if (typeof projectName !== 'string' || projectName.trim().length === 0) {
        return res.status(400).json({ message: 'Project name must be a non-empty string.' });
    }
    if (description && typeof description !== 'string') {
        return res.status(400).json({ message: 'Project description must be a string if provided.' });
    }
    if (typeof projectCode !== 'string' || projectCode.trim().length < 3 || projectCode.trim().length > 5 || !/^[a-zA-Z0-9]+$/.test(projectCode)) {
        return res.status(400).json({ message: 'Project code must be 3-5 alphanumeric characters.' });
    }


    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked. Please link your account first using /linkaccount or !labnex link-account.' });
        }

        const labnexUser = await User.findById(link.userId);
        if (!labnexUser) {
            console.error(`[createProjectForDiscordUser] Labnex user not found for linked Discord ID: ${discordUserId}, Labnex UserID: ${link.userId}`);
            return res.status(404).json({ message: 'Associated Labnex user account not found.' });
        }

        // Check for existing project with the same name for this user to prevent duplicates by this user
        // Note: Project names are not globally unique in the schema, but a user might not want two projects with the exact same name.
        // This is a soft check; the main project schema might have stricter rules if `name` and `owner` are unique together.
        const existingProject = await Project.findOne({ name: projectName, owner: labnexUser._id });
        if (existingProject) {
            return res.status(409).json({ message: `You already have a project named "${projectName}". Please choose a different name.` });
        }

        const newProject = new Project({
            name: projectName,
            description: description || '',
            projectCode: projectCode.toUpperCase(),
            owner: labnexUser._id,
            // Additional fields like projectCode, default members, etc., could be set here if needed
        });

        await newProject.save();

        // Create a role for the project owner
        const ownerRoleData: Partial<IRole> = {
            userId: labnexUser._id,
            projectId: newProject._id,
            type: RoleType.PROJECT_OWNER,
            // systemRole is intentionally omitted here, so it should be undefined
            // and not conflict with the partial unique index on systemRole.
        };
        const ownerRole = new Role(ownerRoleData);
        await ownerRole.save();
        
        // Create a notification for the user
        const notification = new Notification({
            userId: labnexUser._id,
            message: `Your new project "${newProject.name}" was successfully created via Discord.`,
            type: NotificationType.PROJECT_UPDATE,
            relatedLink: `/projects/${newProject._id}` // Link to the project details page
        });
        await notification.save();
        
        console.log(`[createProjectForDiscordUser] Project "${projectName}" created successfully for Discord user ${discordUserId} (Labnex User: ${labnexUser.name}).`);
        res.status(201).json({
            message: `Project "${newProject.name}" created successfully!`,
            projectId: newProject._id,
            projectName: newProject.name,
            description: newProject.description,
        });

    } catch (error: any) {
        console.error(`[createProjectForDiscordUser] Error creating project for Discord user ${discordUserId}:`, error.message);
        if (error.code === 11000) { // Mongoose duplicate key error
            // This might occur if there's a unique index on (name, owner) in the Project model, for example.
            return res.status(409).json({ message: `A project with the name "${projectName}" might already exist or there was a conflict. Please try a different name.` });
        }
        res.status(500).json({ message: 'Server error while creating project. Please try again later.' });
    }
};

// Placeholder for future content
export {}; 