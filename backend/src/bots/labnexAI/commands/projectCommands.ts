import axios from 'axios';
import { CommandInteraction, CacheType, Message } from 'discord.js';
import {
    LabnexProject,
    LabnexProjectDetails,
    ProjectCreationInProgress,
    ProjectCreationField
} from '../types/labnexAI.types';

export const projectsInProgress: Map<string, ProjectCreationInProgress> = new Map();

const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_FRONTEND_URL = process.env.LABNEX_FRONTEND_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;
const LINK_TOKEN_EXPIRY_MINUTES = 15;

// Refactored command logic for account linking
export async function handleLinkAccount(
    discordUserId: string,
    discordUsername: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>,
    sendDmFunction: (content: string) => Promise<void | any>
) {
    try {
        await replyFunction("I'm generating a unique link for you to connect your Labnex account. I'll send it via DM.", true);

        const apiResponse = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/generate-link-token`,
            { discordUserId, discordUsername },
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );

        const linkToken = apiResponse.data.linkToken;
        if (!linkToken) {
            throw new Error('No linkToken received from API.');
        }

        console.log('[Labnex DEBUG] Generating Discord link with LABNEX_FRONTEND_URL:', LABNEX_FRONTEND_URL);

        const discordUsernameEncoded = encodeURIComponent(discordUsername);
        const linkUrl = `${LABNEX_FRONTEND_URL}/users/discord/link?token=${linkToken}&discord_id=${discordUserId}&discord_username=${discordUsernameEncoded}`;

        await sendDmFunction(
            `Hello! To link your Discord account with Labnex, please use the following unique link (expires in ${LINK_TOKEN_EXPIRY_MINUTES} minutes):\n${linkUrl}\n\nIf you did not request this, please ignore this message.`
        );
        console.log(`[handleLinkAccount] Sent account linking DM to ${discordUsername} (${discordUserId})`);

    } catch (error: any) {
        console.error(`[handleLinkAccount] Error during account linking process for ${discordUsername} (${discordUserId}):`, error.response?.data || error.message);
        await replyFunction("Sorry, I couldn't start the account linking process. Please try again later or contact an admin.", true);
    }
}

// Refactored command logic for listing user projects
export async function handleMyProjectsCommand(
    discordUserId: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>,
    interaction?: CommandInteraction<CacheType> // Optional: Pass interaction for typing
) {
    console.log(`[handleMyProjectsCommand] Handling for user ${discordUserId}`);
    if (interaction?.channel &&
        ('sendTyping' in interaction.channel) &&
        typeof interaction.channel.sendTyping === 'function') {
        try {
            await interaction.channel.sendTyping();
        } catch (e) { console.warn("Typing indicator failed in handleMyProjectsCommand", e); }
    }
    try {
        const apiResponse = await axios.get<LabnexProject[]>(
            `${LABNEX_API_URL}/integrations/discord/my-projects`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: { discordUserId }
            }
        );

        const projects = apiResponse.data;

        if (projects && projects.length > 0) {
            const projectList = projects.map((p: LabnexProject) =>
                `- **${p.name}** (ID: ${p.id})${p.description ? `\n  *Description: ${p.description.substring(0, 100)}${p.description.length > 100 ? '...' : ''}*` : ''}`
            ).join('\n');
            await replyFunction(`Here are your Labnex projects:\n${projectList}`);
        } else {
            await replyFunction("You don't seem to have any projects in Labnex, or your account isn't linked. Use `!labnex link-account` or `/linkaccount` to link your account.", true);
        }

    } catch (error: any) {
        console.error(`[handleMyProjectsCommand] Error fetching projects for user ${discordUserId}:`, error.response?.data || error.message);
        if (error.response?.status === 404 && error.response?.data?.message.includes('not linked')) {
            await replyFunction("Your Discord account is not linked to a Labnex account. Please use `!labnex link-account` or `/linkaccount` first.", true);
        } else {
            await replyFunction("Sorry, I couldn't fetch your projects. Please ensure your account is linked and try again later.", true);
        }
    }
}

// Handler function for getting project details via NLU
export async function handleGetProjectDetailsCommand(
    discordUserId: string,
    projectIdentifier: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleGetProjectDetailsCommand] Handling for user ${discordUserId}, Project Identifier: "${projectIdentifier}"`);

    if (!projectIdentifier) {
        await replyFunction("A project name or ID is required to get its details.", true);
        return;
    }

    try {
        const apiResponse = await axios.get<LabnexProjectDetails>(
            `${LABNEX_API_URL}/integrations/discord/project-details`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: {
                    discordUserId: discordUserId,
                    projectIdentifier: projectIdentifier
                }
            }
        );

        const projectDetails = apiResponse.data;
        if (!projectDetails) { // Should be caught by axios error handling if API returns 404 for not found
            await replyFunction(`Could not retrieve details for project "${projectIdentifier}".`, true);
            return;
        }

        const replyMessages = [
            `**Project Details (via NLU): ${projectDetails.name}** (ID: ${projectDetails.id})`,
            `*Description:* ${projectDetails.description || 'No description provided.'}`,
            `*Owner:* ${projectDetails.owner}`,
            `*Status:* ${projectDetails.isActive ? 'Active' : 'Inactive'}`,
            `*Members:* ${projectDetails.memberCount}`,
            `*Test Cases:* ${projectDetails.testCaseCount}`,
            `*Created:* ${new Date(projectDetails.createdAt).toLocaleDateString()}`,
            `*Last Updated:* ${new Date(projectDetails.updatedAt).toLocaleDateString()}`,
        ];
        await replyFunction(replyMessages.join('\n'), false);

    } catch (error: any) {
        console.error(`[handleGetProjectDetailsCommand] Error fetching project details for "${projectIdentifier}":`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || `Sorry, I couldn't fetch details for project "${projectIdentifier}". Please ensure the name/ID is correct, your account is linked, and you have permissions.`;
        await replyFunction(errorMessage, true);
    }
}

// Stores the actual API call logic for creating a project
async function callCreateProjectAPI(
    discordUserId: string,
    projectNameArgument: string,
    projectDescription: string | null | undefined,
    projectCode: string | null | undefined,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<Message | void | any>
) {
    console.log(`[callCreateProjectAPI] Creating project "${projectNameArgument}" with code "${projectCode}" for user ${discordUserId}`);
    try {
        const payload: { projectName: string; description?: string; discordUserId: string; projectCode?: string } = {
            projectName: projectNameArgument,
            discordUserId: discordUserId,
        };
        if (projectDescription) payload.description = projectDescription;
        if (projectCode) payload.projectCode = projectCode;

        const response = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/projects`,
            payload,
            {
                headers: { 
                    'x-bot-secret': LABNEX_API_BOT_SECRET,
                }
            }
        );

        if (response.data && response.data.id && response.data.name) {
            await replyFunction(`Project "${response.data.name}" (ID: ${response.data.id}) created successfully! View it at ${LABNEX_FRONTEND_URL}/projects/${response.data.id}`, false);
        } else {
            await replyFunction(response.data.message || `Project "${projectNameArgument}" created, but I couldn't get all details back.`, false);
        }
    } catch (error: any) {
        console.error(`[callCreateProjectAPI] Error creating project "${projectNameArgument}":`, error.response?.data || error.message);
        let errorMessage = `Sorry, I couldn't create project "${projectNameArgument}".`;
        if (error.response?.status === 403) {
             errorMessage = "It seems I don't have permission to create projects, or your account is not authorized for this action.";
        } else if (error.response?.status === 404 && error.response?.data?.message?.includes('not linked')) {
            errorMessage = "Your Discord account is not linked to a Labnex account. Please use `!labnex link-account` or `/linkaccount` first.";
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message.includes('connect ECONNREFUSED')) {
            errorMessage = "I couldn't connect to the Labnex API. Please try again later.";
        }
        await replyFunction(errorMessage, true);
    }
}

export async function handleProjectCreationStep(
    message: Message,
    progress: ProjectCreationInProgress
): Promise<void> {
    const userInput = message.content.trim();
    const replyFunction = async (content: string, ephemeral = false) => message.reply(content);

    if (userInput.toLowerCase() === 'cancel') {
        projectsInProgress.delete(progress.discordUserId);
        await replyFunction("Project creation cancelled.", true);
        return;
    }

    let nextQuestionField: ProjectCreationField = progress.currentQuestionField;
    let botResponse = '';

    switch (progress.currentQuestionField) {
        case 'projectName':
            if (!userInput) {
                await replyFunction("Project name cannot be empty. Please provide a name for your project, or type 'cancel'.");
                return;
            }
            progress.projectName = userInput;
            progress.currentQuestionField = 'projectCode';
            nextQuestionField = 'projectCode';
            botResponse = 'Got it. Now, what should be the **project code**? This should be 3-5 alphanumeric characters (e.g., LABNX, PRJ01).';
            break;

        case 'projectCode':
            if (!userInput || userInput.length < 3 || userInput.length > 5 || !/^[a-zA-Z0-9]+$/.test(userInput)) {
                await replyFunction('Project code must be 3-5 alphanumeric characters. Please provide a valid code, or type \'cancel\'.');
                return;
            }
            progress.projectCode = userInput.toUpperCase();
            // Optional: Ask for description or go to 'done'
            progress.currentQuestionField = 'projectDescription'; // Or 'done' if description is not actively prompted
            nextQuestionField = 'projectDescription';
            botResponse = 'Excellent. Optionally, you can provide a short **description** for the project. If you want to skip, just type "skip" or "no".';
            break;

        case 'projectDescription':
            if (userInput.toLowerCase() !== 'skip' && userInput.toLowerCase() !== 'no' && userInput.trim() !== '') {
                progress.projectDescription = userInput;
            }
            progress.currentQuestionField = 'done';
            nextQuestionField = 'done';
            break; // No botResponse needed here, will proceed to 'done' case

        default:
            console.warn(`[handleProjectCreationStep] Unknown field: ${progress.currentQuestionField}`);
            projectsInProgress.delete(progress.discordUserId);
            await replyFunction("Something went wrong with project creation. Please try again.", true);
            return;
    }

    if (nextQuestionField === 'done') {
        if (progress.projectName && progress.projectCode) {
            await replyFunction("Great! I have all the details. Creating your project now...");
            await callCreateProjectAPI(
                progress.discordUserId,
                progress.projectName,
                progress.projectDescription,
                progress.projectCode,
                replyFunction
            );
            projectsInProgress.delete(progress.discordUserId);
        } else {
            // Should not happen if logic is correct
            console.error('[handleProjectCreationStep] Reached \'done\' state without all required info.', progress);
            projectsInProgress.delete(progress.discordUserId);
            await replyFunction("Something went wrong before creating the project. Missing details. Please try again.", true);
        }
    } else {
        progress.currentQuestionField = nextQuestionField;
        const botMsg = await replyFunction(botResponse);
        progress.lastBotMessage = botMsg;
        projectsInProgress.set(progress.discordUserId, progress);
    }
}

export async function handleCreateProjectCommandNLU(
    discordUserId: string,
    initialProjectName: string | null | undefined,
    initialProjectDescription: string | null | undefined,
    initialProjectCode: string | null | undefined,
    originalMessage: Message // Changed from replyFunction to originalMessage
) {
    const replyFunction = async (content: string, ephemeral = false) => originalMessage.reply(content);

    if (projectsInProgress.has(discordUserId)) {
        await replyFunction("You are already in the middle of creating a project. Please complete or cancel that one first.", true);
        return;
    }

    // Check if we have enough from NLU to create directly ( unlikely if projectCode is mandatory from backend)
    if (initialProjectName && initialProjectCode) { 
        console.log(`[handleCreateProjectCommandNLU] Attempting direct creation for "${initialProjectName}" with code "${initialProjectCode}"`);
        await callCreateProjectAPI(discordUserId, initialProjectName, initialProjectDescription, initialProjectCode, replyFunction);
        return;
    }

    // Start interactive creation process
    const progress: ProjectCreationInProgress = {
        discordUserId,
        currentQuestionField: 'projectName', // Start by asking for project name
        projectName: initialProjectName || undefined,
        projectDescription: initialProjectDescription || undefined,
        projectCode: initialProjectCode || undefined,
        originalMessage: originalMessage,
    };

    projectsInProgress.set(discordUserId, progress);
    console.log(`[handleCreateProjectCommandNLU] Starting interactive project creation for user ${discordUserId}. Initial data: `, { initialProjectName, initialProjectDescription, initialProjectCode });

    let firstQuestion = '';
    if (!progress.projectName) {
        progress.currentQuestionField = 'projectName';
        firstQuestion = 'Okay, let\'s create a new project! What would you like to name it?';
    } else if (!progress.projectCode) {
        progress.currentQuestionField = 'projectCode';
        firstQuestion = `Project name set to "${progress.projectName}". Now, what should be the **project code**? This should be 3-5 alphanumeric characters (e.g., LABNX, PRJ01).`;
    } else {
        // All required info present from NLU (e.g. project name and code)
        // This case might be rare if user provides everything in one go and NLU extracts it all.
        // We can proceed to ask for optional description or just create.
        progress.currentQuestionField = 'projectDescription'; // Or 'done'
        firstQuestion = `Project name: "${progress.projectName}", Code: "${progress.projectCode}". Optionally, provide a description. Type "skip" or "no" to omit.`;
    }
    
    const botMsg = await replyFunction(firstQuestion);
    progress.lastBotMessage = botMsg;
    projectsInProgress.set(discordUserId, progress); // Update map with message IDs
}
 