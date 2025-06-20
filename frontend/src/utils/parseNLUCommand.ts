import { updateMemory, getMemory, clearAwaiting, clearLastSuggestion, markInterrupted } from './voiceContext';
import { isAffirmative } from './isAffirmative';

function isNegative(text: string): boolean {
  return /^(no|nah|cancel|stop|never|resume)/i.test(text.trim());
}

export type Intent = 
  | 'createProject' 
  | 'navigate' 
  | 'createTestCase' 
  | 'createTask' 
  | 'createNote'
  | 'showList' 
  | 'help'
  | 'queryHistory'
  | 'confirmRedirect'
  | 'resetMemory'
  | 'unknown';

export interface ParsedIntent {
  intent: Intent;
  confidence: number;
  data: Record<string, any>;
  originalText: string;
}

export interface IntentPattern {
  patterns: RegExp[];
  intent: Intent;
  extractData: (match: RegExpMatchArray, fullText: string) => Record<string, any>;
}

// Enhanced pattern matching with entity extraction
const intentPatterns: IntentPattern[] = [
  // Project Management
  {
    intent: 'createProject',
    patterns: [
      /(?:create|make|start|new)\s+(?:a\s+)?(?:new\s+)?project\s+(?:called|named|for)?\s*(.+)/i,
      /(?:create|make|start|new)\s+(?:a\s+)?(?:new\s+)?project\s+(.+)/i,
      /(?:new|create)\s+project\s*:\s*(.+)/i
    ],
    extractData: (match, fullText) => {
      const name = match[1]?.trim().replace(/["']/g, '') || 'New Project';
      
      // Extract additional details from the full text
      const descMatch = fullText.match(/(?:description|desc|about)\s*[:=]?\s*([^,]+)/i);
      const description = descMatch?.[1]?.trim() || '';
      
      const codeMatch = fullText.match(/(?:code|identifier|id)\s*[:=]?\s*([A-Z0-9_-]+)/i);
      const projectCode = codeMatch?.[1]?.trim() || name.slice(0, 10).replace(/\s+/g, '').toUpperCase();
      
      return { name, description, projectCode };
    }
  },
  
  // Test Case Management
  {
    intent: 'createTestCase',
    patterns: [
      /(?:create|make|add|new)\s+(?:a\s+)?(?:new\s+)?test\s*(?:case)?\s+(?:for|about|to\s+test)?\s*(.+)/i,
      /(?:test|testing)\s+(.+)/i,
      /(?:add|new)\s+test\s*:\s*(.+)/i
    ],
    extractData: (match, fullText) => {
      const description = match[1]?.trim().replace(/["']/g, '') || 'New test case';
      
      // Extract project context
      const projectMatch = fullText.match(/(?:project|in)\s+([^,\s]+)/i);
      const projectId = projectMatch?.[1]?.trim();
      
      // Extract priority
      const priorityMatch = fullText.match(/(?:priority|urgent|critical|high|medium|low)\s*[:=]?\s*(urgent|critical|high|medium|low)/i);
      const priority = priorityMatch?.[1]?.toLowerCase();
      
      return { description, projectId, priority };
    }
  },
  
  // Task Management
  {
    intent: 'createTask',
    patterns: [
      /(?:create|make|add|new)\s+(?:a\s+)?(?:new\s+)?task\s+(?:for|about|to)?\s*(.+)/i,
      /(?:add|new)\s+task\s*:\s*(.+)/i,
      /(?:todo|to\s+do)\s*:\s*(.+)/i
    ],
    extractData: (match, fullText) => {
      const title = match[1]?.trim().replace(/["']/g, '') || 'New task';
      
      // Extract project context
      const projectMatch = fullText.match(/(?:project|in)\s+([^,\s]+)/i);
      const projectId = projectMatch?.[1]?.trim();
      
      // Extract assignee
      const assigneeMatch = fullText.match(/(?:assign(?:ed)?\s+to|for)\s+([^,\s]+)/i);
      const assignee = assigneeMatch?.[1]?.trim();
      
      // Extract due date
      const dueDateMatch = fullText.match(/(?:due|deadline|by)\s+([^,]+)/i);
      const dueDate = dueDateMatch?.[1]?.trim();
      
      // Extract priority
      const priorityMatch = fullText.match(/(?:priority|urgent|critical|high|medium|low)\s*[:=]?\s*(urgent|critical|high|medium|low)/i);
      const priority = priorityMatch?.[1]?.toLowerCase();
      
      return { title, projectId, assignee, dueDate, priority };
    }
  },
  
  // Notes
  {
    intent: 'createNote',
    patterns: [
      /(?:create|make|add|new)\s+(?:a\s+)?(?:new\s+)?note\s+(?:about|for)?\s*(.+)/i,
      /(?:note|write)\s*:\s*(.+)/i,
      /(?:remember|save)\s+(?:this|that)?\s*(.+)/i
    ],
    extractData: (match, fullText) => {
      const content = match[1]?.trim().replace(/["']/g, '') || 'New note';
      
      // Extract project context
      const projectMatch = fullText.match(/(?:project|in)\s+([^,\s]+)/i);
      const projectId = projectMatch?.[1]?.trim();
      
      return { content, projectId };
    }
  },
  
  // Navigation Commands
  {
    intent: 'navigate',
    patterns: [
      /(?:go\s+to|navigate\s+to|open|show)\s+(?:the\s+)?(.+?)(?:\s+page|\s+section|$)/i,
      /(?:take\s+me\s+to|switch\s+to)\s+(?:the\s+)?(.+)/i,
      /(?:dashboard|home|settings|projects|tasks|notes|tests)/i
    ],
    extractData: (match, fullText) => {
      let destination = match[1]?.trim().toLowerCase() || fullText.trim().toLowerCase();
      
      // Map common variations
      const navigationMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'home': '/dashboard',
        'projects': '/projects',
        'project': '/projects',
        'tasks': '/tasks',
        'task': '/tasks',
        'notes': '/notes',
        'note': '/notes',
        'tests': '/test-cases',
        'test cases': '/test-cases',
        'testing': '/test-cases',
        'settings': '/settings',
        'profile': '/settings',
        'ai': '/ai',
        'voice': '/ai/voice-mode',
        'voice mode': '/ai/voice-mode'
      };
      
      const route = navigationMap[destination] || `/${destination.replace(/\s+/g, '-')}`;
      
      return { destination, route };
    }
  },
  
  // Information Retrieval
  {
    intent: 'showList',
    patterns: [
      /(?:show|list|display)\s+(?:me\s+)?(?:all\s+)?(.+)/i,
      /(?:what|which)\s+(.+)\s+(?:are\s+there|do\s+i\s+have|exist)/i,
      /(?:get|fetch)\s+(?:all\s+)?(.+)/i
    ],
    extractData: (match, fullText) => {
      const itemType = match[1]?.trim().toLowerCase() || 'items';
      
      // Extract filters
      const projectMatch = fullText.match(/(?:project|in)\s+([^,\s]+)/i);
      const projectId = projectMatch?.[1]?.trim();
      
      const statusMatch = fullText.match(/(?:status|with\s+status)\s*[:=]?\s*(open|closed|pending|done|complete)/i);
      const status = statusMatch?.[1]?.toLowerCase();
      
      // Map item types
      const typeMap: Record<string, string> = {
        'tasks': 'tasks',
        'projects': 'projects',
        'notes': 'notes',
        'test cases': 'testCases',
        'tests': 'testCases',
        'errors': 'errors',
        'reports': 'reports'
      };
      
      const type = typeMap[itemType] || itemType;
      
      return { type, projectId, status, itemType };
    }
  },
  
  // Reset Memory
  {
    intent: 'resetMemory',
    patterns: [
      /(clear|reset|delete|forget)\s+(memory|context|everything|session)/i,
      /start\s+over/i,
      /new\s+session/i
    ],
    extractData: () => ({})
  },
  
  // Help
  {
    intent: 'help',
    patterns: [
      /(?:help|what\s+can\s+you\s+do|commands?|how\s+do\s+i)/i,
      /(?:what\s+commands?|available\s+commands?)/i
    ],
    extractData: () => ({ })
  },
  
  // Query History / Memory Recall
  {
    intent: 'queryHistory',
    patterns: [
      /(?:what|show|tell)(?:\s+me)?(?:\s+my)?(?:\s+last|\s+recent)?\s+(?:actions?|commands?|tasks?|projects?|things|history)/i,
      /history\s+(?:of|for)?\s*(?:my\s+)?(?:tasks?|projects?|commands?|actions?)/i,
      /(what|which)\s+(?:projects?|tasks?|actions?)\s+did\s+i\s+(?:work|do|run)\s+(?:on|last|recently)?/i
    ],
    extractData: () => ({})
  }
];

/**
 * Parse natural language into structured intent with confidence scoring
 */
export function parseNLUCommand(input: string): ParsedIntent {
  const normalizedInput = input.trim();
  
  if (!normalizedInput) {
    return {
      intent: 'unknown',
      confidence: 0,
      data: {},
      originalText: input
    };
  }
  
  const memory = getMemory();
  
  // Handle pending confirmation (after an interruption prompt)
  if (memory.awaitingConfirmation && memory.pendingIntent) {
    if (isAffirmative(normalizedInput)) {
      // User confirmed switch
      const confirmed = memory.pendingIntent as ParsedIntent;
      // Clear flags
      memory.awaitingConfirmation = false;
      memory.pendingIntent = undefined;
      memory.interruptedIntent = undefined;
      memory.wasInterrupted = false;
      updateMemory(memory);
      return confirmed;
    }
    if (isNegative(normalizedInput)) {
      // User declined switch → resume previous flow
      const resumeIntent = memory.interruptedIntent || { intent: 'unknown', confidence: 0.2, data: {}, originalText: normalizedInput } as ParsedIntent;
      memory.awaitingConfirmation = false;
      memory.pendingIntent = undefined;
      memory.interruptedIntent = undefined;
      memory.wasInterrupted = false;
      updateMemory(memory);
      return resumeIntent;
    }
    // If neither yes nor no, ask again? For now treat as unknown.
  }
  
  // Confirmation of last suggestion
  if (memory.lastSuggestionIntent && isAffirmative(normalizedInput)) {
    const confirmed = memory.lastSuggestionIntent;
    clearLastSuggestion();
    return confirmed;
  }
  
  // If awaiting a field and no explicit intent recognised yet, treat input as value
  if (memory.awaitingField && memory.pendingIntent) {
    const filled = {
      ...memory.pendingIntent,
      data: {
        ...memory.pendingIntent.data,
        [memory.awaitingField]: normalizedInput
      }
    } as ParsedIntent;
    clearAwaiting();
    updateMemory({ history: [...(memory.history || []), { intent: filled.intent, data: filled.data }] });
    return filled;
  }
  
  let bestMatch: ParsedIntent | null = null;
  let highestConfidence = 0;
  
  for (const pattern of intentPatterns) {
    for (const regex of pattern.patterns) {
      const match = normalizedInput.match(regex);
      
      if (match) {
        // Calculate confidence based on match quality
        const matchLength = match[0].length;
        const inputLength = normalizedInput.length;
        const coverageScore = matchLength / inputLength;
        
        // Boost confidence for exact keyword matches
        const keywordBoost = getKeywordBoost(normalizedInput, pattern.intent);
        
        // Penalize if match is too short compared to input
        const lengthPenalty = inputLength > 50 && matchLength < 20 ? 0.3 : 0;
        
        const confidence = Math.min(0.95, Math.max(0.1, 
          (coverageScore * 0.6) + (keywordBoost * 0.4) - lengthPenalty
        ));
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            intent: pattern.intent,
            confidence,
            data: pattern.extractData(match, normalizedInput),
            originalText: input
          };
        }
      }
    }
  }
  
  // If no good match found, return unknown with low confidence
  if (!bestMatch || highestConfidence < 0.3) {
    return {
      intent: 'unknown',
      confidence: 0.1,
      data: { query: normalizedInput },
      originalText: input
    };
  }
  
  const parsed = bestMatch || {
    intent: 'unknown',
    confidence: 0.2,
    data: {},
    originalText: input
  };

  // Interruption handling:
  if ((memory.isSpeaking || (memory.awaitingField && memory.pendingIntent)) && parsed.intent !== 'unknown') {
    if (memory.awaitingField) {
      // Cancel awaiting field flow
      clearAwaiting();
    }
    markInterrupted();
    memory.isSpeaking = false;
    // If we had an awaitingField earlier, we need confirmation
    if (memory.pendingIntent) {
      updateMemory(memory);
      return {
        intent: 'confirmRedirect',
        confidence: 1,
        data: { newIntent: parsed, interruptedIntent: memory.pendingIntent },
        originalText: input
      } as ParsedIntent;
    }
  }

  // Memory updates
  // memory already retrieved earlier

  // --- Memory stack updates ---
  memory.lastIntent = parsed.intent;

  if (parsed.intent === 'createProject' && parsed.data.name) {
    memory.activeProject = parsed.data.name;
  }

  if (parsed.intent === 'createTask' && parsed.data.title) {
    memory.lastTask = parsed.data.title;
  }

  // If command missing projectId but memory has activeProject, inject it
  if ((parsed.intent === 'createTask' || parsed.intent === 'createTestCase' || parsed.intent === 'createNote') && !parsed.data.projectId && memory.activeProject) {
    parsed.data.projectId = memory.activeProject;
  }

  // Track consecutive failures
  if (parsed.intent === 'unknown') {
    memory.parseFailures += 1;
  } else {
    memory.parseFailures = 0;
  }

  updateMemory(memory);

  return parsed;
}

/**
 * Calculate keyword boost for confidence scoring
 */
function getKeywordBoost(text: string, intent: Intent): number {
  const keywords: Record<Intent, string[]> = {
    createProject: ['create', 'new', 'project', 'make', 'start'],
    createTestCase: ['test', 'testing', 'case', 'create', 'add'],
    createTask: ['task', 'todo', 'create', 'add', 'new'],
    createNote: ['note', 'remember', 'save', 'write'],
    navigate: ['go', 'navigate', 'open', 'show', 'page'],
    showList: ['show', 'list', 'display', 'all', 'get'],
    help: ['help', 'commands', 'how'],
    queryHistory: ['history', 'recent', 'last', 'done', 'show', 'tell'],
    confirmRedirect: [],
    resetMemory: ['reset', 'clear', 'memory', 'start'],
    unknown: []
  };
  
  const intentKeywords = keywords[intent] || [];
  const lowerText = text.toLowerCase();
  
  const foundKeywords = intentKeywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  return foundKeywords.length / Math.max(intentKeywords.length, 1);
}

/**
 * Get human-readable description of intent
 */
export function getIntentDescription(intent: Intent): string {
  const descriptions: Record<Intent, string> = {
    createProject: 'Create a new project',
    createTestCase: 'Create a test case',
    createTask: 'Create a task',
    createNote: 'Create a note',
    navigate: 'Navigate to page',
    showList: 'Show list of items',
    help: 'Show help information',
    queryHistory: 'Recall recent actions',
    confirmRedirect: 'Confirm redirect',
    resetMemory: 'Reset conversational memory',
    unknown: 'Unknown command'
  };
  
  return descriptions[intent];
}

/**
 * Validate if parsed intent has required data
 */
export function validateIntent(parsed: ParsedIntent): { isValid: boolean; missingFields: string[] } {
  const requiredFields: Record<Intent, string[]> = {
    createProject: ['name'],
    createTestCase: ['description'],
    createTask: ['title'],
    createNote: ['content'],
    navigate: ['route'],
    showList: ['type'],
    help: [],
    queryHistory: [],
    confirmRedirect: [],
    resetMemory: [],
    unknown: []
  };
  
  const required = requiredFields[parsed.intent] || [];
  const missingFields = required.filter(field => !parsed.data[field]);
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// ----------------- Multi-command parsing ------------------

export function parseMultiCommand(input: string): ParsedIntent[] {
  const segments = input
    .split(/\s*(?:,|and then|then|and)\s+/i)
    .map(seg => seg.trim())
    .filter(Boolean);

  const intents: ParsedIntent[] = [];

  for (const segment of segments) {
    intents.push(parseNLUCommand(segment));
  }

  return intents;
} 