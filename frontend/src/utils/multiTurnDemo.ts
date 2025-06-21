/**
 * Demo scenarios for the Multi-Turn Voice Command System
 * 
 * This demonstrates how users can interact with the voice system
 * through natural multi-turn conversations for command execution.
 */

export const multiTurnDemoScenarios = {
  createProject: {
    title: "Create Project Command",
    description: "User wants to create a new project but doesn't provide all details upfront",
    conversation: [
      {
        user: "Create a new project",
        system: "What should the project name be?",
        type: "field_collection"
      },
      {
        user: "E-commerce Website", 
        system: "What's the project description?",
        type: "field_collection"
      },
      {
        user: "Online store for selling handmade crafts",
        system: 'Create project "E-commerce Website" with description "Online store for selling handmade crafts" — is that okay?',
        type: "confirmation"
      },
      {
        user: "Yes",
        system: "✅ Project 'E-commerce Website' created successfully!",
        type: "execution"
      }
    ]
  },

  createTask: {
    title: "Create Task Command",
    description: "User creates a task with partial information, system collects missing fields",
    conversation: [
      {
        user: "Add a task to fix the login bug",
        system: "Which project is this task for?",
        type: "field_collection"
      },
      {
        user: "E-commerce Website",
        system: "Who should this task be assigned to?",
        type: "field_collection"
      },
      {
        user: "John Doe",
        system: "When is this task due?",
        type: "field_collection"
      },
      {
        user: "Next Friday",
        system: "What's the priority level?",
        type: "field_collection"
      },
      {
        user: "High priority",
        system: 'Create task "fix the login bug" for project "E-commerce Website" assigned to John Doe due Next Friday with high priority — is that okay?',
        type: "confirmation"
      },
      {
        user: "Yes",
        system: "✅ Task created successfully!",
        type: "execution"
      }
    ]
  },

  createTestCase: {
    title: "Create Test Case Command",
    description: "User creates a test case with interactive field collection",
    conversation: [
      {
        user: "Create a test case",
        system: "What should the test case description be?",
        type: "field_collection"
      },
      {
        user: "Test user registration flow with valid email",
        system: "Which project is this test case for?",
        type: "field_collection"
      },
      {
        user: "E-commerce Website",
        system: "What's the priority level?",
        type: "field_collection"
      },
      {
        user: "Medium",
        system: 'Create test case "Test user registration flow with valid email" for project "E-commerce Website" with medium priority — is that okay?',
        type: "confirmation"
      },
      {
        user: "Yes",
        system: "✅ Test case created successfully!",
        type: "execution"
      }
    ]
  },

  createNote: {
    title: "Create Note Command",
    description: "User creates a note with minimal input, system prompts for details",
    conversation: [
      {
        user: "Add a note",
        system: "What should the note content be?",
        type: "field_collection"
      },
      {
        user: "Remember to update the API documentation before the next release",
        system: "Which project is this note for?",
        type: "field_collection"
      },
      {
        user: "E-commerce Website",
        system: 'Create note "Remember to update the API documentation before the next release" for project "E-commerce Website" — is that okay?',
        type: "confirmation"
      },
      {
        user: "Yes",
        system: "✅ Note created successfully!",
        type: "execution"
      }
    ]
  },

  cancellation: {
    title: "Command Cancellation",
    description: "User starts a command but decides to cancel during confirmation",
    conversation: [
      {
        user: "Create a project called Test Project",
        system: "What's the project description?",
        type: "field_collection"
      },
      {
        user: "Just a test project for demo purposes",
        system: 'Create project "Test Project" with description "Just a test project for demo purposes" — is that okay?',
        type: "confirmation"
      },
      {
        user: "No, cancel that",
        system: "Okay, I've canceled that operation.",
        type: "cancellation"
      }
    ]
  },

  navigation: {
    title: "Navigation Command",
    description: "User wants to navigate but system needs clarification",
    conversation: [
      {
        user: "Go to projects",
        system: 'Navigate to projects — is that okay?',
        type: "confirmation"
      },
      {
        user: "Yes",
        system: "✅ Navigating to projects page...",
        type: "execution"
      }
    ]
  }
};

/**
 * Test the multi-turn system with sample commands
 */
export const testCommands = [
  // Complete commands (no multi-turn needed)
  "Create project MyApp with description A mobile application",
  "Navigate to dashboard",
  
  // Incomplete commands (will trigger multi-turn)
  "Create a new project",
  "Add a task",
  "Create test case",
  "Add a note",
  "Show my tasks",
  
  // Natural variations
  "I want to create a project",
  "Can you help me add a task?",
  "Make a new test case for me",
  "Remember this note",
];

/**
 * Expected multi-turn flows for different command patterns
 */
export const multiTurnFlows = {
  "create project": ["name", "description?", "projectCode?"],
  "create task": ["title", "projectId?", "assignee?", "dueDate?", "priority?"],
  "create test case": ["description", "projectId?", "priority?"], 
  "create note": ["content", "projectId?"],
  "navigate": ["destination"],
  "show list": ["type", "projectId?"]
};

/**
 * Example integration with voice system
 */
export const voiceIntegrationExample = `
// Example usage in AIVoiceMode.tsx:

const processor = createMultiTurnVoiceProcessor({
  navigate: navigate,
  currentProjectId: currentProjectId,
  speakFunction: speak
});

// On voice input:
const result = await processor.processVoiceTranscript("Create a project");

if (result.needsInput) {
  // System needs more information
  await speak(result.response); // "What should the project name be?"
  setIsMultiTurnMode(true);
  setCurrentPrompt(result.response);
} else if (result.isComplete) {
  // Command completed or failed
  await speak(result.response);
  setIsMultiTurnMode(false);
}
`;

/**
 * Voice command pattern examples
 */
export const voicePatterns = {
  projects: [
    "create project MyApp",
    "new project called WebStore", 
    "make a project",
    "start new project"
  ],
  tasks: [
    "add task fix bug",
    "create task for user authentication",
    "new task",
    "make a todo"
  ],
  testCases: [
    "create test case for login",
    "add test for payment flow",
    "new test case",
    "test the registration"
  ],
  notes: [
    "add note remember to update docs",
    "create note about meeting",
    "save this note",
    "remember this"
  ],
  navigation: [
    "go to dashboard",
    "navigate to projects",
    "open settings",
    "show me tasks"
  ]
};

export default multiTurnDemoScenarios; 