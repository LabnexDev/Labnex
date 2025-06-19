// Clean‑compiling interactionCreateHandler.ts skeleton.
// Uses correct Discord.js type guards so deferred/replied properties exist.

import {
    ActionRowBuilder,
    CacheType,
    ChannelType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Interaction,
    InteractionReplyOptions,
    MessagePayload,
    ModalBuilder,
    PermissionsBitField,
    RepliableInteraction,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    ThreadChannel,
    CommandInteraction
  } from 'discord.js';
  
  /* -------------------------------------------------------------------------- */
  /*                              Command Imports                               */
  /* -------------------------------------------------------------------------- */
  import {
    handleLinkAccount,
    handleMyProjectsCommand
  } from '../commands/projectCommands';
  import {
    handleProjectTasksCommand,
    handleCreateTaskCommand,
    handleTaskInfoCommand,
    handleUpdateTaskStatusCommand
  } from '../commands/taskCommands';
  import { handleAddNoteSlashCommand, handleListNotesSlashCommand } from '../commands/noteCommands';
  import { handleAddSnippetSlashCommand, handleListSnippetsSlashCommand } from '../commands/snippetCommands';
  import { execute as handleSendEmbedCommand } from '../commands/sendEmbedCommand';
  import { execute as handleSendRulesCommand } from '../commands/sendrules';
  import { execute as handleSendInfoCommand } from '../commands/sendinfo';
  import { execute as handleSendWelcomeCommand } from '../commands/sendwelcome';
  import { execute as handleSendRoleSelectCommand } from '../commands/sendroleselect';
  import { getInteractionStringOption } from '../utils/discordHelpers';
  import { CreateTaskOptions } from '../types/labnexAI.types';
  
  /* -------------------------------------------------------------------------- */
  /*                                Placeholders                                */
  /* -------------------------------------------------------------------------- */
  // TODO: Re‑import real command handlers when ready.
  // import { handleLinkAccount } from '../commands/projectCommands';
  // ...other imports
  
  // In‑memory map: ChannelID → UserID (resets on restart)
  export const activeTickets = new Map<string, string>();
  
  /* -------------------------------------------------------------------------- */
  /*                           Interaction Counters                             */
  /* -------------------------------------------------------------------------- */
  let messagesReceivedFromDiscord = 0;
  let messagesSentToUser = 0;
  
  export function updateInteractionCounters (newReceived: number, newSent: number) {
    messagesReceivedFromDiscord = newReceived;
    messagesSentToUser = newSent;
  }
  
  /* -------------------------------------------------------------------------- */
  /*                               Helper Functions                             */
  /* -------------------------------------------------------------------------- */
  function isRepliable (i: Interaction): i is RepliableInteraction {
    return i.isRepliable();
  }
  
  function safeReply (
    interaction: Interaction,
    content: string | MessagePayload | InteractionReplyOptions
  ) {
    // Ensure the interaction is properly acknowledged before attempting to reply.
    // 1. If not yet deferred/replied, defer first (helps with >3s API calls).
    // 2. Then send a follow-up or initial reply accordingly.
    // 3. Gracefully handle the case where the interaction was already acknowledged elsewhere (error code 40060).

    async function inner () {
      if (!isRepliable(interaction)) return;

      try {
        if (!interaction.deferred && !interaction.replied) {
          // Defer to buy us time if the command handler is long-running.
          const isEphemeral =
            typeof content === 'object' && content !== null && 'ephemeral' in content
              ? (content as InteractionReplyOptions).ephemeral === true
              : false;
          await (interaction as ChatInputCommandInteraction<CacheType>).deferReply({ ephemeral: isEphemeral });
        }

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(content as any);
        } else {
          await interaction.reply(content as any);
        }
      } catch (err: any) {
        // 40060 = "Interaction has already been acknowledged" – fall back to followUp.
        if (err?.code === 40060) {
          try {
            await interaction.followUp(content as any);
          } catch (_) {/* ignore */}
        } else {
          throw err;
        }
      }
    }

    return inner();
  }
  
  /* -------------------------------------------------------------------------- */
  /*                       Main Interaction Create Handler                      */
  /* -------------------------------------------------------------------------- */
  export async function handleInteractionCreateEvent (
    interaction: Interaction,
    currentReceived: number,
    currentSent: number
  ): Promise<{ updatedMessagesReceived: number; updatedMessagesSent: number }> {
    let received = currentReceived;
    let sent = currentSent;
  
    try {
      /* --------------------------- Slash Commands --------------------------- */
      if (interaction.isChatInputCommand()) {
        received++;
  
        switch (interaction.commandName) {
          case 'ticket': {
            const subcommand = (interaction as ChatInputCommandInteraction<CacheType>).options.getSubcommand();
            
            switch (subcommand) {
              case 'create': {
                if (!interaction.inGuild()) {
                  await safeReply(interaction, { 
                    content: 'Tickets can only be created in a server, not in DMs.', 
                    ephemeral: true 
                  });
                  break;
                }

                const guild = interaction.guild!;
                const member = interaction.member as GuildMember;
                
                // Create a private thread for the ticket
                const channel = interaction.channel as TextChannel;
                if (!channel || !channel.isTextBased()) {
                  await safeReply(interaction, { 
                    content: 'Tickets can only be created in text channels.', 
                    ephemeral: true 
                  });
                  break;
                }

                const ticketTitle = `🎫 Ticket - ${member.user.username}`;
                const thread = await channel.threads.create({
                  name: ticketTitle,
                  autoArchiveDuration: 1440, // 24 hours
                  type: ChannelType.PrivateThread,
                  reason: `Support ticket created by ${member.user.tag}`
                });

                // Add the user to the ticket map
                activeTickets.set(member.user.id, thread.id);

                const ticketEmbed = new EmbedBuilder()
                  .setColor(0x0099FF)
                  .setTitle('🎫 Support Ticket Created')
                  .setDescription(`Welcome ${member}! Your support ticket has been created.`)
                  .addFields(
                    { name: '📝 Instructions', value: 'Please describe your issue in detail. Staff will assist you shortly.' },
                    { name: '💬 Communication', value: 'You can reply to this thread or send me a DM.' },
                    { name: '🔒 Close Ticket', value: 'Use `/ticket close [reason]` when your issue is resolved.' }
                  )
                  .setFooter({ text: 'Labnex Support System' })
                  .setTimestamp();

                await thread.send({ embeds: [ticketEmbed] });
                await safeReply(interaction, {
                  content: `✅ Ticket created! Please continue in ${thread}.`,
                  ephemeral: true
                });
                break;
              }

              case 'close': {
                const reason = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'reason', false) || 'No reason provided';
                
                if (!interaction.inGuild() || !interaction.channel?.isThread()) {
                  await safeReply(interaction, { 
                    content: 'This command can only be used in a ticket thread.', 
                    ephemeral: true 
                  });
                  break;
                }

                const thread = interaction.channel as ThreadChannel;
                const member = interaction.member as GuildMember;

                // Check if this is a ticket thread
                const ticketOwnerId = Array.from(activeTickets.entries()).find(([_, threadId]) => threadId === thread.id)?.[0];
                
                if (!ticketOwnerId || (ticketOwnerId !== member.user.id && !member.permissions.has(PermissionsBitField.Flags.ManageChannels))) {
                  await safeReply(interaction, { 
                    content: 'You can only close your own tickets, or you need Manage Channels permission.', 
                    ephemeral: true 
                  });
                  break;
                }

                const closeEmbed = new EmbedBuilder()
                  .setColor(0xFF6B6B)
                  .setTitle('🔒 Ticket Closed')
                  .setDescription(`Ticket closed by ${member}`)
                  .addFields({ name: 'Reason', value: reason })
                  .setTimestamp();

                await thread.send({ embeds: [closeEmbed] });
                await thread.setArchived(true);
                activeTickets.delete(ticketOwnerId);

                await safeReply(interaction, { 
                  content: '✅ Ticket has been closed and archived.', 
                  ephemeral: true 
                });
                break;
              }

              case 'escalate': {
                const reason = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'reason', true)!;
                
                if (!interaction.inGuild() || !interaction.channel?.isThread()) {
                  await safeReply(interaction, { 
                    content: 'This command can only be used in a ticket thread.', 
                    ephemeral: true 
                  });
                  break;
                }

                const escalateEmbed = new EmbedBuilder()
                  .setColor(0xFFB347)
                  .setTitle('⚠️ Ticket Escalated')
                  .setDescription(`${interaction.user} has escalated this ticket`)
                  .addFields({ name: 'Escalation Reason', value: reason })
                  .setTimestamp();

                await interaction.channel.send({ embeds: [escalateEmbed] });
                await safeReply(interaction, { 
                  content: '✅ Ticket has been escalated to higher-level staff.', 
                  ephemeral: true 
                });
                break;
              }

              case 'delete': {
                const member = interaction.member as GuildMember;
                
                if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                  await safeReply(interaction, { 
                    content: '❌ You need Manage Channels permission to delete tickets.', 
                    ephemeral: true 
                  });
                  break;
                }

                if (!interaction.channel?.isThread()) {
                  await safeReply(interaction, { 
                    content: 'This command can only be used in a ticket thread.', 
                    ephemeral: true 
                  });
                  break;
                }

                const thread = interaction.channel as ThreadChannel;
                const ticketOwnerId = Array.from(activeTickets.entries()).find(([_, threadId]) => threadId === thread.id)?.[0];
                
                if (ticketOwnerId) {
                  activeTickets.delete(ticketOwnerId);
                }

                await safeReply(interaction, { 
                  content: '🗑️ This ticket thread will be deleted in 5 seconds...', 
                  ephemeral: true 
                });

                setTimeout(async () => {
                  try {
                    await thread.delete();
                  } catch (error) {
                    console.error('Failed to delete ticket thread:', error);
                  }
                }, 5000);
                break;
              }

              default:
                await safeReply(interaction, { 
                  content: 'Unknown ticket subcommand.', 
                  ephemeral: true 
                });
            }
            break;
          }
  
          case 'help': {
            const helpEmbed = new EmbedBuilder()
              .setColor(0x0099FF)
              .setTitle('🤖 Labnex AI Bot - Command Reference')
              .setDescription('Here are all the available commands for the Labnex AI bot. Use `/` for slash commands or mention me for natural language interactions.')
              .addFields(
                {
                  name: '🔗 **Account Management**',
                  value: 
                    `\`/linkaccount\` - Link your Discord account with Labnex\n` +
                    `\`/ping\` - Check if the bot is online`,
                  inline: false
                },
                {
                  name: '📂 **Project Management**',
                  value: 
                    `\`/projects\` - List your Labnex projects\n` +
                    `💬 "create project for [description]" - AI-powered project setup`,
                  inline: false
                },
                {
                  name: '📋 **Task Management**',
                  value: 
                    `\`/tasks [project]\` - List tasks (optional: for specific project)\n` +
                    `\`/createtask\` - Create a new task with full options\n` +
                    `\`/taskinfo <identifier>\` - Get detailed task information\n` +
                    `\`/updatetask status\` - Update task status\n` +
                    `💬 "show task [ID]" - Get task details via natural language`,
                  inline: false
                },
                {
                  name: '🧪 **Test Case Management**',
                  value: 
                    `💬 "create test case" - Interactive test case creation\n` +
                    `💬 "mark test [name] as Pass/Fail/Pending" - Update test status\n` +
                    `💬 "show test cases for [project]" - List project test cases\n` +
                    `💬 "set priority of test [name] to High/Medium/Low" - Update priority`,
                  inline: false
                },
                {
                  name: '📝 **Notes & Snippets**',
                  value: 
                    `\`/addnote\` - Create a new note\n` +
                    `\`/notes\` - List your recent notes\n` +
                    `\`/addsnippet\` - Create a code snippet\n` +
                    `\`/snippets\` - List your code snippets\n` +
                    `💬 "add note [title] [content]" - Create note via chat`,
                  inline: false
                },
                {
                  name: '🎫 **Support System**',
                  value: 
                    `\`/ticket create\` - Create a support ticket\n` +
                    `\`/ticket close [reason]\` - Close current ticket\n` +
                    `\`/ticket escalate <reason>\` - Escalate to higher staff\n` +
                    `\`/ticket delete\` - [STAFF ONLY] Delete ticket channel`,
                  inline: false
                },
                {
                  name: '👑 **Admin Commands**',
                  value: 
                    `\`/sendembed\` - Send custom embed message\n` +
                    `\`/sendrules\` - Post server rules\n` +
                    `\`/sendinfo\` - Post server information\n` +
                    `\`/sendwelcome\` - Post welcome message\n` +
                    `\`/sendroleselect\` - Post role selection`,
                  inline: false
                },
                {
                  name: '🤖 **AI & Natural Language**',
                  value: 
                    `💬 @mention me or DM for natural conversation\n` +
                    `💬 "what can you do?" - See NLU capabilities\n` +
                    `💬 "help with my code: [code]" - Code assistance\n` +
                    `💬 Ask general programming questions`,
                  inline: false
                }
              )
              .setFooter({ 
                text: '💬 = Natural Language | /command = Slash Command | Need help? Ask: "what can you do?"' 
              })
              .setTimestamp();

            await safeReply(interaction, { embeds: [helpEmbed], ephemeral: true });
            break;
          }
  
          // -------------------- Labnex non-ticket commands --------------------
  
          case 'linkaccount': {
            const replyFn = (c: string, e = false) => safeReply(interaction, { content: c, ephemeral: e });
            const sendDmFn = async (c: string) => {
              try { await interaction.user.send(c); }
              catch { await replyFn('I could not send you a DM. Please check your privacy settings.', true); }
            };
            await handleLinkAccount(interaction.user.id, interaction.user.username, replyFn, sendDmFn);
            break;
          }
  
          case 'projects': {
            const rf = (c: string, e = false) => safeReply(interaction, { content: c, ephemeral: e });
            await handleMyProjectsCommand(interaction.user.id, rf, interaction);
            break;
          }
  
          case 'tasks': {
            const projectIdentifier = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'project', false);
            const rf = (c: string, e = false) => safeReply(interaction, { content: c, ephemeral: e });
            await handleProjectTasksCommand(interaction.user.id, projectIdentifier, rf, interaction as CommandInteraction<CacheType>);
            break;
          }
  
          case 'createtask': {
            const opts: CreateTaskOptions = {
              discordUserId: interaction.user.id,
              projectIdentifier: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'project', true)!,
              title: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'title', true)!,
              description: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'description', false) || undefined,
              priority: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'priority', false) || undefined,
              status: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'status', false) || undefined,
              dueDate: getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'due_date', false) || undefined,
            };
            const rf = (c: string, e = false) => safeReply(interaction, { content: c, ephemeral: e });
            await handleCreateTaskCommand(opts, rf, interaction as CommandInteraction<CacheType>);
            break;
          }
  
          case 'taskinfo': {
            const id = getInteractionStringOption(interaction as CommandInteraction<CacheType>, 'task_identifier', true);
            const rf = (c: string, e = false) => safeReply(interaction, { content: c, ephemeral: e });
            await handleTaskInfoCommand(interaction.user.id, id!, rf, interaction as CommandInteraction<CacheType>);
            break;
          }
  
          case 'updatetask': {
            await handleUpdateTaskStatusCommand(interaction as CommandInteraction<CacheType>);
            break;
          }
  
          case 'addnote': {
            await handleAddNoteSlashCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'notes': {
            await handleListNotesSlashCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'addsnippet': {
            await handleAddSnippetSlashCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'snippets': {
            await handleListSnippetsSlashCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'sendembed': {
            await handleSendEmbedCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'sendrules': {
            await handleSendRulesCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'sendinfo': {
            await handleSendInfoCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'sendwelcome': {
            await handleSendWelcomeCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'sendroleselect': {
            await handleSendRoleSelectCommand(interaction as CommandInteraction<'cached'>);
            break;
          }
  
          case 'ping': {
            await safeReply(interaction, { content: 'Ping pong from Docker!', ephemeral: true });
            break;
          }
  
          default:
            await safeReply(interaction, { content: 'Command not recognized.', ephemeral: true });
        }
      }
  
      return { updatedMessagesReceived: received, updatedMessagesSent: sent };
    } catch (err) {
      console.error('[interactionCreateHandler] Unhandled error:', err);
      await safeReply(interaction, {
        content: 'Unexpected error. Please try again later.',
        ephemeral: true
      });
      return { updatedMessagesReceived: received, updatedMessagesSent: sent };
    }
  }
  