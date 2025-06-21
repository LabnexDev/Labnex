import { parseNLUCommand, validateIntent } from './parseNLUCommand';
import { createMultiTurnVoiceProcessor } from './multiTurnVoiceHandler';

/**
 * Test scenarios for "Tell me about" voice commands
 */

export const tellMeAboutScenarios = {
  projects: {
    description: "User asks about their projects",
    commands: [
      "tell me about my projects",
      "tell me about projects", 
      "what about my projects",
      "give me info about my projects",
      "describe my projects",
      "overview of my projects",
      "show me my projects",
      "list my projects"
    ],
    expectedIntent: 'showList',
    expectedType: 'projects'
  },

  tasks: {
    description: "User asks about their tasks",
    commands: [
      "tell me about my tasks",
      "tell me about tasks",
      "what about my work",
      "tell me about my todos",
      "describe my assignments", 
      "overview of my tasks",
      "show me my tasks",
      "list my todos"
    ],
    expectedIntent: 'showList',
    expectedType: 'tasks'
  },

  testCases: {
    description: "User asks about their test cases",
    commands: [
      "tell me about my test cases",
      "tell me about tests",
      "what about my testing",
      "describe my test cases",
      "overview of my tests",
      "show me test cases",
      "list my tests"
    ],
    expectedIntent: 'showList',
    expectedType: 'testCases'
  },

  notes: {
    description: "User asks about their notes", 
    commands: [
      "tell me about my notes",
      "tell me about notes",
      "what about my notes",
      "describe my notes",
      "overview of my notes",
      "show me my notes",
      "list my notes"
    ],
    expectedIntent: 'showList',
    expectedType: 'notes'
  },

  recentActivity: {
    description: "User asks about recent activity/history",
    commands: [
      "tell me about my recent activity",
      "tell me about my recent work",
      "what about my recent projects",
      "tell me about my latest tasks",
      "show me my recent history",
      "what have I been working on"
    ],
    expectedIntent: 'queryHistory', // or showList depending on specific phrasing
  }
};

/**
 * Test parsing of "tell me about" commands
 */
export function testTellMeAboutParsing() {
  console.log("🗣️ Testing 'Tell Me About' Command Parsing\n");

  Object.entries(tellMeAboutScenarios).forEach(([_category, scenario]) => {
    console.log(`\n📋 ${scenario.description}`);
    console.log("─".repeat(50));

    scenario.commands.forEach(command => {
      const parsed = parseNLUCommand(command);
      const validation = validateIntent(parsed);

      console.log(`Input: "${command}"`);
      console.log(`Intent: ${parsed.intent} (confidence: ${parsed.confidence.toFixed(2)})`);
      
      if (parsed.data.type || parsed.data.itemType) {
        console.log(`Type: ${parsed.data.type || parsed.data.itemType}`);
      }
      
      console.log(`Data:`, parsed.data);
      console.log(`Missing fields:`, validation.missingFields);
      console.log();
    });
  });
}

/**
 * Simulate multi-turn conversations for "tell me about" commands
 */
export async function simulateTellMeAboutConversation() {
  console.log("🎤 Simulating 'Tell Me About' Multi-Turn Conversations\n");

  const processor = createMultiTurnVoiceProcessor({
    navigate: (path) => console.log(`Navigate to: ${path}`),
    currentProjectId: "project-123"
  });

  // Scenario 1: Complete command
  console.log("📋 Scenario 1: Complete Command");
  console.log('👤 User: "tell me about my projects"');
  let result = await processor.processVoiceTranscript("tell me about my projects");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Complete: ${result.isComplete}, Needs input: ${result.needsInput}\n`);

  // Scenario 2: Ambiguous command that might need clarification
  console.log("📋 Scenario 2: Vague Command");
  console.log('👤 User: "tell me about my work"');
  result = await processor.processVoiceTranscript("tell me about my work");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Complete: ${result.isComplete}, Needs input: ${result.needsInput}\n`);

  // Reset processor for clean state
  processor.reset();

  // Scenario 3: Command that needs confirmation
  console.log("📋 Scenario 3: Command with Confirmation");
  console.log('👤 User: "show me my test cases"');
  result = await processor.processVoiceTranscript("show me my test cases");
  console.log(`🤖 System: "${result.response}"`);
  
  if (result.needsInput) {
    console.log('👤 User: "yes"');
    result = await processor.processVoiceTranscript("yes");
    console.log(`🤖 System: "${result.response}"`);
    console.log(`Complete: ${result.isComplete}\n`);
  }
}

/**
 * Test edge cases and variations
 */
export const edgeCaseCommands = [
  // Natural variations
  "what can you tell me about my projects",
  "I want to know about my tasks", 
  "can you show me information about my notes",
  "give me a summary of my test cases",
  "how about my recent work",
  
  // With qualifiers
  "tell me about my current projects",
  "tell me about my open tasks",
  "tell me about my high priority tasks",
  "show me my projects in WebApp",
  
  // Casual variations
  "what's up with my projects",
  "how are my tasks doing",
  "what's the status of my notes",
  "catch me up on my test cases",
  
  // Formal variations
  "provide an overview of my projects",
  "I'd like a report on my tasks", 
  "could you summarize my notes",
  "please show me my test cases"
];

/**
 * Test edge cases
 */
export function testEdgeCases() {
  console.log("🔍 Testing Edge Cases and Natural Variations\n");

  edgeCaseCommands.forEach(command => {
    const parsed = parseNLUCommand(command);
    console.log(`"${command}"`);
    console.log(`→ Intent: ${parsed.intent} (${parsed.confidence.toFixed(2)})`);
    if (parsed.data.type) console.log(`→ Type: ${parsed.data.type}`);
    console.log();
  });
}

/**
 * Expected multi-turn flows for "tell me about" commands
 */
export const expectedFlows = {
  "tell me about my projects": {
    intent: "showList",
    multiTurn: false, // Should execute immediately
    confirmation: true, // May need confirmation
    expectedResponse: "Show list of projects — is that okay?"
  },
  
  "tell me about my tasks": {
    intent: "showList", 
    multiTurn: false,
    confirmation: true,
    expectedResponse: "Show list of tasks — is that okay?"
  },
  
  "tell me about my test cases": {
    intent: "showList",
    multiTurn: false,
    confirmation: true, 
    expectedResponse: "Show list of testCases — is that okay?"
  },
  
  "tell me about my notes": {
    intent: "showList",
    multiTurn: false,
    confirmation: true,
    expectedResponse: "Show list of notes — is that okay?"
  },

  "tell me about my recent activity": {
    intent: "queryHistory",
    multiTurn: false,
    confirmation: true,
    expectedResponse: "Show your recent activity history — is that okay?"
  }
};

/**
 * Run all tests for "tell me about" commands
 */
export function runAllTellMeAboutTests() {
  console.log("🚀 Running 'Tell Me About' Voice Command Tests\n");
  console.log("=" .repeat(70));
  
  testTellMeAboutParsing();
  console.log("\n");
  
  simulateTellMeAboutConversation();
  console.log("\n");
  
  testEdgeCases();
  
  console.log("=" .repeat(70));
  console.log("✅ All 'Tell Me About' tests completed!");
}

// Export for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testTellMeAbout = {
    runAllTellMeAboutTests,
    testTellMeAboutParsing,
    simulateTellMeAboutConversation,
    testEdgeCases,
    tellMeAboutScenarios,
    expectedFlows,
    edgeCaseCommands
  };
} 