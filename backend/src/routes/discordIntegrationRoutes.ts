import express from 'express';
// import {  // Old import from single controller
//     generateLinkToken,
//     linkDiscordAccount,
//     getLinkedDiscordAccounts,
//     unlinkDiscordAccount,
//     getProjectsForDiscordUser,
//     getProjectDetailsForDiscordUser,
//     getProjectTasksForDiscordUser,
//     createNoteForDiscordSlashCommand,
//     getNotesForDiscordUser,
//     createSnippetForDiscordSlashCommand,
//     getSnippetsForDiscordUser,
//     getMyTasksForDiscordUser,
//     createTaskForDiscordUser,
//     updateTaskStatusForDiscordUser,
//     getTaskDetailsForDiscordUser,
//     createProjectForDiscordUser,
//     createTestCaseForDiscordUser,
//     createProjectFromDiscordNaturalLanguage
// } from '../controllers/discordIntegrationController';

// New imports from specialized controllers
import {
    generateLinkToken,
    linkDiscordAccount,
    getLinkedDiscordAccounts,
    unlinkDiscordAccount
} from '../controllers/discordLinkController';

import {
    getProjectsForDiscordUser,
    getProjectDetailsForDiscordUser,
    createProjectForDiscordUser
    // createTestCaseForDiscordUser was moved to discordTaskController
} from '../controllers/discordProjectController';

import {
    getProjectTasksForDiscordUser,
    getMyTasksForDiscordUser,
    createTaskForDiscordUser,
    updateTaskStatusForDiscordUser,
    getTaskDetailsForDiscordUser,
    createTestCaseForDiscordUser, // Confirmed: createTestCaseForDiscordUser is in discordTaskController
    updateTestCaseStatusForDiscordUser, // Added for the new functionality
    getTestCasesForProject,
    updateTestCasePriorityForDiscordUser // Added for the new functionality
} from '../controllers/discordTaskController';

import {
    createNoteForDiscordSlashCommand,
    getNotesForDiscordUser
} from '../controllers/discordNoteController';

import {
    createSnippetForDiscordSlashCommand,
    getSnippetsForDiscordUser
} from '../controllers/discordSnippetController';

import {
    createProjectFromDiscordNaturalLanguage
} from '../controllers/discordProjectSetupController';

import { auth } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/integrations/discord/generate-link-token
// @desc    Called by the Discord bot to generate a one-time token for account linking.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/generate-link-token', generateLinkToken);

// @route   POST /api/integrations/discord/link-account
// @desc    Links a Labnex user account with a Discord account using a verified token.
// @access  Private (Labnex user authenticated by JWT)
router.post('/link-account', auth, linkDiscordAccount);

// @route   GET /api/integrations/discord/linked-accounts
// @desc    Get all Discord accounts linked to the current Labnex user
// @access  Private (Labnex user authenticated by JWT)
router.get('/linked-accounts', auth, getLinkedDiscordAccounts);

// @route   DELETE /api/integrations/discord/unlink-account/:discordUserIdToDelete
// @desc    Unlink a specific Discord account from the current Labnex user
// @access  Private (Labnex user authenticated by JWT)
router.delete('/unlink-account/:discordUserIdToDelete', auth, unlinkDiscordAccount);

// @route   GET /api/integrations/discord/my-projects
// @desc    Called by the Discord bot to fetch projects for a linked Discord user.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/my-projects', getProjectsForDiscordUser);

// @route   GET /api/integrations/discord/project-details
// @desc    Called by the Discord bot to fetch specific project details for a linked Discord user.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/project-details', getProjectDetailsForDiscordUser);

// @route   GET /api/integrations/discord/project-tasks
// @desc    Called by the Discord bot to fetch tasks for a specific project.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/project-tasks', getProjectTasksForDiscordUser);

// @route   GET /api/integrations/discord/projects/:projectIdentifier/test-cases
// @desc    Called by the Discord bot to fetch test cases for a specific project.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/projects/:projectIdentifier/test-cases', getTestCasesForProject);

// @route   POST /api/integrations/discord/notes (for Slash Commands)
// @desc    Called by the Discord bot (slash command) to create a new note.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/notes', createNoteForDiscordSlashCommand);

// @route   GET /api/integrations/discord/notes (for Slash Commands)
// @desc    Called by the Discord bot (slash command) to list notes for a user.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/notes', getNotesForDiscordUser);

// @route   POST /api/integrations/discord/snippets (for Slash Commands)
// @desc    Called by the Discord bot (slash command) to create a new snippet.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/snippets', createSnippetForDiscordSlashCommand);

// @route   GET /api/integrations/discord/snippets (for Slash Commands)
// @desc    Called by the Discord bot (slash command) to list snippets for a user.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/snippets', getSnippetsForDiscordUser);

// @route   GET /api/integrations/discord/my-tasks
// @desc    Called by the Discord bot to fetch tasks assigned to the linked Discord user.
// @access  Private (Bot authenticated by secret key in controller)
router.get('/my-tasks', getMyTasksForDiscordUser);

// @route   GET /api/integrations/discord/task-details/:taskIdentifier
// @desc    Get details for a specific task for a Discord user
// @access  Private (Bot authenticated by secret or user linked)
router.get(
    '/task-details/:taskIdentifier',
    // We might need a specific bot authentication middleware here or handle it in the controller
    // For now, assuming controller handles auth via x-bot-secret or linked discordUserId
    getTaskDetailsForDiscordUser
);

// @route   POST /api/integrations/discord/tasks
// @desc    Called by the Discord bot to create a task for a linked user.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/tasks', createTaskForDiscordUser);

// @route   PUT /api/integrations/discord/tasks/:taskIdentifier/status
// @desc    Called by the Discord bot to update task status.
// @access  Private (Bot authenticated by secret key in controller)
router.put('/tasks/:taskIdentifier/status', updateTaskStatusForDiscordUser);

// @route   POST /api/integrations/discord/projects
// @desc    Called by the Discord bot to create a new project for a linked user.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/projects', createProjectForDiscordUser);

// @route   POST /api/integrations/discord/test-cases
// @desc    Called by the Discord bot to create a new test case for a linked user.
// @access  Private (Bot authenticated by secret key in controller)
router.post('/test-cases', createTestCaseForDiscordUser);

// @route   PUT /api/integrations/discord/test-cases/:testCaseIdentifier/status
// @desc    Called by the Discord bot to update test case status.
// @access  Private (Bot authenticated by secret key in controller)
router.put('/test-cases/:testCaseIdentifier/status', updateTestCaseStatusForDiscordUser);

// @route   PUT /api/integrations/discord/test-cases/:testCaseIdentifier/priority
// @desc    Called by the Discord bot to update test case priority.
// @access  Private (Bot authenticated by secret key in controller)
router.put('/test-cases/:testCaseIdentifier/priority', updateTestCasePriorityForDiscordUser);

// Route for project setup via natural language
router.post(
    '/project-setup', 
    auth,
    createProjectFromDiscordNaturalLanguage
);

export default router; 