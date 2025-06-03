import { CommandInteraction, CacheType, EmbedBuilder, Interaction } from 'discord.js';
import axios from 'axios';
import {
    handleLinkAccount,
    handleMyProjectsCommand,
    // handleGetProjectDetailsCommand // Not used by slash commands directly, only NLU
} from '../commands/projectCommands';
import {
    handleProjectTasksCommand,
    handleCreateTaskCommand,
    handleTaskInfoCommand,
    handleUpdateTaskStatusCommand,
} from '../commands/taskCommands';
import { handleAddNoteSlashCommand, handleListNotesSlashCommand } from '../commands/noteCommands';
import { handleAddSnippetSlashCommand, handleListSnippetsSlashCommand } from '../commands/snippetCommands';
import { execute as handleSendEmbedCommand } from '../commands/sendEmbedCommand';
import { CreateTaskOptions, LabnexNote, LabnexSnippet } from '../types/labnexAI.types';
import { getInteractionStringOption } from '../utils/discordHelpers';

// These will be imported from the main bot file initially
// For a cleaner approach, these could be part of a shared context or class instance
let messagesReceivedFromDiscord = 0;
let messagesSentToUser = 0;

// Constants that would also ideally be managed better (e.g. config service)
const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;


// Helper function for Slash Command Option Parsing (moved from main bot file)
/* // Removing this local definition
function getInteractionStringOption(
    interaction: CommandInteraction<CacheType>,
    name: string,
    required: boolean
): string | null {
    const option = interaction.options.get(name, required);
    if (option && typeof option.value === 'string') {
        return option.value;
    }
    if (option && typeof option.value === 'number') {
        return option.value.toString();
    }
    if (option && typeof option.value === 'boolean') {
        return option.value.toString();
    }
    return null;
}
*/

export function updateInteractionCounters(newReceived: number, newSent: number) {
    messagesReceivedFromDiscord = newReceived;
    messagesSentToUser = newSent;
}


export async function handleInteractionCreateEvent(
    interaction: Interaction,
    currentMessagesReceived: number,
    currentMessagesSent: number
): Promise<{ updatedMessagesReceived: number, updatedMessagesSent: number }> {

    let localMessagesReceived = currentMessagesReceived; // Use local variables for manipulation
    let localMessagesSent = currentMessagesSent;

    if (!interaction.isChatInputCommand()) return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };

    localMessagesReceived++;
    const { commandName } = interaction;

    console.log(`[interactionCreateHandler.ts] Event: Command "${commandName}" from ${interaction.user.tag}`);

    const interactionReply = async (content: string, ephemeral = false) => {
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content, ephemeral });
            } else {
                await interaction.reply({ content, ephemeral });
            }
            localMessagesSent++; // Increment local counter
        } catch (replyError) {
            console.error(`[InteractionCreate/${commandName}] Error sending reply:`, replyError);
        }
    };

    const sendDm = async (content: string) => {
        try {
            await interaction.user.send(content);
            localMessagesSent++; // Increment local counter
        } catch (dmError) {
            console.error(`[InteractionCreate/${commandName}] Error sending DM:`, dmError);
            await interactionReply("I tried to send you a DM, but it failed. Please check your privacy settings.", true);
        }
    };

    if (commandName === 'help') {
        const commandList = [
            { name: 'help', description: 'Displays the list of available commands.' },
            { name: 'linkaccount', description: 'Link your Discord account with your Labnex account.' },
            { name: 'projects', description: 'Lists Labnex projects you have access to.' },
            { name: 'tasks', description: 'Lists tasks for a specified project. (Optional: project name/ID)' },
            { name: 'createtask', description: 'Creates a new task in the specified project. (Requires: project, title)' },
            { name: 'taskinfo', description: 'Displays detailed information about a specific task. (Requires: task identifier)' },
            { name: 'updatetask status', description: 'Updates the status of a task. (Requires: task identifier, new status)' },
            { name: 'addnote', description: 'Creates a new note. (Requires: title, body)' },
            { name: 'notes', description: 'Lists your recent notes.' },
            { name: 'addsnippet', description: 'Creates a new code snippet. (Requires: language, title, code)' },
            { name: 'snippets', description: 'Lists your recent code snippets.' },
        ];

        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Labnex Bot Help')
            .setDescription('Here are the available slash commands:')
            .setTimestamp();

        commandList.forEach(cmd => {
            helpEmbed.addFields({ name: `/${cmd.name}`, value: cmd.description });
        });

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

    } else if (commandName === 'linkaccount') {
        await handleLinkAccount(interaction.user.id, interaction.user.tag, interactionReply, sendDm);
    } else if (commandName === 'projects') {
        await handleMyProjectsCommand(interaction.user.id, interactionReply, interaction);
    } else if (commandName === 'tasks') {
        const projectIdentifier = getInteractionStringOption(interaction, 'project', false);
        await handleProjectTasksCommand(interaction.user.id, projectIdentifier, interactionReply, interaction);
    } else if (commandName === 'createtask') {
        const options: CreateTaskOptions = {
            discordUserId: interaction.user.id,
            projectIdentifier: getInteractionStringOption(interaction, 'project', true) || '',
            title: getInteractionStringOption(interaction, 'title', true) || '',
            description: getInteractionStringOption(interaction, 'description', false),
            priority: getInteractionStringOption(interaction, 'priority', false),
            status: getInteractionStringOption(interaction, 'status', false),
            dueDate: getInteractionStringOption(interaction, 'due_date', false),
        };
        if (options.projectIdentifier && options.title) {
            await handleCreateTaskCommand(options, interactionReply, interaction);
        } else {
            await interactionReply("Missing required options for creating a task (project or title).", true);
        }
    } else if (commandName === 'taskinfo') {
        const taskIdentifierArg = getInteractionStringOption(interaction, 'task_identifier', true);
        if (taskIdentifierArg) {
            await handleTaskInfoCommand(interaction.user.id, taskIdentifierArg, interactionReply, interaction);
        } else {
            await interactionReply('The task identifier (ID or title) is required. Please provide it.', true);
        }
    } else if (commandName === 'updatetask') {
        await handleUpdateTaskStatusCommand(interaction);
    } else if (commandName === 'addnote') {
        await handleAddNoteSlashCommand(interaction);
    } else if (commandName === 'notes') {
        await handleListNotesSlashCommand(interaction);
    } else if (commandName === 'addsnippet') {
        await handleAddSnippetSlashCommand(interaction);
    } else if (commandName === 'snippets') {
        await handleListSnippetsSlashCommand(interaction);
    } else if (commandName === 'sendembed') {
        await handleSendEmbedCommand(interaction as CommandInteraction<'cached'>);
    } else {
        console.log(`[interactionCreateHandler.ts] Unrecognized slash command: ${commandName}`);
        await interactionReply("Sorry, I don't recognize that command.", true);
    }
    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
} 