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

            switch (commandName) {
                case 'ticket': {
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
                }
                break;
            }
            // New: Help command – respond with basic info
            case 'help': {
                await interaction.reply({ content: 'Need assistance? Available commands: /linkaccount, /projects, /tasks, /createtask, /taskinfo, /updatetask, /addnote, /notes, /addsnippet, /snippets. Use /ticket create to open support tickets.', ephemeral: true });
                break;
            }
            case 'linkaccount': {
                const replyFn = async (content: string, ephemeral = false) => {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral });
                    } else {
                        await interaction.reply({ content, ephemeral });
                    }
                };
                const sendDmFn = async (content: string) => {
                    try {
                        await interaction.user.send(content);
                    } catch (e) {
                        console.warn('[linkaccount] Failed to DM user – falling back to channel.', e);
                        await replyFn('I could not send you a DM. Please check your privacy settings.', true);
                    }
                };
                await handleLinkAccount(interaction.user.id, interaction.user.username, replyFn, sendDmFn);
                break;
            }
            case 'projects': {
                const replyFn = async (content: string, ephemeral = false) => {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral });
                    } else {
                        await interaction.reply({ content, ephemeral });
                    }
                };
                await handleMyProjectsCommand(interaction.user.id, replyFn, interaction);
                break;
            }
            case 'tasks': {
                const projectIdentifier = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'project', false);
                const replyFn = async (content: string, ephemeral = false) => {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral });
                    } else {
                        await interaction.reply({ content, ephemeral });
                    }
                };
                await handleProjectTasksCommand(interaction.user.id, projectIdentifier, replyFn, interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'createtask': {
                const options: CreateTaskOptions = {
                    discordUserId: interaction.user.id,
                    projectIdentifier: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'project', true)!,
                    title: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'title', true)!,
                    description: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'description', false) || undefined,
                    priority: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'priority', false) || undefined,
                    status: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'status', false) || undefined,
                    dueDate: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'due_date', false) || undefined,
                };
                const replyFn = async (content: string, ephemeral = false) => {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral });
                    } else {
                        await interaction.reply({ content, ephemeral });
                    }
                };
                await handleCreateTaskCommand(options, replyFn, interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'taskinfo': {
                const taskIdentifier = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'task_identifier', true);
                const replyFn = async (content: string, ephemeral = false) => {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content, ephemeral });
                    } else {
                        await interaction.reply({ content, ephemeral });
                    }
                };
                await handleTaskInfoCommand(interaction.user.id, taskIdentifier!, replyFn, interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'updatetask': {
                await handleUpdateTaskStatusCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'addnote': {
                await handleAddNoteSlashCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'notes': {
                await handleListNotesSlashCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'addsnippet': {
                await handleAddSnippetSlashCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'snippets': {
                await handleListSnippetsSlashCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'sendembed': {
                await handleSendEmbedCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'sendrules': {
                await handleSendRulesCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'sendinfo': {
                await handleSendInfoCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'sendwelcome': {
                await handleSendWelcomeCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            case 'sendroleselect': {
                await handleSendRoleSelectCommand(interaction as CommandInteraction<CacheType>);
                break;
            }
            default: {
                await interaction.reply({ content: "This command is not recognized.", flags: 1 << 6 });
            }
        }
        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
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
        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
}