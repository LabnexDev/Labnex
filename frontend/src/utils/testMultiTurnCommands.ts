import { parseNLUCommand, validateIntent } from './parseNLUCommand';
import { createMultiTurnVoiceProcessor } from './multiTurnVoiceHandler';

/**
 * Test scenarios for Test Cases and Notes in the multi-turn voice system
 */

// Test createTestCase flows
export const testCaseScenarios = {
  minimalTestCase: {
    description: "User says just 'create test case' with no details",
    flow: [
      {
        input: "create test case",
        expectedResponse: "What should the test case description be?",
        expectedNeedsInput: true
      },
      {
        input: "Test user login with valid credentials",
        expectedResponse: "Create test case \"Test user login with valid credentials\" — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Test case created successfully!",
        expectedComplete: true
      }
    ]
  },

  partialTestCase: {
    description: "User provides description but no project",
    flow: [
      {
        input: "create test case for user registration flow",
        expectedResponse: "Create test case \"user registration flow\" — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Test case created successfully!",
        expectedComplete: true
      }
    ]
  },

  completeTestCase: {
    description: "User provides all details in one command",
    flow: [
      {
        input: "create test case Test password reset functionality in project WebApp with high priority",
        expectedResponse: "Create test case \"Test password reset functionality\" for project \"WebApp\" with high priority — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Test case created successfully!",
        expectedComplete: true
      }
    ]
  }
};

// Test createNote flows
export const noteScenarios = {
  minimalNote: {
    description: "User says just 'add note' with no content",
    flow: [
      {
        input: "add note",
        expectedResponse: "What should the note content be?",
        expectedNeedsInput: true
      },
      {
        input: "Remember to update the API documentation before next release",
        expectedResponse: "Create note \"Remember to update the API documentation before next release\" — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Note created successfully!",
        expectedComplete: true
      }
    ]
  },

  partialNote: {
    description: "User provides content but no project",
    flow: [
      {
        input: "remember this: Fix the CSS styling on mobile devices",
        expectedResponse: "Create note \"Fix the CSS styling on mobile devices\" — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Note created successfully!",
        expectedComplete: true
      }
    ]
  },

  completeNote: {
    description: "User provides content and project",
    flow: [
      {
        input: "create note Meeting notes from sprint planning in project WebApp",
        expectedResponse: "Create note \"Meeting notes from sprint planning\" for project \"WebApp\" — is that okay?",
        expectedNeedsInput: true
      },
      {
        input: "yes",
        expectedResponse: "✅ Note created successfully!",
        expectedComplete: true
      }
    ]
  }
};

/**
 * Test the parsing of test case commands
 */
export function testTestCaseParsing() {
  console.log("🧪 Testing Test Case Command Parsing\n");

  const testInputs = [
    "create test case",
    "add test for login functionality", 
    "create test case for payment flow",
    "new test case: User can reset password",
    "test the registration process",
    "create test case Verify admin dashboard in project WebApp with high priority"
  ];

  testInputs.forEach(input => {
    const parsed = parseNLUCommand(input);
    const validation = validateIntent(parsed);
    
    console.log(`Input: "${input}"`);
    console.log(`Intent: ${parsed.intent}`);
    console.log(`Confidence: ${parsed.confidence}`);
    console.log(`Data:`, parsed.data);
    console.log(`Missing fields:`, validation.missingFields);
    console.log(`Valid:`, validation.isValid);
    console.log("─".repeat(50));
  });
}

/**
 * Test the parsing of note commands
 */
export function testNoteParsing() {
  console.log("📝 Testing Note Command Parsing\n");

  const testInputs = [
    "add note",
    "create note about meeting",
    "remember this: Update documentation",
    "note: Fix the login bug",
    "save this note for later",
    "create note Meeting with client in project WebApp"
  ];

  testInputs.forEach(input => {
    const parsed = parseNLUCommand(input);
    const validation = validateIntent(parsed);
    
    console.log(`Input: "${input}"`);
    console.log(`Intent: ${parsed.intent}`);
    console.log(`Confidence: ${parsed.confidence}`);
    console.log(`Data:`, parsed.data);
    console.log(`Missing fields:`, validation.missingFields);
    console.log(`Valid:`, validation.isValid);
    console.log("─".repeat(50));
  });
}

/**
 * Simulate a complete multi-turn conversation for test case creation
 */
export async function simulateTestCaseConversation() {
  console.log("🎤 Simulating Test Case Multi-Turn Conversation\n");

  const processor = createMultiTurnVoiceProcessor({
    navigate: (path) => console.log(`Navigate to: ${path}`),
    currentProjectId: "project-123"
  });

  // Step 1: User says incomplete command
  console.log('👤 User: "create test case"');
  let result = await processor.processVoiceTranscript("create test case");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Needs input: ${result.needsInput}\n`);

  // Step 2: User provides description
  console.log('👤 User: "Test user login with invalid credentials"');
  result = await processor.processVoiceTranscript("Test user login with invalid credentials");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Needs input: ${result.needsInput}\n`);

  // Step 3: User confirms
  console.log('👤 User: "yes"');
  result = await processor.processVoiceTranscript("yes");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Complete: ${result.isComplete}\n`);
}

/**
 * Simulate a complete multi-turn conversation for note creation
 */
export async function simulateNoteConversation() {
  console.log("🎤 Simulating Note Multi-Turn Conversation\n");

  const processor = createMultiTurnVoiceProcessor({
    navigate: (path) => console.log(`Navigate to: ${path}`),
    currentProjectId: "project-123"
  });

  // Step 1: User says incomplete command
  console.log('👤 User: "add note"');
  let result = await processor.processVoiceTranscript("add note");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Needs input: ${result.needsInput}\n`);

  // Step 2: User provides content
  console.log('👤 User: "Remember to refactor the authentication module after the security audit"');
  result = await processor.processVoiceTranscript("Remember to refactor the authentication module after the security audit");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Needs input: ${result.needsInput}\n`);

  // Step 3: User confirms
  console.log('👤 User: "yes"');
  result = await processor.processVoiceTranscript("yes");
  console.log(`🤖 System: "${result.response}"`);
  console.log(`Complete: ${result.isComplete}\n`);
}

/**
 * Test different voice command variations
 */
export const voiceCommandVariations = {
  testCases: [
    // Minimal commands (will trigger multi-turn)
    "create test case",
    "add test",
    "new test case",
    "make a test",
    
    // Partial commands (may trigger multi-turn)
    "create test case for login",
    "add test about payment processing",
    "test the user registration",
    "create test case: Verify email validation",
    
    // Complete commands (minimal multi-turn)
    "create test case Test dashboard functionality in project WebApp",
    "add test case Verify payment flow with high priority",
  ],
  
  notes: [
    // Minimal commands (will trigger multi-turn)
    "add note",
    "create note", 
    "new note",
    "remember this",
    
    // Partial commands (may trigger multi-turn)
    "note about the meeting",
    "remember to update docs",
    "save this: Fix mobile layout",
    "create note for sprint review",
    
    // Complete commands (minimal multi-turn)
    "create note Sprint planning notes in project WebApp",
    "remember this: Update API docs for client in project API-Server",
  ]
};

/**
 * Run all tests
 */
export function runAllTests() {
  console.log("🚀 Running Multi-Turn Voice Command Tests for Test Cases and Notes\n");
  console.log("=" .repeat(70));
  
  testTestCaseParsing();
  console.log("\n");
  
  testNoteParsing();
  console.log("\n");
  
  simulateTestCaseConversation();
  console.log("\n");
  
  simulateNoteConversation();
  
  console.log("=" .repeat(70));
  console.log("✅ All tests completed!");
}

// Export for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testMultiTurn = {
    runAllTests,
    testTestCaseParsing,
    testNoteParsing,
    simulateTestCaseConversation,
    simulateNoteConversation,
    testCaseScenarios,
    noteScenarios,
    voiceCommandVariations
  };
} 