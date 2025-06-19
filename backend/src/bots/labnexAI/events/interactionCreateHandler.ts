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
          case 'ticket':
            await safeReply(interaction, { content: 'Ticket command stub.', ephemeral: true });
            break;
  
          case 'help': {
            await safeReply(interaction, {
              content: 'Help placeholder – list commands here.',
              ephemeral: true
            });
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
  