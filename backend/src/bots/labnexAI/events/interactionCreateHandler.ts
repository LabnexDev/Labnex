// This is a test comment to reset the file state.
import { CommandInteraction, CacheType, EmbedBuilder, Interaction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, TextChannel } from 'discord.js';
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

async function handleTicketCommand(interaction: CommandInteraction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member as GuildMember;
    const channel = interaction.channel;

    // Helper to check for Staff role or Admin role
    const isStaff = () => member.roles.cache.some(role => role.name === 'Staff' || role.name === 'Admin');

    if (subcommand === 'create') {
        const modal = new ModalBuilder()
            .setCustomId('ticketModal')
            .setTitle('Submit a new ticket');

        const issueDescriptionInput = new TextInputBuilder()
            .setCustomId('issueDescription')
            .setLabel("Please describe your issue in detail")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(issueDescriptionInput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
        return;
    }

    // All other subcommands are staff-only and must be in a thread
    if (!channel || !channel.isThread()) {
        await interaction.reply({ content: 'This command can only be used within a ticket thread.', ephemeral: true });
        return;
    }

    if (!isStaff()) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }
    
    switch (subcommand) {
        case 'close': {
            await interaction.deferReply({ ephemeral: true });

            const reason = getInteractionStringOption(interaction, 'reason', false) || 'No reason provided.';

            try {
                // Update original embed in modmail
                if (channel.parentId) {
                    const modmailChannel = await interaction.guild?.channels.fetch(channel.parentId);
                    if (modmailChannel && modmailChannel.isTextBased()) {
                        const originalMessage = await modmailChannel.messages.fetch(channel.id);
                        if (originalMessage && originalMessage.embeds.length > 0) {
                            const originalEmbed = originalMessage.embeds[0];
                            const updatedEmbed = new EmbedBuilder(originalEmbed.data)
                                .setColor(0xff0000) // Red for closed
                                .spliceFields(1, 1, { name: 'Status', value: 'Closed', inline: true }) // Replace status
                                .addFields(
                                    { name: 'Closed By', value: member.user.tag, inline: true },
                                    { name: 'Reason', value: reason }
                                );
                            await originalMessage.edit({ embeds: [updatedEmbed] });
                        }
                    }
                }
            } catch (e) {
                console.error('[TicketSystem] Failed to update the original ticket embed.', e);
                // Non-fatal, we can still close the thread
            }

            // Notify user in thread
            await channel.send(`This ticket has been closed by <@${member.id}>. Reason: ${reason}`);
            
            // Lock the thread
            await channel.setLocked(true);
            await channel.setArchived(true);
            
            await interaction.editReply({ content: 'Ticket has been closed and archived.' });
            break;
        }

        case 'reply': {
            await interaction.deferReply({ ephemeral: true });
            const message = getInteractionStringOption(interaction, 'message', true);

            if (!message) {
                await interaction.editReply({ content: 'You must provide a message to reply with.' });
                return;
            }

            const replyEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setDescription(message)
                .setTimestamp();

            await channel.send({ embeds: [replyEmbed] });
            
            await interaction.editReply({ content: 'Your reply has been sent.' });
            break;
        }

        case 'escalate': {
            await interaction.deferReply({ ephemeral: true });
            const adminRole = interaction.guild?.roles.cache.find(role => role.name === 'Admin');
            const adminMention = adminRole ? `<@&${adminRole.id}>` : '@Admin';

            const escalateEmbed = new EmbedBuilder()
                .setColor(0xffff00) // Yellow for escalation
                .setTitle('Ticket Escalated')
                .setDescription(`<@${member.id}> has escalated this ticket. ${adminMention}, your attention is requested.`)
                .setTimestamp();

            await channel.send({ embeds: [escalateEmbed] });
            
            await interaction.editReply({ content: 'Ticket has been escalated.' });
            break;
        }
    }
}

export async function handleInteractionCreateEvent(
    interaction: Interaction,
    currentMessagesReceived: number,
    currentMessagesSent: number
): Promise<{ updatedMessagesReceived: number, updatedMessagesSent: number }> {

    let localMessagesReceived = currentMessagesReceived;
    let localMessagesSent = currentMessagesSent;

    try {
        if (interaction.isChatInputCommand()) {
            localMessagesReceived++;
            const { commandName } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: ChatInput Command "${commandName}" from ${interaction.user.tag}`);

            const slashCmdInteractionReply = async (content: string, ephemeral = false) => {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, ephemeral });
                } else {
                    await interaction.reply({ content, ephemeral });
                }
                localMessagesSent++;
            };

            const slashCmdSendDm = async (content: string) => {
                await interaction.user.send(content);
                localMessagesSent++;
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
                    { name: 'ticket', description: 'Create a new support ticket.' },
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
            } else if (commandName === 'ticket') {
                await handleTicketCommand(interaction);
            } else if (['sendembed', 'sendrules', 'sendinfo', 'sendwelcome', 'sendroleselect'].includes(commandName)) {
                if (!interaction.inGuild()) {
                    await slashCmdInteractionReply("This command can only be used within a server.", true);
                } else {
                    const guildInteraction = interaction as CommandInteraction<'cached'>;
                    switch (commandName) {
                        case 'sendembed': await handleSendEmbedCommand(guildInteraction); break;
                        case 'sendrules': await handleSendRulesCommand(guildInteraction); break;
                        case 'sendinfo': await handleSendInfoCommand(guildInteraction); break;
                        case 'sendwelcome': await handleSendWelcomeCommand(guildInteraction); break;
                        case 'sendroleselect': await handleSendRoleSelectCommand(guildInteraction); break;
                    }
                }
            } else {
                console.log(`[interactionCreateHandler.ts] Unrecognized slash command: ${commandName}`);
                await slashCmdInteractionReply("Sorry, I don't recognize that command.", true);
            }
        } else if (interaction.isButton()) {
            localMessagesReceived++;
            const { customId } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: Button "${customId}" from ${interaction.user.tag}`);

            if (!interaction.inGuild()) { 
                await interaction.reply({ content: "This action can only be performed within a server.", ephemeral: true });
                localMessagesSent++;
                return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
            }

            const member = interaction.member as GuildMember;
            const guild = interaction.guild!;
            const testerRole = guild.roles.cache.find(role => role.name === 'Tester');
            const devRole = guild.roles.cache.find(role => role.name === 'Developer');
            let replyMessage = "An unexpected error occurred while assigning the role.";

            if (customId === 'assign_tester') {
                if (testerRole) {
                    await member.roles.add(testerRole);
                    replyMessage = "✅ You've been assigned the **Tester** role!";
                } else {
                    replyMessage = "The \"Tester\" role could not be found. Please contact an admin.";
                }
            } else if (customId === 'assign_developer') {
                if (devRole) {
                    await member.roles.add(devRole);
                    replyMessage = "✅ You've been assigned the **Developer** role!";
                } else {
                    replyMessage = "The \"Developer\" role could not be found. Please contact an admin.";
                }
            }
            
            await interaction.reply({ content: replyMessage, ephemeral: true });
            localMessagesSent++;

        } else if (interaction.isModalSubmit()) {
            localMessagesReceived++;
            const { customId } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: Modal Submit "${customId}" from ${interaction.user.tag}`);

            if (customId === 'ticketModal') {
                await interaction.deferReply({ ephemeral: true });

                const issueDescription = interaction.fields.getTextInputValue('issueDescription');
                const member = interaction.member as GuildMember;
                const modmailChannel = interaction.guild?.channels.cache.find(channel => channel.name === 'modmail' && channel.type === ChannelType.GuildText);

                if (!modmailChannel) {
                    await interaction.editReply({ content: 'Could not find the #modmail text channel. Please contact an administrator.' });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }

                const ticketId = Date.now().toString();
                const ticketEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`New Ticket: #${ticketId}`)
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .addFields(
                        { name: 'User', value: `<@${member.id}>`, inline: true },
                        { name: 'Status', value: 'Open', inline: true },
                        { name: 'Issue', value: issueDescription }
                    )
                    .setTimestamp();
                
                const ticketMessage = await (modmailChannel as TextChannel).send({ embeds: [ticketEmbed] });
                const thread = await ticketMessage.startThread({
                    name: `ticket-${ticketId}-${member.user.username}`,
                    autoArchiveDuration: 1440,
                    reason: `Ticket created by ${member.user.tag}`,
                });

                await thread.members.add(member.id);
                const staffRole = interaction.guild?.roles.cache.find(role => role.name === 'Staff');
                const staffMention = staffRole ? `<@&${staffRole.id}>` : '@staff';
                await thread.send(`Welcome, <@${member.id}>! ${staffMention} will be with you shortly to discuss your ticket.`);
                await interaction.editReply({ content: `Your ticket (#${ticketId}) has been submitted successfully! A private thread has been created for you.` });
                localMessagesSent++;
            }
        }
    } catch (error) {
        console.error('[interactionCreateHandler] A top-level error occurred:', error);
        if (interaction.isRepliable()) {
            try {
                const errorMessage = { content: 'A critical error occurred. The issue has been logged.', ephemeral: true };
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (replyError) {
                console.error('[interactionCreateHandler] Failed to send error reply to user:', replyError);
            }
        }
    }

    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
} 