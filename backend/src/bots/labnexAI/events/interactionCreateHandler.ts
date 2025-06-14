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

// This is a stand-in for a proper database or persistent storage solution.
// It maps ChannelID to the UserID of the person who created the ticket.
// Note: This map will reset every time the bot restarts.
export const activeTickets = new Map<string, string>(); 

let messagesReceivedFromDiscord = 0;
let messagesSentToUser = 0;

// Constants that would also ideally be managed better (e.g. config service)
const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

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
            
            if (commandName === 'ticket') {
                const subcommand = (interaction.options as CommandInteractionOptionResolver).getSubcommand();
                const member = interaction.member as GuildMember;
                
                if (subcommand === 'create') {
                    const modal = new ModalBuilder()
                        .setCustomId('ticketModal-v2')
                        .setTitle('Submit a New Ticket');

                    const issueDescriptionInput = new TextInputBuilder()
                        .setCustomId('issueDescription')
                        .setLabel("Please describe your issue in detail")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);
                    
                    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(issueDescriptionInput);
                    modal.addComponents(firstActionRow);
                    await interaction.showModal(modal);
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }

                // All commands below this point are staff-only
                const staffRoleId = process.env.STAFF_ROLE_ID;
                if (!staffRoleId || !member.roles.cache.has(staffRoleId)) {
                    await interaction.reply({ content: 'You do not have permission to use this command.', flags: 1 << 6 });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }

                if (subcommand === 'close') {
                    await interaction.deferReply({ flags: 1 << 6 });
                    const reason = getInteractionStringOption(interaction, 'reason', false) || 'No reason provided.';
                    const channel = interaction.channel;

                    if (channel && channel.type === ChannelType.GuildText && channel.name.startsWith('ticket-')) {
                        await channel.send(`This ticket has been closed by <@${member.id}>. Reason: ${reason}`);
                        
                        const userId = activeTickets.get(channel.id);
                        if (userId) {
                            await channel.permissionOverwrites.edit(userId, { SendMessages: false });
                            activeTickets.delete(channel.id); // Remove from active map
                        }
                        
                        await channel.setName(`closed-${channel.name}`);
                        await interaction.editReply({ content: 'Ticket has been closed and locked for the user.' });
                    } else {
                        await interaction.editReply({ content: 'This command can only be used in an active ticket channel.' });
                    }
                }

                if (subcommand === 'delete') {
                    const channel = interaction.channel;
                    if (channel?.isTextBased() && !channel.isDMBased() && (channel.name.startsWith('ticket-') || channel.name.startsWith('closed-ticket-'))) {
                        await interaction.reply({ content: `This channel will be deleted in 5 seconds.`, flags: 1 << 6 });
                        setTimeout(() => channel.delete('Ticket resolved and deleted by staff.').catch(console.error), 5000);
                    } else {
                        await interaction.reply({ content: 'This command can only be used in a ticket channel.', flags: 1 << 6 });
                    }
                }
            } else {
                // Handle other non-ticket commands here if necessary
                await interaction.reply({ content: "This command is not handled by the ticket system.", flags: 1 << 6 });
            }
        } else if (interaction.isButton()) {
            localMessagesReceived++;
            // Button handlers must check for their own custom IDs
            if (interaction.customId.startsWith('ai_reply_')) {
                // The AI reply buttons are now handled by their own logic
                await handleAiReplyButtons(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            localMessagesReceived++;
            const { customId } = interaction;

            if (customId === 'ticketModal-v2') {
                await interaction.deferReply({ flags: 1 << 6 });
                
                const staffRoleId = process.env.STAFF_ROLE_ID;
                if (!staffRoleId) {
                    console.error('[TicketSystem] STAFF_ROLE_ID is not set in the environment variables!');
                    await interaction.editReply({ content: 'The ticket system has a configuration error. Please contact an administrator.' });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }

                const issueDescription = interaction.fields.getTextInputValue('issueDescription');
                const user = interaction.user;
                const ticketId = Date.now();

                try {
                    const channel = await interaction.guild?.channels.create({
                        name: `ticket-${user.username}-${ticketId}`.substring(0, 100),
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: ['ViewChannel'],
                            },
                            {
                                id: user.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            },
                            {
                                id: staffRoleId,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'],
                            },
                        ],
                    });

                    if (!channel) {
                        console.error('[TicketSystem] Failed to create ticket channel, channel is undefined.');
                        await interaction.editReply({ content: 'There was a critical error while creating your ticket channel. Please contact an administrator.' });
                        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                    }

                    console.log(`[TicketSystem] Created new ticket channel: ${channel.name} (${channel.id}) for user ${user.id}`);
                    activeTickets.set(channel.id, user.id);

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
                        .setTitle(`Ticket #${ticketId}`)
                        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                        .addFields(
                            { name: 'User', value: `<@${user.id}>`, inline: true },
                            { name: 'Status', value: 'Open', inline: true },
                            { name: 'AI Tags', value: aiTagsText, inline: false },
                            { name: 'Issue', value: issueDescription }
                        )
                        .setTimestamp();
                    
                    const staffRole = await interaction.guild?.roles.fetch(staffRoleId);
                    await channel.send({
                        content: `New ticket from <@${user.id}>. ${staffRole ? `Paging ${staffRole}` : ''}`,
                        embeds: [ticketEmbed]
                    });

                    if (aiReply) {
                        const suggestionEmbed = new EmbedBuilder()
                            .setColor(0xfde047)
                            .setTitle('🤖 AI Suggested Reply')
                            .setDescription(aiReply)
                            .setFooter({ text: 'Staff can use the buttons below.' });

                        const suggestionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId(`ai_reply_send_${user.id}`).setLabel('Send to User via DM').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId(`ai_copy_reply_${channel.id}`).setLabel('Copy Text').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId(`ai_ignore_reply_${channel.id}`).setLabel('Ignore').setStyle(ButtonStyle.Danger)
                        );
                        await channel.send({ embeds: [suggestionEmbed], components: [suggestionButtons] });
                    }

                    await interaction.editReply({ content: `Your ticket has been created! Please see the new private channel: <#${channel.id}>` });

                } catch (error) {
                    console.error('[TicketSystem] Failed to create ticket channel:', error);
                    await interaction.editReply({ content: 'There was a critical error while creating your ticket channel. Please contact an administrator.' });
                }
            }
        } else if (interaction.isAutocomplete()) {
            // Autocomplete logic can be handled here.
        } else {
            console.log(`[interactionCreateHandler.ts] Unhandled interaction type: ${interaction.type}`);
        }
    } catch (error: any) {
        console.error('[interactionCreateHandler.ts] An error occurred in the interaction handler:', error);
        if (error.code === 10062) { // Unknown Interaction
            console.error('[interactionCreateHandler.ts] Cannot reply to an unknown interaction. It likely timed out.');
        } else if (interaction.isRepliable()) {
            const errorMessage = { content: 'An unexpected error occurred. Please try again later.', flags: 1 << 6 };
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (e) {
                console.error("Failed to send error reply:", e);
            }
        }
    }

    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
}