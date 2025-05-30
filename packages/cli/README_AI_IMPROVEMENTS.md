# Labnex CLI AI Improvements

## Overview

This document outlines the comprehensive improvements made to the Labnex CLI test automation system with enhanced AI assistance capabilities.

## Key Improvements

### 1. Enhanced AI Backend (`backend/src/controllers/aiController.ts`)

- **Improved `interpretTestStep`**: Better prompt engineering for converting natural language steps into executable commands
- **Enhanced `getDynamicSelectorSuggestion`**: 
  - More robust selector generation with confidence scores
  - Alternative selector suggestions
  - Wait strategy recommendations
  - Better error handling and fallback mechanisms

### 2. New Element Finder V2 (`packages/cli/src/lib/elementFinderV2.ts`)

- **Smart Element Finding Strategies**:
  - Multiple fallback strategies (ID, class, name, data-testid, aria-label, text content)
  - Intelligent selector type detection
  - Enhanced visibility and clickability verification
  - Automatic scrolling into view
  - AI-powered selector suggestions when standard methods fail

- **Key Features**:
  - `ElementFinder` class with configurable options
  - Robust waiting mechanisms with customizable timeouts
  - DOM context capture for AI analysis
  - Element state verification (visible, clickable, connected)

### 3. Improved Drag and Drop Handler V2 (`packages/cli/src/lib/actionHandlers/handleDragAndDropV2.ts`)

- **Enhanced Mouse Event Simulation**:
  - Smooth curved path generation for natural drag movements
  - Configurable drag/drop delays
  - Native and manual fallback modes
  - Site-specific heuristics (e.g., GlobalsQA workaround)
  - Drop success verification

### 4. API Client Improvements (`packages/cli/src/api/client.ts`)

- **Better Response Handling**:
  - Corrected parsing of nested API responses
  - Enhanced logging for debugging
  - Proper error message extraction
  - Verbose mode support

### 5. Local Browser Executor Updates (`packages/cli/src/localBrowserExecutor.ts`)

- **AI Integration**:
  - Uses V2 handlers when AI optimization is enabled
  - Smart fallback to AI suggestions on step failures
  - Improved step interpretation and reconstruction

## Usage

### Running Tests with AI Optimization

```bash
labnex run -p <project-id> --detailed --ai-optimize --local
```

### Key Flags:
- `--ai-optimize`: Enables AI assistance for element finding and step interpretation
- `--detailed`: Provides verbose logging for debugging
- `--local`: Runs tests on local browser instance

## Configuration

The AI features require:
1. Backend server running with OpenAI API key configured
2. Proper authentication token
3. Project ID with test cases

## Architecture

```
┌─────────────────────┐
│  Test Execution     │
│  (LocalBrowserExecutor)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Element Finding    │
│  (ElementFinderV2)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Action Handlers    │
│  (handleClickV2, etc)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI API Client      │
│  (LabnexApiClient)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI Backend         │
│  (aiController)     │
└─────────────────────┘
```

## Benefits

1. **Improved Reliability**: Multiple fallback strategies reduce test flakiness
2. **Natural Language Support**: Write tests in plain English
3. **Smart Element Finding**: AI helps locate elements even with DOM changes
4. **Better Error Recovery**: Intelligent retry mechanisms
5. **Enhanced Debugging**: Comprehensive logging and DOM capture

## Known Issues & Workarounds

1. **TypeScript Compilation**: Some type issues exist due to Puppeteer's complex types
2. **Iframe Handling**: XPath selection in frames uses workarounds
3. **Drag & Drop**: Some sites require manual mouse event simulation

## Future Enhancements

1. Visual element recognition using screenshots
2. Self-healing tests that adapt to UI changes
3. Performance optimization for AI calls
4. Enhanced natural language understanding
5. Test generation from user stories

## Testing

To test the improvements:

1. Create test cases with natural language steps
2. Run with `--ai-optimize` flag
3. Monitor logs for AI suggestions and fallback strategies
4. Verify element finding success rates

## Troubleshooting

If tests fail with AI enabled:
1. Check backend AI service is running
2. Verify OpenAI API key is configured
3. Review detailed logs for specific errors
4. Ensure proper network connectivity
5. Check element selectors in DOM

## Contributing

When adding new features:
1. Follow the established pattern in ElementFinderV2
2. Add AI fallback capabilities where appropriate
3. Include comprehensive logging
4. Handle null/undefined cases
5. Add TypeScript types 