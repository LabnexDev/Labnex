export type IntentMemory = {
  activeProject: string | null;
  lastTask: string | null;
  lastIntent: string | null;
  lastUpdated: number; // epoch ms
  parseFailures: number;
  decayTimer?: NodeJS.Timeout;
  currentTopic: 'projectCreation' | 'testFlow' | 'navigation' | null;
  awaitingConfirmation: boolean;
  awaitingField?: string;
  pendingIntent?: import('./parseNLUCommand').ParsedIntent;
  activeView?: string;
  selectedItem?: { type: 'project' | 'task'; id: string } | null;
  history?: Array<{ intent: string; data: Record<string, unknown> }>;
  lastSuggestion?: string;
  lastSuggestionIntent?: import('./parseNLUCommand').ParsedIntent;
  lastSuggestionConfirmed?: boolean;
  wasInterrupted?: boolean;
  personalityCounter?: number;
  isSpeaking?: boolean;
  interruptedIntent?: import('./parseNLUCommand').ParsedIntent;
};

// Singleton memory stack
const memory: IntentMemory = {
  activeProject: null,
  lastTask: null,
  lastIntent: null,
  lastUpdated: Date.now(),
  parseFailures: 0,
  currentTopic: null,
  awaitingConfirmation: false,
  awaitingField: undefined,
  pendingIntent: undefined,
  activeView: undefined,
  selectedItem: null,
  history: [],
  lastSuggestion: undefined,
  lastSuggestionIntent: undefined,
  lastSuggestionConfirmed: false,
  wasInterrupted: false,
  personalityCounter: 0,
  isSpeaking: false,
  interruptedIntent: undefined
};

const DECAY_MS = 2 * 60 * 1000; // 2 minutes

function scheduleDecay() {
  if (memory.decayTimer) clearTimeout(memory.decayTimer);
  memory.decayTimer = setTimeout(() => {
    resetMemory();
  }, DECAY_MS);
}

export function touchMemory() {
  memory.lastUpdated = Date.now();
  scheduleDecay();
}

export function getMemory() {
  return memory;
}

export function updateMemory(partial: Partial<IntentMemory>) {
  Object.assign(memory, partial);
  touchMemory();
}

export function resetMemory() {
  memory.activeProject = null;
  memory.lastTask = null;
  memory.lastIntent = null;
  memory.parseFailures = 0;
  memory.lastUpdated = Date.now();
  if (memory.decayTimer) {
    clearTimeout(memory.decayTimer);
    memory.decayTimer = undefined;
  }
  memory.currentTopic = null;
  memory.awaitingConfirmation = false;
  memory.awaitingField = undefined;
  memory.pendingIntent = undefined;
  memory.activeView = undefined;
  memory.selectedItem = null;
  memory.history = [];
  memory.lastSuggestion = undefined;
  memory.lastSuggestionIntent = undefined;
  memory.lastSuggestionConfirmed = false;
  memory.wasInterrupted = false;
  memory.personalityCounter = 0;
  memory.isSpeaking = false;
  memory.interruptedIntent = undefined;
}

export function setAwaiting(field: string, intent: import('./parseNLUCommand').ParsedIntent) {
  memory.awaitingField = field;
  memory.pendingIntent = intent;
  touchMemory();
}

export function clearAwaiting() {
  memory.awaitingField = undefined;
  memory.pendingIntent = undefined;
  memory.awaitingConfirmation = false;
  touchMemory();
}

export function setLastSuggestion(intent: import('./parseNLUCommand').ParsedIntent, text: string) {
  memory.lastSuggestion = text;
  memory.lastSuggestionIntent = intent;
  memory.lastSuggestionConfirmed = false;
  touchMemory();
}

export function clearLastSuggestion() {
  memory.lastSuggestion = undefined;
  memory.lastSuggestionIntent = undefined;
  memory.lastSuggestionConfirmed = false;
  touchMemory();
}

export function addSuccessfulAction() {
  memory.personalityCounter = (memory.personalityCounter || 0) + 1;
  touchMemory();
}

export function markInterrupted() {
  memory.wasInterrupted = true;
  touchMemory();
}

export function clearInterrupted() {
  memory.wasInterrupted = false;
  touchMemory();
}

export function setIsSpeaking(val: boolean) {
  memory.isSpeaking = val;
  touchMemory();
}

export function setAwaitingConfirmation(val: boolean) {
  memory.awaitingConfirmation = val;
  touchMemory();
}

export function setInterruptedIntent(intent: import('./parseNLUCommand').ParsedIntent | undefined) {
  memory.interruptedIntent = intent;
  touchMemory();
} 