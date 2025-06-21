import { validateIntent, type ParsedIntent, type Intent } from './parseNLUCommand';
import { executeSlashCommand, type CommandResult } from './slashCommandHandler';
import { isAffirmative } from './isAffirmative';
import { listenOnce, speak } from './voiceListenOnce';
import type { VoiceTranscriptResult } from './handleVoiceTranscript';

// Field prompts for different intents
const FIELD_PROMPTS: Record<Intent, Record<string, string>> = {
  createProject: {
    name: "What should the project name be?",
    description: "What's the project description?",
    projectCode: "What should the project code be?"
  },
  createTestCase: {
    description: "What should the test case description be?",
    projectId: "Which project is this test case for?",
    priority: "What's the priority level?"
  },
  createTask: {
    title: "What should the task title be?",
    projectId: "Which project is this task for?",
    assignee: "Who should this task be assigned to?",
    dueDate: "When is this task due?",
    priority: "What's the priority level?"
  },
  createNote: {
    content: "What should the note content be?",
    projectId: "Which project is this note for?"
  },
  navigate: {
    route: "Where would you like to navigate to?",
    destination: "Which page would you like to go to?"
  },
  showList: {
    type: "What type of items would you like to see?",
    itemType: "What would you like to list?"
  },
  help: {},
  queryHistory: {},
  confirmRedirect: {},
  resetMemory: {},
  unknown: {}
};

// Confirmation messages for different intents
const CONFIRMATION_MESSAGES: Record<Intent, (data: Record<string, any>) => string> = {
  createProject: (data) => `Create project "${data.name}"${data.description ? ` with description "${data.description}"` : ''}${data.projectCode ? ` and code "${data.projectCode}"` : ''} — is that correct?`,
  createTestCase: (data) => `Create test case "${data.description}"${data.projectId ? ` for project "${data.projectId}"` : ''}${data.priority ? ` with ${data.priority} priority` : ''} — is that correct?`,
  createTask: (data) => `Create task "${data.title}"${data.projectId ? ` for project "${data.projectId}"` : ''}${data.assignee ? ` assigned to ${data.assignee}` : ''}${data.dueDate ? ` due ${data.dueDate}` : ''}${data.priority ? ` with ${data.priority} priority` : ''} — is that correct?`,
  createNote: (data) => `Create note "${data.content}"${data.projectId ? ` for project "${data.projectId}"` : ''} — is that correct?`,
  navigate: (data) => `Navigate to ${data.destination || data.route} — is that correct?`,
  showList: (data) => `Show list of ${data.itemType || data.type}${data.projectId ? ` for project "${data.projectId}"` : ''} — is that correct?`,
  help: () => "Show help information — is that correct?",
  queryHistory: () => "Show your recent activity history — is that correct?",
  confirmRedirect: () => "Confirm the redirect — is that correct?",
  resetMemory: () => "Reset your conversational memory — is that correct?",
  unknown: () => "Process unknown command — is that correct?"
};

// Global state for multi-turn conversations
let conversationState: {
  intent?: ParsedIntent;
  missingFields?: string[];
  currentFieldIndex?: number;
  context?: any;
} = {};

/**
 * Handle intent progressively by gathering missing fields over multiple turns
 */
export async function handleIntentProgressively(
  intent: ParsedIntent,
  context: { navigate?: (path: string) => void; currentProjectId?: string } = {}
): Promise<VoiceTranscriptResult> {
  
  // Validate the intent to get missing fields
  const validation = validateIntent(intent);
  
  if (validation.isValid) {
    // All fields are now present, proceed to confirmation
    return confirmIntent(intent, context);
  }

  // Initialize conversation state if starting new intent
  if (!conversationState.intent || conversationState.intent.intent !== intent.intent) {
    conversationState = {
      intent: { ...intent },
      missingFields: validation.missingFields,
      currentFieldIndex: 0,
      context
    };
  }

  // Collect missing fields progressively
  while (conversationState.missingFields && 
         conversationState.currentFieldIndex !== undefined &&
         conversationState.currentFieldIndex < conversationState.missingFields.length) {
    
    const currentField = conversationState.missingFields[conversationState.currentFieldIndex];
    const fieldPrompts = FIELD_PROMPTS[intent.intent] || {};
    const prompt = fieldPrompts[currentField] || `What should the ${currentField} be?`;

    try {
      // Speak the prompt
      await speak(prompt);
      
      // Listen for the response
      const response = await listenOnce();
      
      if (response) {
        // Update the intent data with the field value
        conversationState.intent!.data[currentField] = response.trim();
        conversationState.currentFieldIndex++;
      } else {
        return {
          response: "I didn't catch that. Could you try again?",
          success: false,
          needsProgressiveHandling: true
        };
      }
    } catch (error) {
      console.error('Error during field collection:', error);
      return {
        response: "Sorry, I had trouble hearing you. Let's try again.",
        success: false,
        needsProgressiveHandling: true
      };
    }
  }

  // All fields collected, proceed to confirmation
  return confirmIntent(conversationState.intent!, context);
}

/**
 * Process a field value response in an ongoing conversation
 */
export async function handleFieldResponse(
  fieldValue: string,
  context: { navigate?: (path: string) => void; currentProjectId?: string } = {}
): Promise<VoiceTranscriptResult> {
  
  if (!conversationState.intent || !conversationState.missingFields) {
    return { response: "I'm not sure what you're referring to. Could you start over?" };
  }

  const currentField = conversationState.missingFields[conversationState.currentFieldIndex || 0];
  
  if (!currentField) {
    return { response: "Something went wrong. Let's start over." };
  }

  // Update the intent data with the field value
  conversationState.intent.data[currentField] = fieldValue.trim();

  // Move to next field
  conversationState.currentFieldIndex = (conversationState.currentFieldIndex || 0) + 1;

  // Check if we have more fields to collect
  if (conversationState.currentFieldIndex < conversationState.missingFields.length) {
    const nextField = conversationState.missingFields[conversationState.currentFieldIndex];
    const fieldPrompts = FIELD_PROMPTS[conversationState.intent.intent] || {};
    const prompt = fieldPrompts[nextField] || `What should the ${nextField} be?`;
    
    return {
      response: prompt,
      success: false,
      needsProgressiveHandling: true
    };
  }

  // All fields collected, proceed to confirmation
  return confirmIntent(conversationState.intent, context);
}

/**
 * Confirm the intent before execution
 */
async function confirmIntent(
  intent: ParsedIntent,
  context: { navigate?: (path: string) => void; currentProjectId?: string } = {}
): Promise<VoiceTranscriptResult> {
  
  // Generate confirmation message
  const confirmationGenerator = CONFIRMATION_MESSAGES[intent.intent];
  const confirmationMessage = confirmationGenerator ? confirmationGenerator(intent.data) : 
    `Execute ${intent.intent} command — is that correct?`;

  try {
    // Speak the confirmation message
    await speak(confirmationMessage);
    
    // Listen for yes/no response
    const response = await listenOnce();
    
    if (isAffirmative(response)) {
      // User confirmed - execute the intent
      try {
        const result: CommandResult = await executeSlashCommand(intent, {
          navigate: context.navigate,
          currentProjectId: context.currentProjectId
        });

        // Clear conversation state
        conversationState = {};

        return {
          response: result.message,
          success: result.success,
          data: result.data
        };
      } catch (error) {
        console.error('Command execution failed:', error);
        conversationState = {};
        return { 
          response: "Sorry, I encountered an error executing that command.",
          success: false 
        };
      }
    } else {
      // User declined - cancel the operation
      conversationState = {};
      return {
        response: "Okay, I've canceled that operation.",
        success: false
      };
    }
  } catch (error) {
    console.error('Error during confirmation:', error);
    return {
      response: "Sorry, I had trouble hearing your confirmation. Let's try again.",
      success: false,
      needsProgressiveHandling: true
    };
  }
}

/**
 * Handle confirmation response (yes/no)
 */
export async function handleConfirmationResponse(
  response: string,
  context: { navigate?: (path: string) => void; currentProjectId?: string } = {}
): Promise<VoiceTranscriptResult> {
  
  if (!conversationState.intent) {
    return { response: "I'm not sure what you're confirming. Could you start over?" };
  }

  if (isAffirmative(response)) {
    // User confirmed - execute the intent
    try {
      const result: CommandResult = await executeSlashCommand(conversationState.intent, {
        navigate: context.navigate,
        currentProjectId: context.currentProjectId
      });

      // Clear conversation state
      conversationState = {};

      return {
        response: result.message,
        success: result.success,
        data: result.data
      };
    } catch (error) {
      console.error('Command execution failed:', error);
      conversationState = {};
      return { 
        response: "Sorry, I encountered an error executing that command.",
        success: false 
      };
    }
  } else {
    // User declined - cancel the operation
    conversationState = {};
    return {
      response: "Okay, I've canceled that operation.",
      success: false
    };
  }
}

/**
 * Check if we're currently in a progressive conversation
 */
export function isInProgressiveConversation(): boolean {
  return !!conversationState.intent;
}

/**
 * Get the current conversation state (for debugging)
 */
export function getConversationState() {
  return { ...conversationState };
}

/**
 * Clear the conversation state
 */
export function clearConversationState(): void {
  conversationState = {};
}

/**
 * Determine if the response should be handled as a field value, confirmation, or new intent
 */
export function determineResponseType(response: string): 'field' | 'confirmation' | 'new_intent' {
  if (!conversationState.intent) {
    return 'new_intent';
  }

  // Check if this looks like a yes/no confirmation
  if (isAffirmative(response) || /^(no|nah|cancel|stop|never)/i.test(response.trim())) {
    return 'confirmation';
  }

  // Check if we're still collecting fields
  if (conversationState.missingFields && 
      conversationState.currentFieldIndex !== undefined &&
      conversationState.currentFieldIndex < conversationState.missingFields.length) {
    return 'field';
  }

  // If we have all fields but haven't confirmed yet, this could be confirmation
  if (conversationState.missingFields && 
      conversationState.currentFieldIndex !== undefined &&
      conversationState.currentFieldIndex >= conversationState.missingFields.length) {
    return 'confirmation';
  }

  return 'new_intent';
} 