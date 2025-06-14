// This is a test comment to reset the file state.
import {
    CommandInteraction,
    CacheType,
    EmbedBuilder,
    Interaction,
    GuildMember,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ChannelType,
    TextChannel,
    ButtonBuilder,
    ButtonStyle,
    ThreadChannel,
    InteractionReplyOptions,
    MessagePayload,
    CommandInteractionOptionResolver,
} from 'discord.js';
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
import { generateTagsForTicket, generateSuggestedReply } from '../chatgpt.service';
import { handleAiReplyButtons } from '../interactions/aiReplyHandler';
import { CreateTaskOptions, LabnexNote, LabnexSnippet } from '../types/labnexAI.types';
import { getInteractionStringOption } from '../utils/discordHelpers';

// These will be imported from the main bot file initially
// For a cleaner approach, these could be part of a shared context or class instance
let messagesReceivedFromDiscord = 0;
let messagesSentToUser = 0;

// Constants that would also ideally be managed better (e.g. config service)
const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

// Map to track active tickets, linking a user's ID to their ticket thread's ID
export const activeTickets = new Map<string, string>(); // Map<userId, threadId>

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

async function handleTicketCommand(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
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
        await interaction.reply({ content: 'This command can only be used within a ticket thread.', flags: 1 << 6 });
        return;
    }

    if (!isStaff()) {
        await interaction.reply({ content: 'You do not have permission to use this command.', flags: 1 << 6 });
        return;
    }
    
    switch (subcommand) {
        case 'close': {
            await interaction.deferReply({ flags: 1 << 6 });
            const reason = getInteractionStringOption(interaction, 'reason', false) || 'No reason provided.';
            let userIdToNotify: string | undefined;

            try {
                if (channel.parentId) {
                    const modmailChannel = await interaction.guild?.channels.fetch(channel.parentId);
                    if (modmailChannel?.isTextBased()) {
                        const originalMessage = await modmailChannel.messages.fetch(channel.id);
                        if (originalMessage && originalMessage.embeds.length > 0) {
                            const originalEmbed = originalMessage.embeds[0];
                            const userField = originalEmbed.fields.find(f => f.name === 'User');
                            userIdToNotify = userField?.value.match(/<@(\d+)>/)?.[1];
                            
                            const updatedEmbed = new EmbedBuilder(originalEmbed.data)
                                .setColor(0xff0000)
                                .spliceFields(1, 1, { name: 'Status', value: 'Closed', inline: true })
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
            }

            if (userIdToNotify) {
                activeTickets.delete(userIdToNotify);
                const user = await interaction.client.users.fetch(userIdToNotify);
                await user.send(`Your ticket has been closed by **${member.user.tag}**. Reason: *${reason}*`);
            }

            // Rename the thread to show it's closed
            try {
                const closedName = `[CLOSED] ${channel.name.replace('[ESCALATED] ', '')}`;
                await channel.setName(closedName.substring(0, 100));
            } catch (e) {
                console.error(`[TicketSystem] Failed to rename thread ${channel.id} on close.`, e);
            }

            await channel.send(`This ticket has been closed by <@${member.id}>.`);
            await channel.setLocked(true);
            await channel.setArchived(true);
            
            await interaction.editReply({ content: 'Ticket has been closed and archived.' });
            break;
        }

        case 'reply': {
            await interaction.deferReply({ flags: 1 << 6 });
            const message = getInteractionStringOption(interaction, 'message', true);
            let userIdToNotify: string | undefined;

            if (!message) {
                await interaction.editReply({ content: 'You must provide a message to reply with.' });
                return;
            }

            try {
                if (channel.parentId) {
                    const modmailChannel = await interaction.guild?.channels.fetch(channel.parentId);
                    if (modmailChannel?.isTextBased()) {
                        const originalMessage = await modmailChannel.messages.fetch(channel.id);
                        const userField = originalMessage.embeds[0]?.fields.find(f => f.name === 'User');
                        userIdToNotify = userField?.value.match(/<@(\d+)>/)?.[1];
                    }
                }

                if (userIdToNotify) {
                    const user = await interaction.client.users.fetch(userIdToNotify);
                    const replyEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setAuthor({ name: `${member.user.tag} (Staff)`, iconURL: member.user.displayAvatarURL() })
                        .setDescription(message)
                        .setTimestamp();
                    
                    await user.send({ embeds: [replyEmbed] });

                    // Also post in thread for staff record
                    await channel.send({ embeds: [replyEmbed] });
                    await interaction.editReply({ content: 'Your reply has been sent to the user.' });
                } else {
                    await interaction.editReply({ content: 'Could not find the user to reply to.' });
                }
            } catch (e) {
                console.error('[TicketSystem] Failed to send reply DM.', e);
                await interaction.editReply({ content: 'There was an error sending the reply. The user may have DMs disabled.' });
            }
            break;
        }

        case 'escalate': {
            await interaction.deferReply({ flags: 1 << 6 });
            const reason = getInteractionStringOption(interaction, 'reason', true);

            if (!reason) {
                await interaction.editReply({ content: 'A reason is required to escalate.' });
                return;
            }

            const adminRole = interaction.guild?.roles.cache.find(role => role.name === 'Admin');
            const adminMention = adminRole ? `<@&${adminRole.id}>` : '@Admin';

            const escalateEmbed = new EmbedBuilder()
                .setColor(0xffff00) // Yellow for escalation
                .setTitle('Ticket Escalated')
                .setDescription(`<@${member.id}> has escalated this ticket. ${adminMention}, your attention is requested.`)
                .addFields({ name: 'Reason for Escalation', value: reason })
                .setTimestamp();

            await channel.send({ embeds: [escalateEmbed] });
            
            // Rename the thread to show it's escalated
            try {
                if (!channel.name.startsWith('[ESCALATED]')) {
                    const escalatedName = `[ESCALATED] ${channel.name}`;
                    await channel.setName(escalatedName.substring(0, 100));
                }
            } catch (e) {
                console.error(`[TicketSystem] Failed to rename thread ${channel.id} on escalation.`, e);
            }

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

    const reply = async (options: string | MessagePayload | InteractionReplyOptions) => {
        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(options);
            } else {
                await interaction.reply(options);
            }
        }
    };

    try {
        if (interaction.isChatInputCommand()) {
            localMessagesReceived++;
            const { commandName } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: ChatInput Command "${commandName}" from ${interaction.user.tag}`);
            
            const replyFunction = async (content: string, ephemeral = false) => {
                await reply({ content, flags: ephemeral ? (1 << 6) : undefined });
            };

            const sendDmFunction = async (content: string) => {
                await interaction.user.send(content);
            };

            if (commandName === 'ticket') {
                await handleTicketCommand(interaction);
            } else if (commandName === 'my-projects') {
                await interaction.deferReply({ flags: 1 << 6 });
                await handleMyProjectsCommand(interaction.user.id, replyFunction, interaction);
            } else if (commandName === 'project-tasks') {
                await interaction.deferReply({ flags: 1 << 6 });
                const projectIdentifier = getInteractionStringOption(interaction, 'project', true);
                await handleProjectTasksCommand(interaction.user.id, projectIdentifier, replyFunction, interaction);
            } else if (commandName === 'create-task') {
                // This command handles its own reply via modal, so no defer needed here.
                const options: CreateTaskOptions = {
                     discordUserId: interaction.user.id,
                     projectIdentifier: getInteractionStringOption(interaction, 'project', true) || '',
                     title: getInteractionStringOption(interaction, 'title', true) || '',
                     description: getInteractionStringOption(interaction, 'description', false),
                     priority: getInteractionStringOption(interaction, 'priority', false),
                     status: getInteractionStringOption(interaction, 'status', false),
                     dueDate: getInteractionStringOption(interaction, 'due_date', false),
                 };
                await handleCreateTaskCommand(options, replyFunction, interaction);
            } else if (commandName === 'task-info') {
                await interaction.deferReply({ flags: 1 << 6 });
                const taskIdentifier = getInteractionStringOption(interaction, 'task_identifier', true);
                if (taskIdentifier) {
                    await handleTaskInfoCommand(interaction.user.id, taskIdentifier, replyFunction, interaction);
                } else {
                    await reply({ content: 'Task identifier is required.', flags: 1 << 6 });
                }
            } else if (commandName === 'update-task-status') {
                await handleUpdateTaskStatusCommand(interaction);
            } else if (commandName === 'add-note') {
                await handleAddNoteSlashCommand(interaction);
            } else if (commandName === 'list-notes') {
                await interaction.deferReply({ flags: 1 << 6 });
                await handleListNotesSlashCommand(interaction);
            } else if (commandName === 'add-snippet') {
                await handleAddSnippetSlashCommand(interaction);
            } else if (commandName === 'list-snippets') {
                await interaction.deferReply({ flags: 1 << 6 });
                await handleListSnippetsSlashCommand(interaction);
            } else if (commandName === 'link-account') {
                await interaction.deferReply({ flags: 1 << 6 });
                await handleLinkAccount(interaction.user.id, interaction.user.tag, replyFunction, sendDmFunction);
            } else if (['send-embed', 'send-rules', 'send-info', 'send-welcome', 'send-roleselect'].includes(commandName)) {
                if (!interaction.inGuild()) {
                    await reply({ content: "This command can only be used in a server.", flags: 1 << 6 });
                } else {
                    const guildInteraction = interaction as CommandInteraction<'cached'>;
                    switch (commandName) {
                        case 'send-embed': await handleSendEmbedCommand(guildInteraction); break;
                        case 'send-rules': await handleSendRulesCommand(guildInteraction); break;
                        case 'send-info': await handleSendInfoCommand(guildInteraction); break;
                        case 'send-welcome': await handleSendWelcomeCommand(guildInteraction); break;
                        case 'send-roleselect': await handleSendRoleSelectCommand(guildInteraction); break;
                    }
                }
            } else {
                await reply({ content: 'Unknown command!', flags: 1 << 6 });
            }
            localMessagesSent++;
        } else if (interaction.isButton()) {
            localMessagesReceived++;
            const { customId } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: Button Click "${customId}" from ${interaction.user.tag}`);

            if (customId.startsWith('ai_reply_')) {
                if (!interaction.deferred) {
                    await interaction.deferUpdate();
                }
                await handleAiReplyButtons(interaction);

            } else {
                console.log(`[interactionCreateHandler.ts] Button interaction with unhandled customId: ${customId}`);
                await reply({ content: 'This button is not configured.', flags: 1 << 6 });
            }

        } else if (interaction.isModalSubmit()) {
            localMessagesReceived++;
            const { customId } = interaction;
            console.log(`[interactionCreateHandler.ts] Event: Modal Submit "${customId}" from ${interaction.user.tag}`);

            if (customId === 'ticketModal') {
                await interaction.deferReply({ flags: 1 << 6 });

                const issueDescription = interaction.fields.getTextInputValue('issueDescription');
                const user = interaction.user;

                // Check if user already has an active ticket
                if (activeTickets.has(user.id)) {
                    const threadId = activeTickets.get(user.id);
                    const thread = interaction.guild?.channels.cache.get(threadId as string) as ThreadChannel | undefined;
                    if (thread && !thread.archived) {
                        await interaction.editReply({ content: `You already have an open ticket. Please use your existing ticket channel: <#${threadId}>` });
                        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                    } else {
                        // If ticket was archived for some reason but not cleared from map
                        activeTickets.delete(user.id);
                    }
                }
                
                // Defer the reply to prevent timeout
                await interaction.deferReply({ flags: 1 << 6 });

                const modmailChannelId = '1122550689405730966'; // Replace with your actual ModMail channel ID
                const modmailChannel = interaction.guild?.channels.cache.get(modmailChannelId) as TextChannel | null;

                if (!modmailChannel) {
                    console.error('[TicketSystem] Modmail channel not found.');
                    await interaction.editReply({ content: 'Could not find the modmail channel. Please contact an admin.' });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }
                
                // DM user confirmation
                try {
                    await user.send({ content: 'Thank you for submitting your ticket. A staff member will be with you shortly. All further communication will happen in this DM channel.' });
                    localMessagesSent++;
                } catch (e) {
                    console.error(`[TicketSystem] Could not send DM to user ${user.id}. They may have DMs disabled.`);
                    await interaction.editReply({ content: 'I tried to DM you, but your DMs are disabled. Please enable them and try again.'});
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }
                
                // AI Processing for tags and initial reply
                let aiTagsText = 'Could not determine tags.';
                let aiReply = 'Could not generate a suggested reply.';
                try {
                    const tagsResult = await generateTagsForTicket(issueDescription);
                    if (tagsResult) aiTagsText = tagsResult.join(', ');

                    const replyResult = await generateSuggestedReply(issueDescription);
                    if (replyResult) aiReply = replyResult;
                } catch (e) {
                    console.error('[TicketSystem] Failed to get AI suggestions:', e);
                }

                const ticketEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('New Ticket Submission')
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                    .addFields(
                        { name: 'User', value: `<@${user.id}>`, inline: true },
                        { name: 'Status', value: 'Open', inline: true },
                        { name: 'AI Tags', value: aiTagsText, inline: false },
                        { name: 'Issue', value: issueDescription }
                    )
                    .setTimestamp();

                const ticketMessage = await modmailChannel.send({
                    embeds: [ticketEmbed]
                });
                localMessagesSent++;

                const thread = await ticketMessage.startThread({
                    name: `Ticket-${user.username.substring(0, 50)}`, // Ensure name is not too long
                    autoArchiveDuration: 1440, // 24 hours
                    reason: `Support ticket for ${user.tag}`
                });
                localMessagesSent++;

                activeTickets.set(user.id, thread.id);
                console.log(`[TicketSystem] Created ticket thread ${thread.id} for user ${user.id}`);

                // Send AI suggestion in the new thread
                if (aiReply) {
                    const suggestionEmbed = new EmbedBuilder()
                        .setColor(0xfde047) // A nice yellow for suggestions
                        .setTitle('🤖 AI Suggested Reply')
                        .setDescription(aiReply)
                        .setFooter({ text: 'You can use the buttons below to manage this suggestion.' });

                    const suggestionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId(`ai_reply_send_${thread.id}`).setLabel('Send Reply').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`ai_reply_copy_${thread.id}`).setLabel('Copy Text').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`ai_reply_ignore_${thread.id}`).setLabel('Ignore').setStyle(ButtonStyle.Danger)
                    );
                    await thread.send({ embeds: [suggestionEmbed], components: [suggestionButtons] });
                    localMessagesSent++;
                }

                // Finally, let the user know everything is done.
                await interaction.editReply({ content: `I have sent you a DM to continue this conversation.` });

            } else if (customId === 'createTaskModal') {
                await interaction.deferReply({ flags: 1 << 6 });
                localMessagesSent++;
                // ... logic for task creation
                await interaction.editReply({ content: 'Modal submission for task creation is not fully implemented yet.' });
            } else if (customId.startsWith('addNoteModal')) {
                await interaction.deferReply({ flags: 1 << 6 });
                localMessagesSent++;
                const taskId = customId.split('_')[1];
                if (!taskId) {
                    await interaction.editReply({ content: "Could not find the task ID to add the note to."});
                } else {
                    // ... logic for adding note
                    await interaction.editReply({ content: 'Note added (not implemented).' });
                }
            } else if (customId.startsWith('addSnippetModal')) {
                 await interaction.deferReply({ flags: 1 << 6 });
                 localMessagesSent++;
                // ... logic for adding snippet
                await interaction.editReply({ content: 'Snippet added (not implemented).' });
            }

        } else if (interaction.isAutocomplete()) {
            // Autocomplete logic can be handled here.
        } else {
            console.log(`[interactionCreateHandler.ts] Unhandled interaction type: ${interaction.type}`);
        }
    } catch (error: any) {
        console.error('[interactionCreateHandler.ts] An error occurred in the interaction handler:', error);
        if (interaction.isRepliable()) {
            const errorMessage = { content: 'An unexpected error occurred. Please try again later.', flags: 1 << 6 };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorMessage).catch(e => console.error('Failed to send error follow-up:', e));
            } else {
                await interaction.reply(errorMessage).catch(e => console.error('Failed to send error reply:', e));
            }
        }
    }

    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
} 