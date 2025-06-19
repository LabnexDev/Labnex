import {
    Client,
    Message,
    TextChannel,
    DMChannel,
    NewsChannel,
    ThreadChannel,
    EmbedBuilder
  } from 'discord.js';
  import {
    askChatGPT,
    assistWithCode,
    getIntentAndEntitiesFromQuery,
    NLUResponse
  } from '../chatgpt.service';
  import {
    testCasesInProgress,
    handleTestCaseCreationStep
  } from '../commands/testCaseCommands';
  import {
    handleGetProjectDetailsCommand,
    handleMyProjectsCommand,
    handleCreateProjectCommandNLU,
    projectsInProgress,
    handleProjectCreationStep,
    handleLinkAccount
  } from '../commands/projectCommands';
  import {
    handleGetTaskDetailsCommand,
    handleListTasksCommand,
    handleUpdateTaskStatusCommandNLU
  } from '../commands/taskCommands';
  import {
    handleAddNoteCommand,
    handleListNotesCommand
  } from '../commands/noteCommands';
  import {
    handleListSnippetsCommand,
    handleCreateSnippetCommand
  } from '../commands/snippetCommands';
  import { TestCaseInProgress, ProjectCreationInProgress } from '../types/labnexAI.types';
  import { activeTickets } from './interactionCreateHandler'; // Import the active tickets map
  import axios from 'axios';
  import OpenAI from 'openai';
  
  const LABNEX_API_URL = process.env.LABNEX_API_URL!;
  const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET!;
  const LABNEX_FRONTEND_URL = process.env.LABNEX_FRONTEND_URL; // Added for potential links
  
  // New Map for storing conversation contexts
  const conversationContexts = new Map<string, OpenAI.Chat.ChatCompletionMessageParam[]>();
  const MAX_CONTEXT_MESSAGES = 6; // Keeps last 3 user/assistant turns
  
  // Helper function to get conversation context
  const getConversationContext = (userId: string): { history: OpenAI.Chat.ChatCompletionMessageParam[] } => {
    if (!conversationContexts.has(userId)) {
      conversationContexts.set(userId, []);
    }
    return { history: conversationContexts.get(userId)! };
  };
  
  // Helper function to add to context and prune
  const updateConversationContext = (userId: string, role: 'user' | 'assistant', content: string) => {
    if (!conversationContexts.has(userId)) {
      conversationContexts.set(userId, []);
    }
    const userContext = conversationContexts.get(userId)!;
    userContext.push({ role, content });
    if (userContext.length > MAX_CONTEXT_MESSAGES) {
      conversationContexts.set(userId, userContext.slice(-MAX_CONTEXT_MESSAGES));
    }
  };
  
  interface ProjectSetupInProgress {
    discordUserId: string;
    featureTopic: string;
    projectName?: string;
    coverageLevel?: 'Light' | 'Medium' | 'Thorough';
    generateTasks?: boolean;
    currentQuestionField: 'projectName' | 'coverageLevel' | 'generateTasks' | 'confirmation';
    originalMessage: Message;
    lastBotMessage?: Message;
  }
  
  const projectsSetupInProgress = new Map<string, ProjectSetupInProgress>();
  
  let messagesReceivedFromDiscord = 0;
  let messagesSentToUser = 0;
  
  export async function handleMessageCreateEvent(
    message: Message,
    client: Client,
    currentMessagesReceived: number,
    currentMessagesSent: number
  ): Promise<{ updatedMessagesReceived: number; updatedMessagesSent: number }> {
    let localMessagesReceived = currentMessagesReceived;
    let localMessagesSent = currentMessagesSent;
  
    if (message.author.bot || !message.content) {
      return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
  
    // Handle ticket system DMs
    if (!message.guild && activeTickets.has(message.author.id)) {
        const threadId = activeTickets.get(message.author.id)!;
        const thread = await client.channels.fetch(threadId) as ThreadChannel;

        if (thread) {
            const userReplyEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(message.content)
                .setTimestamp();
            await thread.send({ embeds: [userReplyEmbed] });
            await message.react('✅');
        }
        // Return immediately after processing the ticket DM
        return { updatedMessagesReceived: localMessagesReceived + 1, updatedMessagesSent: localMessagesSent };
    }
  
    localMessagesReceived++;
    const discordUserId = message.author.id;
  
    // Ongoing project creation (classic flow)
    if (projectsInProgress.has(discordUserId)) {
      const progress = projectsInProgress.get(discordUserId)!;
      console.log(
        `[messageCreateHandler.ts] Continuing project creation for ${discordUserId}, field: ${progress.currentQuestionField}`
      );
      await handleProjectCreationStep(message, progress);
      return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
  
    // Ongoing project SETUP (NLU-driven)
    if (projectsSetupInProgress.has(discordUserId)) {
      const progress = projectsSetupInProgress.get(discordUserId)!;
      console.log(
        `[messageCreateHandler.ts] Continuing project SETUP for ${discordUserId}, field: ${progress.currentQuestionField}`
      );
      const result = await handleProjectSetupStep(message, progress, localMessagesSent);
      localMessagesSent = result.updatedMessagesSent;
      return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
  
    // Ongoing test-case flow
    if (testCasesInProgress.has(discordUserId)) {
      const progress = testCasesInProgress.get(discordUserId)!;
      console.log(
        `[messageCreateHandler.ts] Continuing test case creation for ${discordUserId}, field: ${progress.currentQuestionField}`
      );
      await handleTestCaseCreationStep(message, progress);
      return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
  
    // Determine NLU eligibility
    const isDM = !message.guild;
    let shouldProcessNLU = isDM;
    let cleanQuery = message.content.trim();
  
    if (!isDM && client.user && message.mentions.has(client.user.id)) {
      shouldProcessNLU = true;
      const mentionRegex = new RegExp(`<@!?${client.user.id}>\\s*`, 'g');
      cleanQuery = cleanQuery.replace(mentionRegex, '').trim();
  
      // Add user's message to context if NLU is triggered by mention
      updateConversationContext(discordUserId, 'user', cleanQuery);
  
      // Check for "project setup:" command
      const trigger = 'project setup:';
      if (cleanQuery.toLowerCase().startsWith(trigger)) {
        const featureTopic = cleanQuery.slice(trigger.length).trim();
        if (!featureTopic) {
          await message.reply(
            "Please provide a description: `@Labnex AI project setup: a password reset system`"
          );
          localMessagesSent++;
          return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
        }
        if (projectsSetupInProgress.has(discordUserId)) {
          await message.reply(
            'You are already setting up a project. Please complete or cancel the current one.'
          );
          localMessagesSent++;
          return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
        }
  
        const newProgress: ProjectSetupInProgress = {
          discordUserId,
          featureTopic,
          currentQuestionField: 'projectName',
          originalMessage: message
        };
        projectsSetupInProgress.set(discordUserId, newProgress);
  
        const firstQuestion =
          "Great! What should the project be called? (type 'skip' to auto-generate)";
        const botMsg = await message.reply(firstQuestion);
        localMessagesSent++;
        newProgress.lastBotMessage = botMsg;
        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
      }
    }
  
    if (isDM) {
      // Add user's message to context if it's a DM
      updateConversationContext(discordUserId, 'user', cleanQuery);
    }
  
    if (!shouldProcessNLU) {
      console.log(
        `[messageCreateHandler.ts] Ignoring message from ${message.author.tag} in guild (bot not mentioned).`
      );
      return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
    }
  
    console.log(
      `[messageCreateHandler.ts] NLU for ${message.author.tag}. Original: "${message.content}", Cleaned: "${cleanQuery}"`
    );
  
    // Ensure a default reply is set if no NLU intent is matched or if NLU fails.
    let assistantReplyForContext = "I'm not sure how to help with that. Can you try rephrasing?";
  
    // Typing indicator
    if (
      message.channel instanceof TextChannel ||
      message.channel instanceof DMChannel ||
      message.channel instanceof NewsChannel ||
      message.channel instanceof ThreadChannel
    ) {
      try {
        await message.channel.sendTyping();
      } catch {
        /* ignore */
      }
    }
  
    // Adjusted messageReply to accept string or MessageCreateOptions (for embeds)
    const messageReply = async (content: string | { embeds: EmbedBuilder[] }): Promise<void> => {
      try {
        if (typeof content === 'string') {
          await message.reply(content);
        } else {
          // Assuming content is { embeds: [EmbedBuilder] } based on usage
          await message.reply({ embeds: content.embeds });
        }
        localMessagesSent++;
      } catch (e) {
        console.error("[messageCreateHandler] Error in messageReply:", e);
        /* ignore for user, error logged */
      }
    };
  
    try {
      if (!cleanQuery) {
        await message.reply(
          "Hi! How can I help? You can ask me to create a test case or try other commands."
        );
        localMessagesSent++;
        // Add assistant's reply to context
        updateConversationContext(discordUserId, 'assistant', "Hi! How can I help? You can ask me to create a test case or try other commands.");
        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
      }
  
      // Get existing conversation context
      const conversationContext = getConversationContext(discordUserId);

      // Call NLU service with conversation context
      const nluResponse = await getIntentAndEntitiesFromQuery(cleanQuery, conversationContext.history);

      // If the NLU is uncertain, ask the user for clarification instead of guessing
      if (nluResponse && typeof nluResponse.confidence === 'number' && nluResponse.confidence < 0.55) {
        await messageReply(
          `🤔 I'm not completely sure what you need.
Here's what I understood:
• Intent: **${nluResponse.intent || 'general'}**

Could you please rephrase or give me a bit more detail?`);
        localMessagesSent++;
        // Store bot reply in context so the next turn has the history
        updateConversationContext(discordUserId, 'assistant', "I'm not completely sure what you need – asked for clarification.");
        return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
      }

      if (nluResponse?.intent) {
        switch (nluResponse.intent) {
          case 'link_discord_account': {
            console.log(`[messageCreateHandler] Intent: link_discord_account for ${discordUserId}`);
            assistantReplyForContext = "I'm processing your request to link your Discord account."; // Tentative reply
            try {
              await handleLinkAccount(
                message.author.id,
                message.author.tag, // discordUsername (e.g., User#1234)
                async (content: string, ephemeral?: boolean) => { // replyFunction
                  await messageReply(content);
                  assistantReplyForContext = content; // Update context with actual reply
                },
                async (content: string) => { // sendDmFunction
                  try {
                    await message.author.send(content);
                    localMessagesSent++; 
                    // DM content not typically added to channel context, but log it if needed
                    console.log(`[messageCreateHandler] Sent DM for account linking to ${message.author.tag}`);
                  } catch (dmError) {
                    console.error('[messageCreateHandler] Failed to send DM for account linking:', dmError);
                    const fallbackReply = "I tried to send you a DM with the link, but it seems your DMs are disabled. Please enable DMs from server members to link your account.";
                    await messageReply(fallbackReply);
                    assistantReplyForContext = fallbackReply;
                  }
                }
              );
            } catch (error) {
              console.error('[messageCreateHandler] Error calling handleLinkAccount:', error);
              const errorReply = "There was an error trying to link your account. Please try again later.";
              await messageReply(errorReply);
              assistantReplyForContext = errorReply;
            }
            break;
          }
          case 'create_test_case': {
            if (testCasesInProgress.has(discordUserId)) {
              await messageReply(
                "You're already creating a test case. Please finish or 'cancel' it first."
              );
              break;
            }

            const providedProjectIdentifier = nluResponse.entities?.project_name || nluResponse.entities?.project_identifier;

            if (providedProjectIdentifier) {
              try {
                // Verify project existence and user access
                const projectDetailsResponse = await axios.get<
                  { id: string; name: string; code?: string } // Simplified LabnexProjectDetails for this context
                >(
                  `${LABNEX_API_URL}/integrations/discord/project-details`,
                  {
                    headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                    params: {
                      discordUserId: discordUserId,
                      projectIdentifier: providedProjectIdentifier
                    }
                  }
                );

                if (projectDetailsResponse.data && projectDetailsResponse.data.id) {
                  const project = projectDetailsResponse.data;
                  const progress: TestCaseInProgress = {
                    discordUserId,
                    currentQuestionField: 'test_case_title', // Skip to title
                    originalMessage: message,
                    projectName: project.name, // Store verified project name
                    projectId: project.id // Store verified project ID
                  };
                  testCasesInProgress.set(discordUserId, progress);
                  const q = `Got it! What's the title for this test case in project "${project.name}"?`;
                  const botMsg = await message.reply(q);
                  localMessagesSent++;
                  progress.lastBotMessage = botMsg;
                } else {
                  // Should not happen if API returns 404, but as a fallback
                  await messageReply(
                    `I tried to find project "${providedProjectIdentifier}" but couldn't verify its details. Please check the name.`
                  );
                }
              } catch (error: any) {
                console.error(
                  `[messageCreateHandler] Error verifying project "${providedProjectIdentifier}" for test case:`, 
                  error.response?.data || error.message
                );
                await messageReply(
                  error.response?.data?.message || 
                  `I couldn't find a project named "${providedProjectIdentifier}" that you have access to. Please check the name, or you can say 'create a new project'.`
                );
                // Do not start test case creation flow if project verification fails
              }
            } else {
              // No project name provided, proceed with original flow
              const progress: TestCaseInProgress = {
                discordUserId,
                currentQuestionField: 'project_name',
                originalMessage: message
              };
              testCasesInProgress.set(discordUserId, progress);
              const q =
                'Which project is this test case for? Provide the project name or ID.';
              const botMsg = await message.reply(q);
              localMessagesSent++;
              progress.lastBotMessage = botMsg;
            }
            break;
          }
  
          case 'update_test_case_status': {
            const testCaseIdentifier = nluResponse.entities?.test_case_identifier;
            let rawNewStatus = nluResponse.entities?.new_status;
            let projectIdentifier = nluResponse.entities?.project_identifier; // Optional from NLU

            if (!testCaseIdentifier || !rawNewStatus) {
              await messageReply("I need to know which test case to update and what its new status should be. For example, 'mark Login test as Pass'.");
              break;
            }

            const normalizedStatus = normalizeStatus(rawNewStatus);

            if (!normalizedStatus) {
              await messageReply(`Invalid status "${rawNewStatus}". Valid options are: Pass, Fail, Pending (or synonyms like done, failed, waiting).`);
              break;
            }

            // Basic project context check (can be expanded later if needed)
            if (!projectIdentifier) {
              const userContext = conversationContexts.get(discordUserId);
              if (userContext && userContext.length > 0) {
                // A more sophisticated project context inference could be added here.
                // For now, if NLU didn't pick up a projectIdentifier, we let the API handle finding the test case.
                // The API will return 409 if it's ambiguous without a project identifier.
                console.log(`[messageCreateHandler] No projectIdentifier from NLU for update_test_case_status. User: ${discordUserId}. Will rely on API to resolve test case.`);
              }
            }
            
            try {
              // Ensure channel supports sendTyping
              if (message.channel instanceof TextChannel || 
                  message.channel instanceof DMChannel || 
                  message.channel instanceof NewsChannel || 
                  message.channel instanceof ThreadChannel) {
                await message.channel.sendTyping();
              }
              
              const response = await axios.put(`${LABNEX_API_URL}/integrations/discord/test-cases/${encodeURIComponent(testCaseIdentifier)}/status`, 
                {
                  discordUserId,
                  newStatus: normalizedStatus,
                  projectIdentifier // Can be undefined, controller handles it
                },
                {
                  headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET }
                }
              );
              await messageReply(response.data.message || `Test case status updated successfully!`);

            } catch (error: any) {
              if (axios.isAxiosError(error) && error.response) {
                const { status, data } = error.response;
                if (status === 404) {
                  await messageReply(data.message || `I couldn't find the test case "${testCaseIdentifier}". Please check the name/ID.`);
                } else if (status === 409 && data.type === 'AMBIGUOUS_TEST_CASE') {
                   await messageReply(data.message || `Multiple test cases found with the name "${testCaseIdentifier}". Please specify the project.`);
                } else if (status === 403) {
                  await messageReply(data.message || "You don't have permission to update this test case or access its project.");
                } else {
                  console.error('[messageCreateHandler] API error updating test case status:', data);
                  await messageReply("Sorry, something went wrong while trying to update the test case status. Please try again later.");
                }
              } else {
                console.error('[messageCreateHandler] Non-Axios error updating test case status:', error);
                await messageReply("An unexpected error occurred. Please try again.");
              }
            }
            break;
          }
  
          case 'get_nlu_capabilities': {
            const capabilitiesEmbed = new EmbedBuilder()
              .setColor(0x0099FF)
              .setTitle('What You Can Ask Me (Natural Language Commands)')
              .setDescription("Here's a list of things I can understand and do for you. You can usually phrase these in your own words, especially in DMs or when you @mention me in a channel.")
              .addFields(
                {
                  name: '🤖 Set up a new project using AI',
                  value: "**How:** Mention me with `@Labnex AI project setup: [your project idea]` (e.g., `@Labnex AI project setup: a recipe sharing website`).\n**What I do:** I'll ask for a project name (you can skip), test case coverage, and if you want tasks. Then, I'll use AI to generate the project, test cases, and tasks in Labnex."
                },
                {
                  name: '📝 Create a new test case',
                  value: "**How:** Say `create a test case` or `I want to add a new test case`.\n**What I do:** I'll guide you with questions for project, title, description, steps, expected result, and priority, then create it in Labnex."
                },
                {
                  name: '📈 Update Test Case Status',
                  value: "**How:** Say `mark test case \"[name or ID]\" as [Pass/Fail/Pending] [in project \"[project name/ID]\"]` (e.g., `mark \"Login Test\" as Passed`).\n**What I do:** I'll update the test case status in Labnex."
                },
                {
                  name: '📊 List Test Cases for a Project',
                  value: "**How:** Ask `show test cases for project \"[project name/ID]\"` (e.g., `list test cases for AuraTest`).\n**What I do:** I'll display test cases for the specified project, showing their status and priority."
                },
                {
                  name: '🔺 Update Test Case Priority',
                  value: "**How:** Say `set priority of test case \"[name or ID]\" to [High/Medium/Low] [in project \"[project name/ID]\"]` (e.g., `update priority of \"User Session\" to High`).\n**What I do:** I'll change the test case priority in Labnex."
                },
                {
                  name: '📄 Get task details',
                  value: "**How:** Ask `show task [ID or title]` or `details for task \"[task title]\"` (e.g., `details for TSK-001`).\n**What I do:** I'll fetch and display a summary of the task."
                },
                {
                  name: '🔄 Update task status',
                  value: "**How:** Say `update task [ID or title] to [new status]` (e.g., `update task \"Fix Login Bug\" to Done`).\n**What I do:** I'll change the task's status in Labnex."
                },
                {
                  name: '🗒️ Create a new note',
                  value: "**How:** Tell me `add note title [your title] content [your note content]` (e.g., `add note title Ideas content Brainstorm new dashboard widgets`).\n**What I do:** I'll save this note to your Labnex account."
                },
                {
                  name: '📚 List your notes',
                  value: "**How:** Ask `show my notes` or `list all my notes`.\n**What I do:** I'll display your 10 most recent notes."
                },
                {
                  name: '📂 Get project details',
                  value: "**How:** Say `show project [name or ID]` or `tell me about project \"[project name]\"`.\n**What I do:** I'll provide a project summary (description, owner, status, counts)."
                },
                {
                  name: '🗂️ List your projects',
                  value: "**How:** Ask `list my projects` or `what projects am I on?`.\n**What I do:** I'll show Labnex projects linked to your account."
                },
                {
                  name: '💾 Create a code snippet',
                  value: "**How:** Say `create snippet title [your title] language [language] code [your code block]` (e.g., `create snippet title MyUtil language python code def helper(): pass`).\n**What I do:** I'll save the snippet to your Labnex account."
                },
                {
                  name: '💻 List your code snippets',
                  value: "**How:** Ask `show my snippets` or `list my javascript snippets`.\n**What I do:** I'll display your 5 most recent snippets, filterable by language."
                },
                {
                  name: '❓ Ask general questions / Get code help',
                  value: "**How:** Ask a general knowledge question or for programming help (e.g., `explain recursion in Python` or `why is my JS map function not working? [code]`).\n**What I do:** I'll use my AI capabilities to answer or assist with your code."
                }
              )
              .setFooter({ text: 'Labnex AI | NLU Capabilities' });
            
            await messageReply({ embeds: [capabilitiesEmbed] });
            break;
          }
  
          case 'get_task_details': {
            const id = nluResponse.entities?.task_identifier;
            if (id) {
              await handleGetTaskDetailsCommand(discordUserId, id, messageReply);
            } else {
              await messageReply('I need a task ID or title fragment to look up.');
            }
            break;
          }
  
          case 'add_note': {
            const title = nluResponse.entities?.note_title;
            const content = nluResponse.entities?.note_content || nluResponse.entities?.text_content;
            if (title && content) {
              await handleAddNoteCommand({ discordUserId, title, content }, messageReply);
            } else {
              await messageReply('Please provide both a note title and its content.');
            }
            break;
          }
  
          case 'list_notes':
            await handleListNotesCommand(discordUserId, messageReply);
            break;
  
          case 'get_project_details': {
            const pid =
              nluResponse.entities?.project_name || nluResponse.entities?.project_identifier;
            if (pid) {
              await handleGetProjectDetailsCommand(discordUserId, pid, messageReply);
            } else {
              await messageReply("Which project's details do you need?");
            }
            break;
          }
  
          case 'list_projects':
            await handleMyProjectsCommand(discordUserId, messageReply);
            break;
  
          case 'list_tasks': {
            const pid =
              nluResponse.entities?.project_name || nluResponse.entities?.project_identifier;
            await handleListTasksCommand(discordUserId, pid, messageReply);
            break;
          }
  
          case 'update_task_status': {
            const id = nluResponse.entities?.task_identifier;
            const status = nluResponse.entities?.new_status;
            if (id && status) {
              await handleUpdateTaskStatusCommandNLU(discordUserId, id, status, messageReply);
            } else {
              await messageReply(
                "To update a task, I need its identifier and the new status."
              );
            }
            break;
          }
  
          case 'list_snippets': {
            const lang = nluResponse.entities?.language;
            await handleListSnippetsCommand(discordUserId, lang, messageReply);
            break;
          }
  
          case 'create_snippet': {
            const title = nluResponse.entities?.snippet_title;
            const lang = nluResponse.entities?.language;
            const code = nluResponse.entities?.code_block || nluResponse.entities?.text_content;
            if (title && lang && code) {
              await handleCreateSnippetCommand(
                { discordUserId, title, language: lang, code },
                messageReply
              );
            } else {
              await messageReply('I need a title, language, and code to create a snippet.');
            }
            break;
          }
  
          case 'assist_code': {
            const code = nluResponse.entities?.code_block || cleanQuery;
            const lang = nluResponse.entities?.language || 'javascript';
            const action =
              (nluResponse.entities?.action as 'cleanup' | 'fix_errors') || 'fix_errors';
            const result = await assistWithCode(code, lang, action);
            await messageReply(result);
            break;
          }
  
          case 'create_project': {
            await handleCreateProjectCommandNLU(
              discordUserId,
              nluResponse.entities?.project_name,
              nluResponse.entities?.project_description,
              nluResponse.entities?.project_code,
              message
            );
            break;
          }
  
          case 'list_test_cases': {
            const projectIdentifier = nluResponse.entities?.project_identifier || nluResponse.entities?.project_name;
            if (!projectIdentifier) {
              await messageReply("Which project's test cases do you want to see? Please provide the project name or ID.");
              break;
            }

            try {
              if (message.channel instanceof TextChannel || 
                  message.channel instanceof DMChannel || 
                  message.channel instanceof NewsChannel || 
                  message.channel instanceof ThreadChannel) {
                await message.channel.sendTyping();
              }

              const response = await axios.get(`${LABNEX_API_URL}/integrations/discord/projects/${encodeURIComponent(projectIdentifier)}/test-cases`, {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: { discordUserId }
              });

              const { projectName, testCases } = response.data;

              if (testCases && testCases.length > 0) {
                const embed = new EmbedBuilder()
                  .setColor(0x0099FF)
                  .setTitle(`🧪 Test Cases for Project: ${projectName}`);

                let description = testCases.map((tc: any) => 
                  `• **${tc.title}** — Status: ${capitalizeFirstLetter(tc.status || 'N/A')}, Priority: ${capitalizeFirstLetter(tc.priority || 'N/A')}`
                ).join('\n');

                if (testCases.length >= 10) { // Assuming limit was 10 in controller
                  description += '\n\n*Showing up to 10 most recently updated test cases.*';
                }
                
                embed.setDescription(description);
                await messageReply({ embeds: [embed] });
              } else {
                await messageReply(`Project "${projectName || projectIdentifier}" found, but it has no test cases yet.`);
              }

            } catch (error: any) {
              if (axios.isAxiosError(error) && error.response) {
                const { status, data } = error.response;
                if (status === 404) {
                  await messageReply(data.message || `I couldn't find a project named "${projectIdentifier}". Please check the name or ID.`);
                } else if (status === 403) {
                  await messageReply(data.message || `You don't have permission to view test cases for project "${projectIdentifier}".`);
                } else {
                  console.error('[messageCreateHandler] API error listing test cases:', data);
                  await messageReply("Sorry, something went wrong while trying to list the test cases.");
                }
              } else {
                console.error('[messageCreateHandler] Non-Axios error listing test cases:', error);
                await messageReply("An unexpected error occurred while listing test cases.");
              }
            }
            break;
          }
  
          case 'update_test_case_priority': {
            const testCaseIdentifier = nluResponse.entities?.test_case_identifier;
            const newPriority = nluResponse.entities?.new_priority;
            const projectIdentifier = nluResponse.entities?.project_identifier; // Optional

            if (!testCaseIdentifier || !newPriority) {
                await messageReply(`Please specify the test case name and the new priority. For example: "Set priority of 'Login test' to High."`)
                break;
            }

            const normalizedPriority = normalizePriority(newPriority);
            if (!normalizedPriority) {
                await messageReply(`Invalid priority: "${newPriority}". Please use High, Medium, or Low.`);
                break;
            }

            try {
                if (message.channel instanceof TextChannel || message.channel instanceof DMChannel || message.channel instanceof NewsChannel || message.channel instanceof ThreadChannel) {
                    await message.channel.sendTyping();
                }
                const response = await axios.put(
                    `${LABNEX_API_URL}/integrations/discord/test-cases/${encodeURIComponent(testCaseIdentifier)}/priority`,
                    {
                        discordUserId: discordUserId,
                        newPriority: normalizedPriority, // Send normalized priority
                        projectIdentifier: projectIdentifier // Optional, API will handle if null
                    },
                    {
                        headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                    }
                );
                if (response.data && response.data.message) {
                    await messageReply(response.data.message);
                } else {
                    await messageReply(`Successfully updated priority of "${testCaseIdentifier}" to ${normalizedPriority}.`);
                }
            } catch (error: any) {
                console.error('[messageCreateHandler] Error updating test case priority:', error.response?.data || error.message);
                if (error.response?.data?.message) {
                    await messageReply(`Error: ${error.response.data.message}`);
                } else {
                    await messageReply(`Sorry, I couldn't update the priority for "${testCaseIdentifier}". Please ensure the test case and project (if specified) exist and you have permissions.`);
                }
            }
            break;
        }
  
          default: {
            if (process.env.OPENAI_API_KEY) {
              const userContext = conversationContexts.get(discordUserId) || [];
              const gptRes = await askChatGPT(cleanQuery, userContext);
              await messageReply(gptRes);
              updateConversationContext(discordUserId, 'assistant', gptRes); // Add bot's response to context
            } else {
              await messageReply(
                `I understood your intent as "${nluResponse.intent}", but AI features are offline.`
              );
            }
          }
        }
      } else if (process.env.OPENAI_API_KEY) {
        const userContext = conversationContexts.get(discordUserId) || [];
        const gptRes = await askChatGPT(cleanQuery, userContext);
        await messageReply(gptRes);
        updateConversationContext(discordUserId, 'assistant', gptRes); // Add bot's response to context
      }
    } catch (err: any) {
      console.error('[messageCreateHandler.ts] Error processing message:', err);
      try {
        await message.reply(
          'Sorry, I had trouble understanding that. Could you rephrase or use a specific command?'
        );
        localMessagesSent++;
      } catch {
        /* swallow */
      }
    }
  
    // Add assistant's final reply to context
    updateConversationContext(discordUserId, 'assistant', assistantReplyForContext);

    return { updatedMessagesReceived: localMessagesReceived, updatedMessagesSent: localMessagesSent };
  }
  
  async function handleProjectSetupStep(
    message: Message,
    progress: ProjectSetupInProgress,
    currentMessagesSent: number
  ): Promise<{ updatedMessagesSent: number }> {
    let localMessagesSent = currentMessagesSent;
    const input = message.content.trim().toLowerCase();
    const discordUserId = message.author.id;
  
    const reply = async (content: string | { embeds: EmbedBuilder[] }) => {
      try {
        const botMsg = await progress.originalMessage.reply(content);
        localMessagesSent++;
        progress.lastBotMessage = botMsg;
        projectsSetupInProgress.set(discordUserId, progress);
      } catch (e) {
        console.error('[handleProjectSetupStep] Error sending reply:', e);
      }
    };
  
    if (input === 'cancel') {
      projectsSetupInProgress.delete(discordUserId);
      await reply('Project setup cancelled.');
      return { updatedMessagesSent: localMessagesSent };
    }
  
    switch (progress.currentQuestionField) {
      case 'projectName':
        if (input !== 'skip' && input) {
          progress.projectName = message.content.trim();
        }
        progress.currentQuestionField = 'coverageLevel';
        await reply(
          'How much test coverage would you like? (Light, Medium, Thorough — default Medium)'
        );
        break;
  
      case 'coverageLevel':
        if (['light', 'medium', 'thorough'].includes(input)) {
          progress.coverageLevel = (input.charAt(0).toUpperCase() + input.slice(1)) as
            | 'Light'
            | 'Medium'
            | 'Thorough';
        } else {
          progress.coverageLevel = 'Medium';
        }
        progress.currentQuestionField = 'generateTasks';
        await reply('Generate initial dev tasks? (Yes/No — default No)');
        break;
  
      case 'generateTasks':
        progress.generateTasks = input === 'yes';
        progress.currentQuestionField = 'confirmation';
        await reply(
          `About to set up:\n• Feature: "${progress.featureTopic}"\n• Name: ${
            progress.projectName || '(auto-generated)'
          }\n• Coverage: ${progress.coverageLevel}\n• Dev tasks: ${
            progress.generateTasks ? 'Yes' : 'No'
          }\n\nProceed? (Yes/No)`
        );
        break;
  
      case 'confirmation':
        if (input === 'yes') {
          await reply('Great! Setting up your project now…');
          const jwt = process.env.LABNEX_BOT_SERVICE_ACCOUNT_JWT!;
          if (!jwt) {
            await reply(
              "Internal config missing. Please notify an admin."
            );
            projectsSetupInProgress.delete(discordUserId);
            return { updatedMessagesSent: localMessagesSent };
          }
          try {
            const payload = {
              featureTopic: progress.featureTopic,
              projectName: progress.projectName,
              coverageLevel: progress.coverageLevel,
              generateTasks: progress.generateTasks,
              discordUserId
            };
            const resp = await axios.post(
              `${LABNEX_API_URL}/integrations/discord/project-setup`,
              payload,
              { headers: { Authorization: `Bearer ${jwt}` } }
            );
            if (resp.status === 201 && resp.data) {
              const { project, testCases, tasks } = resp.data;
              let summary = `✅ **${project.name}** (${project.code}) created!\n${project.description}\n\n`;
              summary += `🧪 ${testCases.length} test cases generated:\n`;
              testCases.forEach((tc: any) => {
                summary += `• ${tc.title} (Priority: ${tc.priority})\n`;
              });
              if (progress.generateTasks) {
                summary += `\n📋 ${tasks.length} dev tasks generated:\n`;
                tasks.forEach((t: any) => {
                  summary += `• ${t.title} (Ref: ${t.taskReferenceId})\n`;
                });
              }
              const embed = new EmbedBuilder()
                .setTitle(`Project Setup Complete: ${project.name}`)
                .setDescription(summary)
                .setColor(0x0099ff);
              await reply({ embeds: [embed] });
            } else {
              await reply(
                `Backend error: ${resp.status} - ${resp.data.message || 'Unknown'}`
              );
            }
          } catch (apiErr: any) {
            console.error('[handleProjectSetupStep] API Error:', apiErr);
            await reply(
              `Error setting up project: ${
                apiErr.response?.data?.message || apiErr.message
              }`
            );
          }
          projectsSetupInProgress.delete(discordUserId);
        } else {
          await reply('Setup cancelled. You can start over anytime.');
          projectsSetupInProgress.delete(discordUserId);
        }
        break;
  
      default:
        console.error(
          `[handleProjectSetupStep] Unknown field: ${progress.currentQuestionField}`
        );
        projectsSetupInProgress.delete(discordUserId);
        await reply('An error occurred. Please try again.');
    }
  
    return { updatedMessagesSent: localMessagesSent };
  }
  
  // Helper function to normalize status strings
  function normalizeStatus(status: string): 'Pass' | 'Fail' | 'Pending' | null {
    const s = status.toLowerCase().trim();
    if (['pass', 'passed', 'done', 'complete', 'ok', 'good', 'successful'].includes(s)) return 'Pass';
    if (['fail', 'failed', 'broken', 'error', 'bad', 'unsuccessful', 'not working'].includes(s)) return 'Fail';
    if (['pending', 'waiting', 'in progress', 'todo', 'hold', 'on hold', 'pending review', 'needs review'].includes(s)) return 'Pending';
    return null;
  }
  
  // Helper function to normalize priority strings
  function normalizePriority(priority: string): 'High' | 'Medium' | 'Low' | null {
    const p = priority.toLowerCase().trim();
    if (['high', 'hi', 'urgent', 'critical'].includes(p)) return 'High';
    if (['medium', 'med', 'normal', 'standard'].includes(p)) return 'Medium';
    if (['low', 'lo', 'deferred', 'later'].includes(p)) return 'Low';
    return null;
  }
  
  // Helper function to capitalize the first letter of a string
  function capitalizeFirstLetter(string: string): string {
    if (!string) return 'N/A';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  