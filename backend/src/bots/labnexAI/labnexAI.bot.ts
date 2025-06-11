console.log('[labnexAI.bot.ts] Script execution started.'); // VERY FIRST LINE

// Labnex AI Bot - Main Logic (using discord.js)
import { Client, GatewayIntentBits, Events, Partials, InteractionType, CommandInteraction, CacheType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path'; // Import path
import axios from 'axios'; // For making API calls to Labnex backend
import { askChatGPT, assistWithCode, getIntentAndEntitiesFromQuery, NLUResponse } from './chatgpt.service';
import {
    LabnexProject,
    LabnexProjectDetails,
    LabnexTaskItem,
    LabnexUserTask,
    LabnexTaskDetails,
    LabnexNote,
    LabnexSnippet,
    TestCaseInProgress,
    CreateTaskOptions
} from './types/labnexAI.types';
import {
    handleLinkAccount,
    handleMyProjectsCommand,
    handleGetProjectDetailsCommand
} from './commands/projectCommands';
import {
    testCasesInProgress,
    handleTestCaseCreationStep
} from './commands/testCaseCommands'; // Import test case command handlers
import {
    handleProjectTasksCommand,
    handleCreateTaskCommand,
    handleTaskInfoCommand,
    handleUpdateTaskStatusCommand,
    handleGetTaskDetailsCommand as handleGetTaskDetailsCommandNLU,
    handleListTasksCommand as handleListTasksCommandNLU,
    handleUpdateTaskStatusCommandNLU
} from './commands/taskCommands'; // Import task command handlers
import {
    handleAddNoteCommand,
    handleListNotesCommand
} from './commands/noteCommands';
import {
    handleListSnippetsCommand as handleListSnippetsCommandNLU,
    handleCreateSnippetCommand as handleCreateSnippetCommandNLU
} from './commands/snippetCommands';

console.log('[labnexAI.bot.ts] Basic imports successful.');

// Configure dotenv to load from the root project directory
// Path is relative from the compiled JS file in dist/bots/labnexAI/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); 
console.log('[labnexAI.bot.ts] dotenv.config() completed, attempting to load from:', path.resolve(__dirname, '../../../.env'));

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const LABNEX_API_URL = process.env.LABNEX_API_URL; // e.g., http://localhost:5000/api
const LABNEX_FRONTEND_URL = process.env.LABNEX_FRONTEND_URL; // e.g., http://localhost:5173
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;
const LINK_TOKEN_EXPIRY_MINUTES = 15;

// Export for use in event handlers if needed, though direct process.env access is preferred for constants.
// For stateful counters, they need to be updated in the main scope.
export let messagesReceivedFromDiscord = 0;
export let messagesSentToUser = 0;

console.log(`[labnexAI.bot.ts] DISCORD_BOT_TOKEN loaded: ${DISCORD_BOT_TOKEN ? 'Exists' : 'MISSING'}`);
console.log(`[labnexAI.bot.ts] LABNEX_API_URL loaded: ${LABNEX_API_URL ? 'Exists' : 'MISSING'}`);
console.log(`[labnexAI.bot.ts] LABNEX_FRONTEND_URL loaded: ${LABNEX_FRONTEND_URL ? 'Exists' : 'MISSING'}`);
console.log(`[labnexAI.bot.ts] LABNEX_API_BOT_SECRET loaded: ${LABNEX_API_BOT_SECRET ? 'Exists' : 'MISSING'}`);
console.log(`[labnexAI.bot.ts] OPENAI_API_KEY loaded: ${process.env.OPENAI_API_KEY ? 'Exists' : 'MISSING'}`);

// --- Helper function for Slash Command Option Parsing ---
// MOVED to events/interactionCreateHandler.ts
// -----------------------------------------------------

// --- Statistics Tracking ---
let statsInterval: NodeJS.Timeout | null = null;
// ---------------------------

if (!DISCORD_BOT_TOKEN) {
    console.error('[labnexAI.bot.ts] Error: DISCORD_BOT_TOKEN is not set. Exiting process.');
    process.exit(1); // Ensure script exits if token is missing
}
if (!LABNEX_API_URL) {
    console.error('Error: LABNEX_API_URL is not set for bot to contact backend.');
    process.exit(1);
}
if (!LABNEX_FRONTEND_URL) {
    console.error('Error: LABNEX_FRONTEND_URL is not set for bot to construct linking URLs.');
    process.exit(1);
}
if (!LABNEX_API_BOT_SECRET) {
    console.error('Error: LABNEX_API_BOT_SECRET is not set for bot authentication.');
    process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
    console.error('Warning: OPENAI_API_KEY is not set. ChatGPT features will be disabled.');
}

console.log('[labnexAI.bot.ts] Initializing Discord client...');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});
console.log('[labnexAI.bot.ts] Discord client initialized.');

client.once(Events.ClientReady, readyClient => {
    console.log(`[labnexAI.bot.ts] Discord ClientReady event: Logged in as ${readyClient.user.tag}`);
    // Start sending stats periodically once the bot is ready
    if (statsInterval) clearInterval(statsInterval);
    statsInterval = setInterval(() => {
        if (process.send) { // Check if IPC channel is available
            process.send({
                type: 'stats',
                data: {
                    messagesSent: messagesSentToUser,
                    messagesReceived: messagesReceivedFromDiscord,
                }
            });
        }
    }, 7000); // Send stats every 7 seconds
});

// Refactored command logic for account linking
// MOVED TO commands/projectCommands.ts

// Refactored command logic for listing user projects
// MOVED TO commands/projectCommands.ts

// Refactored command logic for listing project tasks
// MOVED to commands/taskCommands.ts

// Refactored command logic for creating a task
// MOVED to commands/taskCommands.ts

// Refactored command logic for fetching task details
// MOVED to commands/taskCommands.ts

// Handles the /updatetask status slash command.
// MOVED to commands/taskCommands.ts

// Handler function for getting task details via NLU
// MOVED to commands/taskCommands.ts

// Handler function for listing project tasks via NLU
// MOVED to commands/taskCommands.ts

// Handler function for updating task status via NLU
// MOVED to commands/taskCommands.ts

// Handler function for adding a note via NLU
// MOVED to commands/noteCommands.ts

// New handler function for listing notes, similar to the slash command logic
// MOVED to commands/noteCommands.ts

// Handler function for getting project details via NLU
// MOVED to commands/projectCommands.ts

// Handler function for listing code snippets via NLU
// MOVED to commands/snippetCommands.ts

// Handler function for creating a code snippet via NLU
// MOVED to commands/snippetCommands.ts

//**********************************************************************
// IMPORT EVENT HANDLERS
//**********************************************************************
import { handleInteractionCreateEvent, updateInteractionCounters } from './events/interactionCreateHandler';
import { handleMessageCreateEvent } from './events/messageCreateHandler';
import { handleGuildMemberAddEvent } from './events/guildMemberAdd';
import { handleMessageReactionAddEvent } from './events/messageReactionAdd';

//**********************************************************************
// SLASH COMMAND (INTERACTION) HANDLER
//**********************************************************************
client.on(Events.InteractionCreate, async interaction => {
    const counters = await handleInteractionCreateEvent(interaction, messagesReceivedFromDiscord, messagesSentToUser);
    messagesReceivedFromDiscord = counters.updatedMessagesReceived;
    messagesSentToUser = counters.updatedMessagesSent;
    // updateInteractionCounters(counters.updatedMessagesReceived, counters.updatedMessagesSent); // Alternative way if handler directly updates its own imported counters
});

//**********************************************************************
// GENERAL MESSAGE (NLU AND CONVERSATIONAL) HANDLER
//**********************************************************************
client.on(Events.MessageCreate, async message => {
    const counters = await handleMessageCreateEvent(message, client, messagesReceivedFromDiscord, messagesSentToUser);
    messagesReceivedFromDiscord = counters.updatedMessagesReceived;
    messagesSentToUser = counters.updatedMessagesSent;
});

//**********************************************************************
// REACTION ROLE HANDLER
//**********************************************************************
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    await handleMessageReactionAddEvent(reaction, user);
});

//**********************************************************************
// NEW MEMBER JOIN HANDLER
//**********************************************************************
client.on(Events.GuildMemberAdd, async member => {
    console.log(`[labnexAI.bot.ts] Event: GuildMemberAdd - ${member.user.tag} joined ${member.guild.name}`);
    await handleGuildMemberAddEvent(member);
});

//**********************************************************************
// REACTION TO RULES MESSAGE HANDLER
//**********************************************************************
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    await handleMessageReactionAddEvent(reaction, user);
});

// Bot login
if (DISCORD_BOT_TOKEN) {
    console.log('[labnexAI.bot.ts] Logging in...');
    client.login(DISCORD_BOT_TOKEN).catch(error => {
        console.error('[labnexAI.bot.ts] Failed to log in:', error.message);
        if (error.code === 'TokenInvalid') {
            console.error('[labnexAI.bot.ts] The DISCORD_BOT_TOKEN is invalid. Please check the .env file and reset the token in the Discord Developer Portal if necessary.');
        } else if (error.message.includes('Disallowed intents')) {
            console.error('[labnexAI.bot.ts] CRITICAL: Your bot is missing required Privileged Gateway Intents.');
            console.error('[labnexAI.bot.ts] Please go to your bot\'s application page on the Discord Developer Portal (https://discord.com/developers/applications)');
            console.error('[labnexAI.bot.ts] and enable the "MESSAGE CONTENT INTENT" and "GUILD MEMBERS INTENT" under the "Bot" tab.');
        }
        process.exit(1);
    });
} else {
    console.error('[labnexAI.bot.ts] Error: DISCORD_BOT_TOKEN is not set. Bot will not start.');
}