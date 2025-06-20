import { validateIntent, type ParsedIntent, type Intent } from './parseNLUCommand';
import { dispatchAction } from './commandDispatcher';
import { resetMemory, setAwaiting, updateMemory, setLastSuggestion, addSuccessfulAction, clearInterrupted, getMemory, setAwaitingConfirmation, setInterruptedIntent } from './voiceContext';
import { voiceReplies } from './voiceReplies';
import { suggestNextActions } from './suggestNextActions';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  action?: string;
}

export interface SlashCommandContext {
  navigate?: (path: string) => void;
  currentProjectId?: string;
  userId?: string;
  isDebugMode?: boolean;
}

/**
 * Execute a parsed intent by routing to appropriate actions
 */
export async function executeSlashCommand(
  parsed: ParsedIntent,
  context: SlashCommandContext = {}
): Promise<CommandResult> {
  const { isDebugMode = false } = context;
  
  // Log in debug mode
  if (isDebugMode) {
    console.log('🎤 Voice Command:', {
      intent: parsed.intent,
      confidence: parsed.confidence,
      data: parsed.data,
      originalText: parsed.originalText
    });
  }

  // Validate intent has required data
  const validation = validateIntent(parsed);
  if (!validation.isValid) {
    const { missingFields } = validation;
    const field = missingFields[0];
    setAwaiting(field, parsed);
    return {
      success: false,
      message: voiceReplies.missingField(field),
      action: 'awaiting_field'
    };
  }

  // Route intent to appropriate handler
  try {
    switch (parsed.intent) {
      case 'createProject':
        return await handleCreateProject(parsed, context);
      
      case 'createTask':
        return await handleCreateTask(parsed, context);
      
      case 'createTestCase':
        return await handleCreateTestCase(parsed, context);
      
      case 'createNote':
        return await handleCreateNote(parsed, context);
      
      case 'navigate':
        return handleNavigation(parsed, context);
      
      case 'showList':
        return handleShowList(parsed, context);
      
      case 'help':
        return handleHelp();
      
      case 'resetMemory':
        resetMemory();
        return {
          success: true,
          message: '🧹 Memory cleared. Ready for a fresh start.',
          action: 'memory_reset'
        };
      
      case 'queryHistory':
        return handleQueryHistory();
      
      case 'confirmRedirect':
        return handleConfirmRedirect(parsed);
      
      case 'unknown':
      default:
        return handleUnknownCommand(parsed);
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return {
      success: false,
      message: `Failed to execute command: ${(error as Error).message}`,
      action: 'execution_error'
    };
  }
}

/**
 * Handle project creation
 */
async function handleCreateProject(parsed: ParsedIntent, context: SlashCommandContext): Promise<CommandResult> {
  const { name, description, projectCode } = parsed.data;
  
  try {
    await dispatchAction(
      {
        name: 'createProject',
        params: { name, description, projectCode }
      },
      { projectId: context.currentProjectId }
    );

    const suggestionArr = suggestNextActions('createProject');
    const suggestion = suggestionArr[Math.floor(Math.random()*suggestionArr.length)] || undefined;
    if (suggestion) setLastSuggestion(parsed, suggestion);

    addSuccessfulAction();
    updateMemory({ history: [...(getMemory().history || []), { intent: parsed.intent, data: parsed.data }] });
    clearInterrupted();

    const memory = getMemory();
    const pc = memory.personalityCounter ?? 0;
    const encouragement = pc > 0 && pc % 3 === 0 ? ' ' + voiceReplies.encouragement() : '';

    return {
      success: true,
      message: `✅ ${voiceReplies.acknowledgement()} ${voiceReplies.projectCreated()} ("${name}")${suggestion ? ' ' + suggestion : ''}${encouragement}`,
      data: { name, description, projectCode, suggestion },
      action: 'project_created'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create project: ${(error as Error).message}`,
      action: 'project_creation_failed'
    };
  }
}

/**
 * Handle task creation
 */
async function handleCreateTask(parsed: ParsedIntent, context: SlashCommandContext): Promise<CommandResult> {
  const { title, projectId, assignee, dueDate, priority } = parsed.data;
  const targetProjectId = projectId || context.currentProjectId;

  if (!targetProjectId) {
    return {
      success: false,
      message: "❌ No project specified. Please say 'create task for [project name]' or select a project first.",
      action: 'missing_project_context'
    };
  }

  try {
    await dispatchAction(
      {
        name: 'createTask',
        params: { title, projectId: targetProjectId, assignee, dueDate, priority }
      },
      { projectId: targetProjectId }
    );

    const suggestionArr = suggestNextActions('createTask');
    const suggestion = suggestionArr[Math.floor(Math.random()*suggestionArr.length)] || undefined;
    if (suggestion) setLastSuggestion(parsed, suggestion);

    return {
      success: true,
      message: `✅ ${voiceReplies.acknowledgement()} ${voiceReplies.taskCreated()} ("${title}")${suggestion ? ' ' + suggestion : ''}`,
      data: { title, projectId: targetProjectId, assignee, dueDate, priority, suggestion },
      action: 'task_created'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create task: ${(error as Error).message}`,
      action: 'task_creation_failed'
    };
  }
}

/**
 * Handle test case creation
 */
async function handleCreateTestCase(parsed: ParsedIntent, context: SlashCommandContext): Promise<CommandResult> {
  const { description, projectId, priority } = parsed.data;
  const targetProjectId = projectId || context.currentProjectId;

  // For now, create as a task since test cases might use task structure
  try {
    await dispatchAction(
      {
        name: 'createTask',
        params: { 
          title: `Test: ${description}`, 
          projectId: targetProjectId, 
          priority: priority || 'medium',
          type: 'test-case'
        }
      },
      { projectId: targetProjectId }
    );

    const suggestionArr = suggestNextActions('createTestCase');
    const suggestion = suggestionArr[Math.floor(Math.random()*suggestionArr.length)] || undefined;
    if (suggestion) setLastSuggestion(parsed, suggestion);

    return {
      success: true,
      message: `✅ ${voiceReplies.acknowledgement()} ${voiceReplies.taskCreated()} ("${description}")${suggestion ? ' ' + suggestion : ''}`,
      data: { description, projectId: targetProjectId, priority, suggestion },
      action: 'test_case_created'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to create test case: ${(error as Error).message}`,
      action: 'test_case_creation_failed'
    };
  }
}

/**
 * Handle note creation
 */
async function handleCreateNote(parsed: ParsedIntent, context: SlashCommandContext): Promise<CommandResult> {
  const { content, projectId } = parsed.data;
  const targetProjectId = projectId || context.currentProjectId;

  try {
    await dispatchAction(
      {
        name: 'createNote',
        params: { content, projectId: targetProjectId }
      },
      { projectId: targetProjectId }
    );

    return {
      success: true,
      message: `📝 Note saved successfully!`,
      data: { content, projectId: targetProjectId },
      action: 'note_created'
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to save note: ${(error as Error).message}`,
      action: 'note_creation_failed'
    };
  }
}

/**
 * Handle navigation commands
 */
function handleNavigation(parsed: ParsedIntent, context: SlashCommandContext): CommandResult {
  const { destination, route } = parsed.data;
  const { navigate } = context;

  if (!navigate) {
    return {
      success: false,
      message: "❌ Navigation not available in this context",
      action: 'navigation_unavailable'
    };
  }

  try {
    navigate(route);
    return {
      success: true,
      message: `🧭 Navigating to ${destination}...`,
      data: { destination, route },
      action: 'navigation_completed'
    };
  } catch {
    return {
      success: false,
      message: `❌ Failed to navigate to ${destination}`,
      action: 'navigation_failed'
    };
  }
}

/**
 * Handle list/show commands
 */
function handleShowList(parsed: ParsedIntent, context: SlashCommandContext): CommandResult {
  const { type, projectId, status, itemType } = parsed.data;
  const { navigate } = context;

  // For now, navigate to appropriate pages
  // In a full implementation, this would fetch and display data
  const routeMap: Record<string, string> = {
    'tasks': '/tasks',
    'projects': '/projects', 
    'notes': '/notes',
    'testCases': '/test-cases',
    'errors': '/dashboard', // Could be error reports section
    'reports': '/dashboard'
  };

  const targetRoute = routeMap[type] || '/dashboard';

  if (navigate) {
    try {
      navigate(targetRoute);
      return {
        success: true,
        message: `📋 Showing ${itemType}...`,
        data: { type, projectId, status, route: targetRoute },
        action: 'list_displayed'
      };
    } catch {
      return {
        success: false,
        message: `❌ Failed to show ${itemType}`,
        action: 'list_display_failed'
      };
    }
  }

  return {
    success: true,
    message: `📋 Found request to show ${itemType}${projectId ? ` for project ${projectId}` : ''}${status ? ` with status ${status}` : ''}`,
    data: { type, projectId, status },
    action: 'list_info_provided'
  };
}

/**
 * Handle help commands
 */
function handleHelp(): CommandResult {
  const helpMessage = `
🎤 **Voice Commands Available:**

**Project Management:**
• "Create a new project called [name]"
• "Make a project for [description]"

**Task Management:**
• "Create a task to [description]"
• "Add a task for project [name]"
• "New task: [title]"

**Test Cases:**
• "Create a test case for [feature]"
• "Add a test to check [functionality]"

**Navigation:**
• "Go to dashboard"
• "Open projects page"
• "Show settings"

**Information:**
• "Show all tasks"
• "List my projects"
• "Display notes"

**Notes:**
• "Create a note about [topic]"
• "Remember [information]"

Try speaking naturally! I understand many variations of these commands.
  `.trim();

  return {
    success: true,
    message: helpMessage,
    action: 'help_displayed'
  };
}

/**
 * Handle query history command
 */
function handleQueryHistory(): CommandResult {
  const memory = getMemory();
  const history = memory.history || [];

  if (history.length === 0) {
    return {
      success: true,
      message: '🗃️ No recent actions yet.',
      data: { history },
      action: 'history_empty'
    };
  }

  const recent = history.slice(-5).reverse();
  const lines = recent.map((h, idx) => `${idx + 1}. ${h.intent}`).join('\n');

  return {
    success: true,
    message: `🗃️ Here are your recent actions:\n${lines}`,
    data: { history: recent },
    action: 'history_shown'
  };
}

/**
 * Handle confirm redirect prompt - ask user for confirmation
 */
function handleConfirmRedirect(parsed: ParsedIntent): CommandResult {
  const { newIntent, interruptedIntent } = parsed.data as { newIntent: ParsedIntent; interruptedIntent: ParsedIntent };

  // Store for later
  setAwaitingConfirmation(true);
  updateMemory({ pendingIntent: newIntent });
  setInterruptedIntent(interruptedIntent);

  return {
    success: false,
    message: `❓ Do you want to cancel the previous task and proceed?`,
    data: { newIntent, interruptedIntent },
    action: 'awaiting_confirmation'
  };
}

/**
 * Handle unknown commands
 */
function handleUnknownCommand(intent: ParsedIntent): CommandResult {
  const { query } = intent.data;
  
  return {
    success: false,
    message: `❓ I didn't understand "${query}". Try saying "help" to see available commands, or speak more clearly about what you'd like to do.`,
    data: { query },
    action: 'unknown_command'
  };
}

/**
 * Get available commands as a structured list
 */
export function getAvailableCommands(): Record<Intent, string[]> {
  return {
    createProject: [
      "Create a new project called [name]",
      "Make a project for [description]",
      "Start a new project [name]"
    ],
    createTask: [
      "Create a task to [description]",
      "Add a task for project [name]", 
      "New task: [title]"
    ],
    createTestCase: [
      "Create a test case for [feature]",
      "Add a test to check [functionality]",
      "Test [description]"
    ],
    createNote: [
      "Create a note about [topic]",
      "Remember [information]",
      "Save note: [content]"
    ],
    navigate: [
      "Go to [page]",
      "Open [section]",
      "Show [page] page"
    ],
    showList: [
      "Show all [items]",
      "List my [items]",
      "Display [items]"
    ],
    help: [
      "Help",
      "What can you do?",
      "Show commands"
    ],
    resetMemory: [
      "Clear memory",
      "Start over",
      "New session"
    ],
    queryHistory: [
      "Query history",
      "Show command history",
      "History"
    ],
    confirmRedirect: [
      "Confirm redirect",
      "Redirect to [page]"
    ],
    unknown: []
  };
}

/**
 * Format command result for display
 */
export function formatCommandResult(result: CommandResult, showDetails = false): string {
  let message = result.message;
  
  if (showDetails && result.data) {
    const details = Object.entries(result.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    message += `\n📊 Details: ${details}`;
  }
  
  return message;
}

/**
 * Execute an array of parsed intents sequentially. Useful for multi-command voice input.
 */
export async function executeCommandQueue(intents: ParsedIntent[], context: SlashCommandContext = {}): Promise<CommandResult[]> {
  const results: CommandResult[] = [];

  for (const intent of intents) {
    // eslint-disable-next-line no-await-in-loop
    const result = await executeSlashCommand(intent, context);
    results.push(result);

    // If a command failed validation or execution, decide whether to stop.
    if (!result.success) {
      // For now, continue with next commands. Optionally break here to stop.
    }
  }

  return results;
} 