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
import { generateTagsForTicket } from '../chatgpt.service';
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
                const hasStaffRole = staffRoleId ? member.roles.cache.has(staffRoleId) : false;
                const isAdmin = member.permissions.has('Administrator');

                if (!hasStaffRole && !isAdmin) {
                    await interaction.reply({ content: 'You do not have permission to use this command.', flags: 1 << 6 });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }
                const channel = interaction.channel;
                if (!channel || channel.type === ChannelType.DM) {
                    await interaction.reply({ content: 'This command cannot be used in DMs.', flags: 1 << 6 });
                    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                }

                switch (subcommand) {
                    case 'close': {
                        await interaction.deferReply({ flags: 1 << 6 });
                        const reason = getInteractionStringOption(interaction, 'reason', false) || 'No reason provided.';
                        
                        if ((channel instanceof TextChannel || channel instanceof ThreadChannel) && (channel.name.startsWith('ticket-') || channel.name.startsWith('[ESCALATED] ticket-'))) {
                            await channel.send(`This ticket has been closed by <@${member.id}>. Reason: ${reason}`);
                            
                            const userId = activeTickets.get(channel.id);
                            if (userId && channel instanceof TextChannel) {
                                await channel.permissionOverwrites.edit(userId, { SendMessages: false });
                                activeTickets.delete(channel.id);
                            }
                            
                            await channel.setName(`closed-${channel.name}`);
                            if (channel.isThread()) {
                                await channel.setArchived(true);
                            }
                            await interaction.editReply({ content: 'Ticket has been closed and locked for the user.' });
                        } else {
                            await interaction.editReply({ content: 'This command can only be used in an active ticket channel.' });
                        }
                        break;
                    }
    
                    case 'delete': {
                        await interaction.deferReply({ ephemeral: true });
                        if ((channel instanceof TextChannel || channel instanceof ThreadChannel) && (channel.name.startsWith('ticket-') || channel.name.startsWith('closed-ticket-') || channel.name.startsWith('[ESCALATED] ticket-'))) {
                            await interaction.editReply({ content: `This channel will be deleted in 5 seconds.`});
                            setTimeout(() => channel.delete('Ticket resolved and deleted by staff.').catch(console.error), 5000);
                        } else {
                            await interaction.editReply({ content: 'This command can only be used in a ticket channel.' });
                        }
                        break;
                    }
                    case 'escalate': {
                        if (!(channel instanceof TextChannel) && !(channel instanceof ThreadChannel)) {
                            await interaction.reply({ content: 'This command can only be used in a text or thread channel.', flags: 1 << 6 });
                            return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
                        }
                        await interaction.deferReply({ flags: 1 << 6 });
                        const reason = getInteractionStringOption(interaction, 'reason', true);
    
                        if (!reason) {
                            await interaction.editReply({ content: 'A reason is required to escalate.' });
                            return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
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
                        
                        try {
                            if (!channel.name.startsWith('[ESCALATED]')) {
                                const escalatedName = `[ESCALATED] ${channel.name}`;
                                await channel.setName(escalatedName.substring(0, 100));
                            }
                        } catch (e) {
                            console.error(`[TicketSystem] Failed to rename channel ${channel.id} on escalation.`, e);
                        }
    
                        await interaction.editReply({ content: 'Ticket has been escalated.' });
                        break;
                    }
                }
            } else {
                // Handle other non-ticket commands here if necessary
                await interaction.reply({ content: "This command is not handled by the ticket system.", flags: 1 << 6 });
            }
        } else if (interaction.isButton()) {
            localMessagesReceived++;
            // Button handlers can be placed here if any other buttons are added.
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
                    const ticketsCategory = interaction.guild?.channels.cache.find(c => c.name.toLowerCase() === 'tickets' && c.type === ChannelType.GuildCategory);
                    if (!ticketsCategory) {
                        console.warn('[TicketSystem] "tickets" category not found. Creating ticket at top level.');
                    }

                    const channel = await interaction.guild?.channels.create({
                        name: `ticket-${user.username}-${ticketId}`.substring(0, 100),
                        type: ChannelType.GuildText,
                        parent: ticketsCategory?.id,
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
                    try {
                        const tagsResult = await generateTagsForTicket(issueDescription);
                        if (tagsResult) aiTagsText = tagsResult.join(', ');
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
                        content: `New ticket from <@${user.id}>.`,
                        embeds: [ticketEmbed]
                    });

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