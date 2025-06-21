import { parseNLUCommand, validateIntent, type ParsedIntent } from './parseNLUCommand';
import { executeSlashCommand, type CommandResult } from './slashCommandHandler';
import { isAffirmative } from './isAffirmative';

// Enhanced types for the multi-turn system
export interface MultiTurnVoiceResult {
  response: string;
  success?: boolean;
  data?: Record<string, any>;
  needsInput?: boolean;
  isComplete?: boolean;
  nextPrompt?: string;
}

export interface VoiceSystemContext {
  navigate?: (path: string) => void;
  currentProjectId?: string;
  speakFunction?: (text: string) => Promise<void>;
  listenFunction?: () => Promise<string>;
}

// Field prompts for different intents (dynamic mapping)
const FIELD_PROMPTS: Record<string, Record<string, string>> = {
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
    itemType: "What would you like to list?",
    projectId: "Which project would you like to filter by?"
  }
};

// Confirmation message generators
const CONFIRMATION_GENERATORS: Record<string, (data: Record<string, any>) => string> = {
  createProject: (data) => `Create project "${data.name}"${data.description ? ` with description "${data.description}"` : ''}${data.projectCode ? ` and code "${data.projectCode}"` : ''} — is that okay?`,
  createTestCase: (data) => `Create test case "${data.description}"${data.projectId ? ` for project "${data.projectId}"` : ''}${data.priority ? ` with ${data.priority} priority` : ''} — is that okay?`,
  createTask: (data) => `Create task "${data.title}"${data.projectId ? ` for project "${data.projectId}"` : ''}${data.assignee ? ` assigned to ${data.assignee}` : ''}${data.dueDate ? ` due ${data.dueDate}` : ''}${data.priority ? ` with ${data.priority} priority` : ''} — is that okay?`,
  createNote: (data) => `Create note "${data.content}"${data.projectId ? ` for project "${data.projectId}"` : ''} — is that okay?`,
  navigate: (data) => `Navigate to ${data.destination || data.route} — is that okay?`,
  showList: (data) => `Show list of ${data.itemType || data.type}${data.projectId ? ` for project "${data.projectId}"` : ''} — is that okay?`
};

/**
 * Multi-turn voice command processor class
 * Handles progressive field collection and confirmation for voice commands
 */
export class MultiTurnVoiceProcessor {
  private currentIntent?: ParsedIntent;
  private missingFields: string[] = [];
  private currentFieldIndex = 0;
  private awaitingConfirmation = false;
  private context: VoiceSystemContext = {};

  constructor(context: VoiceSystemContext = {}) {
    this.context = context;
  }

  /**
   * Main entry point for processing voice transcripts
   */
  async processVoiceTranscript(transcript: string): Promise<MultiTurnVoiceResult> {
    if (!transcript.trim()) {
      return { response: "I didn't catch that.", isComplete: true };
    }

    // If we're in the middle of a conversation, handle contextually
    if (this.currentIntent) {
      if (this.awaitingConfirmation) {
        return this.handleConfirmationResponse(transcript);
      } else if (this.currentFieldIndex < this.missingFields.length) {
        return this.handleFieldResponse(transcript);
      }
    }

    // Parse new command
    const parsedIntent = parseNLUCommand(transcript);

    // Handle unknown intents
    if (parsedIntent.intent === 'unknown' || parsedIntent.confidence < 0.3) {
      return { response: "I didn't catch that. Could you try rephrasing?", isComplete: true };
    }

    // Start processing this intent
    return this.startIntentProcessing(parsedIntent);
  }

  /**
   * Start processing a new intent
   */
  private async startIntentProcessing(intent: ParsedIntent): Promise<MultiTurnVoiceResult> {
    this.currentIntent = { ...intent };
    this.awaitingConfirmation = false;
    this.currentFieldIndex = 0;

    // Validate required fields
    const validation = validateIntent(intent);

    if (validation.isValid) {
      // All fields present, go straight to confirmation
      return this.proceedToConfirmation();
    }

    // Store missing fields and start collection
    this.missingFields = validation.missingFields;
    return this.promptForNextField();
  }

  /**
   * Handle field value response
   */
  private async handleFieldResponse(fieldValue: string): Promise<MultiTurnVoiceResult> {
    if (!this.currentIntent || this.currentFieldIndex >= this.missingFields.length) {
      return { response: "Something went wrong. Let's start over.", isComplete: true };
    }

    const currentField = this.missingFields[this.currentFieldIndex];
    
    // Update intent data with field value
    this.currentIntent.data[currentField] = fieldValue.trim();
    this.currentFieldIndex++;

    // Check if we have more fields to collect
    if (this.currentFieldIndex < this.missingFields.length) {
      return this.promptForNextField();
    }

    // All fields collected, proceed to confirmation
    return this.proceedToConfirmation();
  }

  /**
   * Prompt for the next required field
   */
  private promptForNextField(): MultiTurnVoiceResult {
    if (!this.currentIntent || this.currentFieldIndex >= this.missingFields.length) {
      return { response: "Something went wrong. Let's start over.", isComplete: true };
    }

    const field = this.missingFields[this.currentFieldIndex];
    const fieldPrompts = FIELD_PROMPTS[this.currentIntent.intent] || {};
    const prompt = fieldPrompts[field] || `What should the ${field} be?`;

    return {
      response: prompt,
      needsInput: true,
      isComplete: false,
      nextPrompt: prompt
    };
  }

  /**
   * Proceed to confirmation step
   */
  private proceedToConfirmation(): MultiTurnVoiceResult {
    if (!this.currentIntent) {
      return { response: "Something went wrong. Let's start over.", isComplete: true };
    }

    this.awaitingConfirmation = true;
    
    const confirmationGenerator = CONFIRMATION_GENERATORS[this.currentIntent.intent];
    const confirmationMessage = confirmationGenerator ? 
      confirmationGenerator(this.currentIntent.data) : 
      `Execute ${this.currentIntent.intent} command — is that okay?`;

    return {
      response: confirmationMessage,
      needsInput: true,
      isComplete: false,
      nextPrompt: confirmationMessage
    };
  }

  /**
   * Handle confirmation response (yes/no)
   */
  private async handleConfirmationResponse(response: string): Promise<MultiTurnVoiceResult> {
    if (!this.currentIntent) {
      return { response: "I'm not sure what you're confirming. Let's start over.", isComplete: true };
    }

    if (isAffirmative(response)) {
      // User confirmed - execute the intent
      try {
        const result: CommandResult = await executeSlashCommand(this.currentIntent, {
          navigate: this.context.navigate,
          currentProjectId: this.context.currentProjectId
        });

        // Clear state
        this.reset();

        return {
          response: result.message,
          success: result.success,
          data: result.data,
          isComplete: true
        };
      } catch (error) {
        console.error('Command execution failed:', error);
        this.reset();
        return { 
          response: "Sorry, I encountered an error executing that command.",
          success: false,
          isComplete: true
        };
      }
    } else {
      // User declined - cancel the operation
      this.reset();
      return {
        response: "Okay, I've canceled that operation.",
        success: false,
        isComplete: true
      };
    }
  }

  /**
   * Reset the processor state
   */
  reset(): void {
    this.currentIntent = undefined;
    this.missingFields = [];
    this.currentFieldIndex = 0;
    this.awaitingConfirmation = false;
  }

  /**
   * Check if processor is currently handling an intent
   */
  isProcessing(): boolean {
    return !!this.currentIntent;
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      currentIntent: this.currentIntent,
      missingFields: this.missingFields,
      currentFieldIndex: this.currentFieldIndex,
      awaitingConfirmation: this.awaitingConfirmation,
      isProcessing: this.isProcessing()
    };
  }
}

/**
 * Factory function to create a new processor instance
 */
export function createMultiTurnVoiceProcessor(context: VoiceSystemContext = {}): MultiTurnVoiceProcessor {
  return new MultiTurnVoiceProcessor(context);
} 