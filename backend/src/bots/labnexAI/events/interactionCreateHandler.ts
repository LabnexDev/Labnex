import { CommandInteraction, CacheType, EmbedBuilder, Interaction, GuildMember } from 'discord.js';
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
// Imports for new pre-formatted embed commands
import { execute as handleSendRulesCommand } from '../commands/sendrules';
import { execute as handleSendInfoCommand } from '../commands/sendinfo';
import { execute as handleSendWelcomeCommand } from '../commands/sendwelcome';
import { execute as handleSendRoleSelectCommand } from '../commands/sendroleselect';
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

    let localMessagesReceived = currentMessagesReceived;
    let localMessagesSent = currentMessagesSent;

    // Handle Chat Input (Slash) Commands
    if (interaction.isChatInputCommand()) {
        localMessagesReceived++;
        const { commandName } = interaction;
        console.log(`[interactionCreateHandler.ts] Event: ChatInput Command "${commandName}" from ${interaction.user.tag}`);

        // Helper for replying to slash commands (keeps commandName in scope for logging)
        const slashCmdInteractionReply = async (content: string, ephemeral = false) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, ephemeral });
                } else {
                    await interaction.reply({ content, ephemeral });
                }
                localMessagesSent++;
            } catch (replyError) {
                console.error(`[InteractionCreate/SlashCmd/${commandName}] Error sending reply:`, replyError);
            }
        };

        // Helper for sending DMs from slash commands (keeps commandName in scope for logging)
        const slashCmdSendDm = async (content: string) => {
            try {
                await interaction.user.send(content);
                localMessagesSent++;
            } catch (dmError) {
                console.error(`[InteractionCreate/SlashCmd/${commandName}] Error sending DM:`, dmError);
                await slashCmdInteractionReply("I tried to send you a DM, but it failed. Please check your privacy settings.", true);
            }
        };

        // Existing slash command logic using the new helper names
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
            localMessagesSent++; 
        } else if (commandName === 'linkaccount') {
            await handleLinkAccount(interaction.user.id, interaction.user.tag, slashCmdInteractionReply, slashCmdSendDm);
        } else if (commandName === 'projects') {
            await handleMyProjectsCommand(interaction.user.id, slashCmdInteractionReply, interaction);
        } else if (commandName === 'tasks') {
            const projectIdentifier = getInteractionStringOption(interaction, 'project', false);
            await handleProjectTasksCommand(interaction.user.id, projectIdentifier, slashCmdInteractionReply, interaction);
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
                await handleCreateTaskCommand(options, slashCmdInteractionReply, interaction);
            } else {
                await slashCmdInteractionReply("Missing required options for creating a task (project or title).", true);
            }
        } else if (commandName === 'taskinfo') {
            const taskIdentifierArg = getInteractionStringOption(interaction, 'task_identifier', true);
            if (taskIdentifierArg) {
                await handleTaskInfoCommand(interaction.user.id, taskIdentifierArg, slashCmdInteractionReply, interaction);
            } else {
                await slashCmdInteractionReply('The task identifier (ID or title) is required. Please provide it.', true);
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
        } else if (['sendembed', 'sendrules', 'sendinfo', 'sendwelcome', 'sendroleselect'].includes(commandName)) {
            // Guild-only command check
            if (!interaction.inGuild()) {
                await slashCmdInteractionReply("This command can only be used within a server.", true);
                return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
            }
            // Now it's safe to cast and proceed
            const guildInteraction = interaction as CommandInteraction<'cached'>;
            switch (commandName) {
                case 'sendembed': await handleSendEmbedCommand(guildInteraction); break;
                case 'sendrules': await handleSendRulesCommand(guildInteraction); break;
                case 'sendinfo': await handleSendInfoCommand(guildInteraction); break;
                case 'sendwelcome': await handleSendWelcomeCommand(guildInteraction); break;
                case 'sendroleselect': await handleSendRoleSelectCommand(guildInteraction); break;
            }
        } else {
            console.log(`[interactionCreateHandler.ts] Unrecognized slash command: ${commandName}`);
            await slashCmdInteractionReply("Sorry, I don't recognize that command.", true);
        }
    // Handle Button Interactions
    } else if (interaction.isButton()) {
        localMessagesReceived++;
        const { customId } = interaction;
        console.log(`[interactionCreateHandler.ts] Event: Button "${customId}" from ${interaction.user.tag}`);

        if (!interaction.inGuild()) { // Primary guard for guild context
            console.error('[interactionCreateHandler.ts] Button interaction received, but not from a guild.');
            if (interaction.isRepliable()) {
                try {
                    await interaction.reply({ content: "This action can only be performed within a server.", ephemeral: true });
                    localMessagesSent++;
                } catch (e) { console.error("Failed to send error reply for non-guild button", e); }
            }
            return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
        }

        // Secondary guard for member, though member should be present if inGuild() is true
        if (!interaction.member || !('roles' in interaction.member)) {
             console.error('[interactionCreateHandler.ts] Button interaction in guild, but member object is not as expected.');
             if (interaction.isRepliable()) {
                try {
                    await interaction.reply({ content: "Error processing your role: member data incomplete.", ephemeral: true });
                    localMessagesSent++;
                } catch (e) { console.error("Failed to send error reply for member data issue", e); }
            }
            return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
        }
        
        // interaction.guild is now guaranteed non-null by inGuild() check.
        // interaction.member is GuildMember due to 'roles' in interaction.member check and inGuild().
        const member = interaction.member as GuildMember; // Explicit cast for clarity and full GuildMember methods
        const guild = interaction.guild!; // Use non-null assertion for guild as linter is being difficult

        const testerRole = guild.roles.cache.find(role => role.name === 'Tester');
        const devRole = guild.roles.cache.find(role => role.name === 'Developer');
        let replyMessage = "An unexpected error occurred while assigning the role.";

        if (customId === 'assign_tester') {
            if (testerRole) {
                try {
                    await member.roles.add(testerRole);
                    replyMessage = "✅ You've been assigned the **Tester** role!";
                } catch (roleError) {
                    console.error(`[InteractionCreate/Button/assign_tester] Error adding role:`, roleError);
                    replyMessage = "There was an error assigning the Tester role. Please contact an admin.";
                }
            } else {
                console.warn(`[interactionCreateHandler.ts] 'Tester' role not found in guild ${guild.name}.`);
                replyMessage = "The \"Tester\" role could not be found. Please contact an admin.";
            }
        } else if (customId === 'assign_developer') {
            if (devRole) {
                try {
                    await member.roles.add(devRole);
                    replyMessage = "✅ You've been assigned the **Developer** role!";
                } catch (roleError) {
                    console.error(`[InteractionCreate/Button/assign_developer] Error adding role:`, roleError);
                    replyMessage = "There was an error assigning the Developer role. Please contact an admin.";
                }
            } else {
                console.warn(`[interactionCreateHandler.ts] 'Developer' role not found in guild ${guild.name}.`);
                replyMessage = "The \"Developer\" role could not be found. Please contact an admin.";
            }
        } else {
            console.log(`[interactionCreateHandler.ts] Unrecognized button customId for role assignment: ${customId}`);
            return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent }; 
        }

        try {
            await interaction.reply({ content: replyMessage, ephemeral: true });
            localMessagesSent++;
        } catch (buttonReplyError) {
            console.error(`[InteractionCreate/Button/${customId}] Error sending button reply:`, buttonReplyError);
            if (interaction.deferred) {
                try {
                    await interaction.followUp({content: replyMessage, ephemeral: true});
                    localMessagesSent++;
                } catch (followUpError) {
                     console.error(`[InteractionCreate/Button/${customId}] Error sending button followUp:`, followUpError);
                }
            }
        }
    }
    // Future: else if (interaction.isModalSubmit()) { ... }
    // Future: else if (interaction.isStringSelectMenu()) { ... }

    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
} 