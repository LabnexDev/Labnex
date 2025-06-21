# Multi-Turn Voice Command System for Labnex

This implementation provides a modular, reusable multi-turn voice command system that gathers required fields progressively and confirms actions before execution.

## 🎯 System Overview

The multi-turn voice command system consists of several modular components that work together to provide intelligent voice interactions:

### Core Components

1. **`handleVoiceTranscript.ts`** - Main entry point for processing voice transcripts
2. **`handleIntentProgressively.ts`** - Handles multi-turn conversations for missing fields  
3. **`multiTurnVoiceHandler.ts`** - Enhanced processor class with full conversation management
4. **`voiceListenOnce.ts`** - Utility functions for STT and TTS operations

### Integration

The system is fully integrated into **`AIVoiceMode.tsx`** with:
- Visual indicators for multi-turn mode
- Current prompt display
- Seamless fallback to AI chat for unknown commands

## 🔄 How It Works

### 1. Voice Input Processing Flow

```
User speaks → Parse Intent → Check Required Fields → Execute or Collect Fields
```

### 2. Multi-Turn Conversation Example

**User:** "Create a new project"
**System:** "What should the project name be?"
**User:** "E-commerce Website"  
**System:** "What's the project description?"
**User:** "Online store for handmade crafts"
**System:** "Create project 'E-commerce Website' with description 'Online store for handmade crafts' — is that okay?"
**User:** "Yes"
**System:** "✅ Project created successfully!"

## 🎛️ Supported Commands

### Project Management
- `create project [name]` → Collects: name, description, projectCode
- `new project called [name]` → Progressive field collection

### Task Management  
- `add task [title]` → Collects: title, projectId, assignee, dueDate, priority
- `create task for [description]` → Multi-turn field gathering

### Test Case Management
- `create test case [description]` → Collects: description, projectId, priority
- `add test for [feature]` → Progressive prompting

### Notes
- `add note [content]` → Collects: content, projectId
- `remember this [content]` → Field completion

### Navigation
- `go to [destination]` → Confirms navigation target
- `navigate to [page]` → Route confirmation

## 🧩 Key Features

### ✅ Dynamic Field Collection
- Automatically detects missing required fields
- Prompts user for missing information in logical order
- Supports optional fields with smart defaults

### ✅ Confirmation Before Execution
- Always confirms complete command before execution
- Natural language confirmation messages
- Cancellation support ("no", "cancel", "stop")

### ✅ Reusable Architecture
- Modular design supports any command type
- Easy to add new intents and field mappings
- Configurable field prompts and confirmations

### ✅ Echo Prevention & State Management
- Prevents AI from responding to its own speech
- Proper microphone pause/resume during TTS
- Request locking to prevent concurrent processing

### ✅ Visual Feedback
- Multi-turn mode indicators in UI
- Current prompt display card
- Status updates for different conversation states

## 🔧 Configuration

### Adding New Command Types

1. **Add Intent Pattern** in `parseNLUCommand.ts`:
```typescript
{
  intent: 'createSnippet',
  patterns: [/create snippet (.+)/i],
  extractData: (match) => ({ title: match[1] })
}
```

2. **Define Required Fields** in `parseNLUCommand.ts`:
```typescript
const requiredFields: Record<Intent, string[]> = {
  createSnippet: ['title', 'language', 'code']
}
```

3. **Add Field Prompts** in `multiTurnVoiceHandler.ts`:
```typescript
const FIELD_PROMPTS = {
  createSnippet: {
    title: "What should the snippet title be?",
    language: "What programming language?",
    code: "What's the code content?"
  }
}
```

4. **Add Confirmation Message**:
```typescript
const CONFIRMATION_GENERATORS = {
  createSnippet: (data) => `Create snippet "${data.title}" in ${data.language} — is that okay?`
}
```

## 🎤 Voice Integration

The system integrates seamlessly with existing voice infrastructure:

```typescript
// Initialize processor
const processor = createMultiTurnVoiceProcessor({
  navigate: navigate,
  currentProjectId: currentProjectId,
  speakFunction: speak
});

// Process voice input
const result = await processor.processVoiceTranscript(transcript);

if (result.needsInput) {
  // Multi-turn conversation active
  setIsMultiTurnMode(true);
  setCurrentPrompt(result.response);
  await speak(result.response);
} else if (result.isComplete) {
  // Command completed
  setIsMultiTurnMode(false);
  await speak(result.response);
}
```

## 🧪 Testing

Use the demo scenarios in `multiTurnDemo.ts` to test various conversation flows:

- Complete commands (immediate execution)
- Incomplete commands (progressive field collection)  
- Command cancellation
- Navigation with confirmation
- Error handling and fallbacks

## 🎯 Benefits

1. **Natural Interaction** - Users can speak naturally without memorizing exact syntax
2. **Progressive Disclosure** - System only asks for information it needs
3. **Error Prevention** - Confirmation step prevents accidental command execution
4. **Extensible Design** - Easy to add new command types and workflows
5. **Robust State Management** - Handles interruptions, cancellations, and edge cases

## 🔄 Future Enhancements

- **Context Awareness** - Remember previous conversation context
- **Batch Operations** - Support for multiple commands in sequence
- **Voice Shortcuts** - Learn user preferences for faster input
- **Command History** - Repeat previous commands with variations
- **Smart Defaults** - Pre-fill fields based on current context

---

This multi-turn voice command system transforms Labnex Voice Mode into an intelligent assistant that can handle complex command workflows through natural conversation! 