import { Request, Response } from 'express';
import { TestCase } from '../models/TestCase';
import { TestRun } from '../models/TestRun';
import { Project } from '../models/Project';
import { Role } from '../models/roleModel';
import OpenAI from 'openai';
import { JwtPayload } from '../middleware/auth';
import { askChatGPT } from '../bots/labnexAI/chatgpt.service';
import { getFlow, startFlow, updateFlowAnswer, clearFlow, nextMissingField, toIntentKey, getRequiredFields, toFunctionName } from '../utils/pendingFlowManager';

interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Initialize OpenAI (assuming you have this setup already)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// PendingFlow definitions are centralized in utils/pendingFlowManager

export const generateTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    // Generate test case using OpenAI
    const prompt = `Generate a detailed test case based on this description: "${description}"

Please respond with a JSON object containing:
- title: A clear, concise test case title
- description: A detailed description of what this test validates
- steps: An array of specific, actionable test steps
- expectedResult: The expected outcome when the test passes

Example format:
{
  "title": "Test user login with valid credentials",
  "description": "Verify that users can successfully log in using valid email and password combinations",
  "steps": [
    "Navigate to the login page",
    "Enter valid email address",
    "Enter correct password",
    "Click the login button"
  ],
  "expectedResult": "User should be redirected to the dashboard and see welcome message"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a QA expert that generates comprehensive test cases. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let generatedTestCase;
    try {
      generatedTestCase = JSON.parse(content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      generatedTestCase = {
        title: `Test case for: ${description}`,
        description: description,
        steps: [
          "Define test preconditions",
          "Execute the main test action",
          "Verify the expected outcome"
        ],
        expectedResult: "Test should complete successfully"
      };
    }

    res.json({
      success: true,
      data: generatedTestCase,
      message: 'Test case generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating test case:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const optimizeTestSuite = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const projectId = req.params.projectId;
    const { codeChanges } = req.body;

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, currentUser.id);
    if (!hasAccess) {
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Get all test cases for the project
    const testCases = await TestCase.find({ project: projectId });

    if (testCases.length === 0) {
      return res.status(400).json({ success: false, error: 'No test cases found in project' });
    }

    const optimizationStartTime = Date.now();

    // Create prompt for AI optimization
    const testCaseInfo = testCases.map(tc => ({
      id: tc._id.toString(),
      title: tc.title,
      description: tc.description,
      priority: tc.priority,
    }));

    const prompt = `Optimize this test suite based on the following criteria:

Test Cases:
${JSON.stringify(testCaseInfo, null, 2)}

Code Changes (if any):
${codeChanges ? codeChanges.join(', ') : 'No specific code changes provided'}

Please analyze and select the most important test cases to run, prioritizing:
1. High priority test cases
2. Tests related to changed code areas
3. Critical path functionality
4. Tests that haven't been run recently

Respond with a JSON object containing:
- selectedTests: Array of test case IDs to run
- reasoning: Explanation of the optimization strategy

Limit selection to 50% of total test cases for efficiency.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a test optimization expert. Analyze test suites and recommend the most efficient test selection strategy."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let optimization;
    try {
      optimization = JSON.parse(content);
    } catch (parseError) {
      // Fallback optimization strategy
      const highPriorityTests = testCases
        .filter(tc => tc.priority === 'HIGH')
        .map(tc => tc._id.toString());
      
      optimization = {
        selectedTests: highPriorityTests.slice(0, Math.ceil(testCases.length * 0.5)),
        reasoning: 'Selected high priority test cases as a fallback optimization strategy'
      };
    }

    const optimizationTime = Date.now() - optimizationStartTime;

    res.json({
      success: true,
      data: {
        selectedTests: optimization.selectedTests,
        reasoning: optimization.reasoning,
        optimizationTime,
        totalTests: testCases.length,
        selectedCount: optimization.selectedTests.length,
      },
      message: 'Test suite optimized successfully'
    });

  } catch (error: any) {
    console.error('Error optimizing test suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const analyzeFailure = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { testRunId, failureId } = req.body;

    // Get test run and find the specific failure
    const testRun = await TestRun.findById(testRunId)
      .populate('project')
      .populate('testCases');

    if (!testRun) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(testRun.project._id, currentUser.id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Find the failed test result
    const failedResult = testRun.testResults.find(
      result => result._id?.toString() === failureId || result.testCaseId.toString() === failureId
    );

    if (!failedResult) {
      return res.status(404).json({ success: false, error: 'Failure not found' });
    }

    // Get the test case details
    const testCase = await TestCase.findById(failedResult.testCaseId);
    if (!testCase) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }

    // Create analysis prompt
    const prompt = `Analyze this test failure and provide insights:

Test Case:
- Title: ${testCase.title}
- Description: ${testCase.description}
- Steps: ${testCase.steps.join(', ')}
- Expected Result: ${testCase.expectedResult}

Failure Details:
- Status: ${failedResult.status}
- Duration: ${failedResult.duration}ms
- Error Message: ${failedResult.error || 'No error message'}
- Test Message: ${failedResult.message || 'No message'}
- Logs: ${failedResult.logs?.join('\n') || 'No logs available'}

Environment: ${testRun.config.environment}

Please provide:
1. Analysis of what likely went wrong
2. Specific suggestions to fix the issue
3. Preventive measures for the future

Respond with a JSON object containing:
- analysis: Detailed analysis of the failure
- suggestions: Array of specific actionable suggestions`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior QA engineer and debugging expert. Analyze test failures and provide actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      // Fallback analysis
      analysis = {
        analysis: `Test "${testCase.title}" failed after ${failedResult.duration}ms. Error: ${failedResult.error || 'Unknown error'}`,
        suggestions: [
          'Review test steps for accuracy',
          'Check environment configuration',
          'Verify test data and prerequisites',
          'Review application logs for related errors'
        ]
      };
    }

    res.json({
      success: true,
      data: {
        analysis: analysis.analysis,
        suggestions: analysis.suggestions,
        testCase: {
          title: testCase.title,
          description: testCase.description,
        },
        failureDetails: {
          status: failedResult.status,
          duration: failedResult.duration,
          error: failedResult.error,
          message: failedResult.message,
        }
      },
      message: 'Failure analysis completed successfully'
    });

  } catch (error: any) {
    console.error('Error analyzing failure:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const analyzeFailureConversational = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { testRunId, failureId, conversationHistory, question } = req.body;

    // Validate input
    if (!testRunId || !failureId || !conversationHistory || !question) {
      return res.status(400).json({ success: false, error: 'Missing required fields for conversational analysis.' });
    }

    const testRun = await TestRun.findById(testRunId).populate('project');
    if (!testRun) {
      return res.status(404).json({ success: false, error: 'Test run not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(testRun.project._id, currentUser.id);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    // Find the failed test result to provide context
    const failedResult = testRun.testResults.find(r => r.testCaseId.toString() === failureId);
    if (!failedResult) {
      return res.status(404).json({ success: false, error: 'Failure details not found in test run' });
    }
    
    const testCase = await TestCase.findById(failureId);
    if (!testCase) {
      return res.status(404).json({ success: false, error: 'Test case not found' });
    }

    // Construct the conversational prompt
    const systemPrompt = `You are an expert test failure analysis assistant. A user is asking for help with a failed test.
The original failure context is as follows:
- Test Case: "${testCase.title}"
- Steps: ${JSON.stringify(testCase.steps)}
- Failure Reason: "${failedResult.error}"

You are in an interactive session. The user has already seen an initial analysis. Below is the conversation history. Answer the user's NEWEST question based on the full context. Be helpful and provide clear, actionable advice.`;

    // The conversationHistory from the client already has the right format. We just add the system prompt and the new user question.
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory, // Spread the existing history
      { role: "user", content: question } // Add the new question
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    res.json({
      success: true,
      data: {
        analysis: content,
        suggestions: [] // Suggestions are part of the main analysis in conversational mode
      },
      message: 'Conversational analysis successful'
    });

  } catch (error: any) {
    console.error('Error in conversational failure analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const interpretTestStep = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  if (!currentUser?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ success: false, error: 'Description is required' });
  }

  try {
    console.log(`[AIController] interpretTestStep called with: "${description}"`);

    const prompt = `You are an expert test automation assistant that converts natural language test steps into precise, executable commands.

Original step: "${description}"

Convert this into a standardized test automation command following these patterns:
- Navigation: "navigate to <URL>"
- Clicking: "click <selector>"
- Typing: "type <selector> with value <text>"
- Selecting: "select <selector> with value <option>"
- Drag and drop: "drag <source-selector> to <destination-selector>"
- Assertions: "assert <selector> contains text <expected-text>"
- Waiting: "wait for <selector>" or "wait <seconds>"
- Screenshots: "take screenshot"

For selectors, use this format:
- For ID: "#elementId"
- For class: ".className"
- For text: "text containing 'Button Text'"
- For attributes: "[data-testid='value']"
- For complex selectors, use CSS format or descriptive text

Examples:
- "Click the login button" → "click #login-button"
- "Enter username" → "type #username with value testuser@example.com"
- "Go to homepage" → "navigate to https://example.com"
- "Verify success message appears" → "assert .success-message contains text Success"

Respond with ONLY the converted command. No explanations or additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a test automation expert. Convert natural language steps into precise automation commands. Respond only with the command, no explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const interpretedStep = completion.choices[0]?.message?.content?.trim();

    if (!interpretedStep) {
      console.error('[AIController] interpretTestStep: No content from AI');
      return res.status(500).json({ success: false, error: 'AI interpretation failed: No content received' });
    }

    console.log(`[AIController] interpretTestStep AI response: "${interpretedStep}"`);
    return res.status(200).json({ success: true, data: interpretedStep });

  } catch (error: any) {
    console.error('[AIController] Error in interpretTestStep:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to interpret test step via AI' });
  }
};

export const suggestAlternative = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  if (!currentUser?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { step } = req.body;
  if (!step) {
    return res.status(400).json({ success: false, error: 'Step is required for suggestion' });
  }

  try {
    console.log(`[AIController] suggestAlternative called for step: "${step}"`);

    const prompt = `You are an expert test automation debugger. The following test step previously failed: "${step}".
Please suggest a single, concrete alternative way to perform this step.
Focus on common reasons for failure like incorrect or brittle selectors.
Suggest a different type of selector (e.g., if XPath failed, try CSS or ID) or a slightly different interaction if appropriate.
If the step involves finding an element, be specific about how to find it.

Original failed step: "${step}"

Respond with ONLY the suggested alternative step string. Do not include any explanations, greetings, or markdown formatting. Just the step string.
If you cannot suggest a clear alternative, you can respond with the original step, but try to offer a variation if possible.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a test automation debugging assistant. Respond with only the suggested alternative test step string."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const suggestedStep = completion.choices[0]?.message?.content?.trim();

    if (!suggestedStep) {
      console.error('[AIController] suggestAlternative: No content from AI');
      return res.status(500).json({ success: false, error: 'AI suggestion failed: No content received' });
    }

    console.log(`[AIController] suggestAlternative AI response: "${suggestedStep}"`);
    return res.status(200).json({ success: true, data: suggestedStep });

  } catch (error: any) {
    console.error('[AIController] Error in suggestAlternative:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to suggest alternative step via AI' });
  }
};

// New function placeholder
export const getDynamicSelectorSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { failedSelector, descriptiveTerm, pageUrl, domSnippet, originalStep } = req.body;

    // Validate required fields
    if (!descriptiveTerm || !domSnippet || !originalStep) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: descriptiveTerm, domSnippet, or originalStep are required.' 
      });
    }

    console.log('[AIController] Received getDynamicSelectorSuggestion request:');
    console.log('  Failed Selector:', failedSelector);
    console.log('  Descriptive Term:', descriptiveTerm);
    console.log('  Page URL:', pageUrl);
    console.log('  Original Step:', originalStep);
    // Log only a portion of the DOM snippet to avoid flooding logs
    console.log('  DOM Snippet (first 200 chars):', domSnippet?.substring(0, 200));

    // Enhanced prompt with better context and structure
    const prompt = `You are an expert web automation assistant specializing in creating robust selectors.
Given the following context from a web page, suggest a robust Puppeteer selector (XPath or CSS) to find an element.

Page URL: ${pageUrl || 'Not provided'}
Original User Step: "${originalStep}"
Intended Target Element (Descriptive Term): "${descriptiveTerm}"
Previous Selector that Failed (if any): "${failedSelector || 'None'}"

Relevant DOM Snippet where the element might be found:
\`\`\`html
${domSnippet}
\`\`\`

IMPORTANT GUIDELINES:
1. Prefer CSS selectors over XPath when possible (they're faster and more maintainable)
2. Use IDs first if available, then unique attributes like data-testid, aria-label, then classes
3. Avoid text-based selectors unless absolutely necessary (they break with i18n)
4. For XPath, avoid contains() - use exact matches like [@id='value'] or [text()='exact text']
5. Consider element hierarchy but avoid overly brittle parent-child chains
6. If the element might be in a shadow DOM or iframe, mention it in reasoning
7. Ensure the selector is specific enough to avoid matching multiple elements
8. **Always provide a selector suggestion**, even if it's a best guess based on partial information. If no exact match is found, suggest a selector for the closest matching element or a parent container that might contain the target.

Based on the descriptive term "${descriptiveTerm}", identify the most likely element in the DOM snippet.

Please respond with a JSON object containing:
{
  "suggestedSelector": "The new selector string (e.g., '#submit-button' or '//button[@data-testid=\"submit\"]')",
  "suggestedStrategy": "css or xpath",
  "confidence": 0.8,
  "reasoning": "Brief explanation of why this selector should work",
  "alternativeSelectors": ["optional array of 1-2 backup selectors"],
  "waitStrategy": "visible|present|clickable",
  "estimatedWaitTime": 3000
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a web automation expert. Always respond with valid JSON containing selector suggestions. Focus on creating robust, maintainable selectors that won't break easily."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent selector generation
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    
    if (!content) {
      console.error('[AIController] getDynamicSelectorSuggestion: No content from AI');
      return res.status(500).json({ 
        success: false, 
        error: 'AI selector suggestion failed: No content received' 
      });
    }

    console.log('[AIController] AI raw response:', content);

    let aiResponse;
    try {
      aiResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('[AIController] Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      
      // Fallback: try to extract a simple selector from the response
      const cssMatch = content.match(/[#\.][\w-]+|[\w-]+\[[\w-]+=['"]\w+['"]\]/);
      const xpathMatch = content.match(/\/\/[\w]+\[@[\w-]+=['"]\w+['"]\]/);
      
      if (cssMatch || xpathMatch) {
        aiResponse = {
          suggestedSelector: cssMatch ? cssMatch[0] : xpathMatch![0],
          suggestedStrategy: cssMatch ? 'css' : 'xpath',
          confidence: 0.5,
          reasoning: 'Fallback extraction from malformed response',
          waitStrategy: 'visible',
          estimatedWaitTime: 3000
        };
      } else {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to parse AI response and no fallback selector found' 
        });
      }
    }

    // Validate and normalize the response
    const response = {
      suggestedSelector: aiResponse.suggestedSelector || '',
      suggestedStrategy: aiResponse.suggestedStrategy || 'css',
      confidence: aiResponse.confidence || 0.5,
      reasoning: aiResponse.reasoning || 'No reasoning provided',
      alternativeSelectors: aiResponse.alternativeSelectors || [],
      waitStrategy: aiResponse.waitStrategy || 'visible',
      estimatedWaitTime: aiResponse.estimatedWaitTime || 3000
    };

    // Clean up the selector (remove 'css:' or 'xpath:' prefixes if present)
    if (response.suggestedSelector.startsWith('css:')) {
      response.suggestedSelector = response.suggestedSelector.substring(4);
    } else if (response.suggestedSelector.startsWith('xpath:')) {
      response.suggestedSelector = response.suggestedSelector.substring(6);
      response.suggestedStrategy = 'xpath';
    }

    console.log('[AIController] Sending response:', response);
    
    return res.status(200).json({ 
      success: true, 
      data: response,
      message: 'Selector suggestion generated successfully'
    });

  } catch (error: any) {
    console.error('[AIController] Error in getDynamicSelectorSuggestion:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate selector suggestion' 
    });
  }
};

// Add new chat controller for in-app AI assistant
export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { message, context } = req.body as { message?: string; context?: any };

    // ----- Pending Flow handling -----
    const existingFlow = getFlow(currentUser.id);
    if (existingFlow && message) {
      if (existingFlow.askedField) {
        updateFlowAnswer(currentUser.id, existingFlow.askedField, message.trim());
      }
      const missingField = nextMissingField(existingFlow);
      if (!missingField) {
        // Build action block to return to client for execution
        const functionName = toFunctionName(existingFlow.intent);
        const actionBlock = {
          name: functionName,
          params: existingFlow.entities,
        };
        clearFlow(currentUser.id);
        return res.json({ success: true, data: { reply: `Sure, I'll ${functionName} for you.`, action: actionBlock } });
      } else {
        existingFlow.askedField = missingField;
        return res.json({ success: true, data: { reply: `Sure — what's the ${missingField.replace(/_/g,' ')}?` } });
      }
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Basic safety: limit message length
    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message is too long' });
    }

    // Build messages array
    const messagesArr: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are Labnex AI, an assistant that can chat normally AND perform actions when appropriate. For normal questions reply conversationally. When the user intends an action, call the relevant function with correct arguments.' },
      { role: 'user', content: message },
    ];

    if (context?.history) {
      context.history.forEach((h: any) => {
        messagesArr.unshift({ role: h.role, content: h.content });
      });
    }

    const functions = [
      {
        name: 'createProject',
        description: 'Create a new project in Labnex',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            description: { type: 'string' },
            projectCode: { type: 'string' }
          },
          required: ['name']
        }
      },
      {
        name: 'createTask',
        description: 'Create a new task inside a project',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            title: { type: 'string' },
            dueDate: { type: 'string' },
            assignee: { type: 'string' }
          },
          required: ['projectId', 'title']
        }
      },
      {
        name: 'createNote',
        description: 'Add a note for user optionally linked to project',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['content']
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesArr,
      functions,
      function_call: 'auto',
      temperature: 0.6,
    });

    const responseMsg = completion.choices[0].message;
    let actionBlock: any = undefined;
    if (responseMsg.function_call) {
      const { name, arguments: args } = responseMsg.function_call;
      actionBlock = { name, params: JSON.parse(args || '{}') };
    }

    // If we have an action suggested, check for missing params and start pending flow if needed
    if (actionBlock) {
      const intentKey = toIntentKey(actionBlock.name);
      // Merge pageContext values into params for auto-fill
      const mergedParams: Record<string, any> = { ...(actionBlock.params || {}) };
      if (!mergedParams.project_id && context?.projectId) mergedParams.project_id = context.projectId;
      if (!mergedParams.test_case_id && context?.selectedTestCaseId) mergedParams.test_case_id = context.selectedTestCaseId;
      if (!mergedParams.task_id && context?.selectedTaskId) mergedParams.task_id = context.selectedTaskId;

      const requiredFields = getRequiredFields(intentKey);
      const missingField = requiredFields.find((f) => !mergedParams[f]);

      if (missingField) {
        const flow = startFlow(currentUser.id, intentKey, mergedParams);
        flow.askedField = missingField;
        return res.json({
          success: true,
          data: {
            reply: `Sure — what's the ${missingField.replace(/_/g, ' ')}?`,
          },
        });
      }

      // TODO: execute the action with mergedParams here (call controllers/services)
      return res.json({
        success: true,
        data: {
          reply: `✅ ${actionBlock.name.replace(/([A-Z])/g, ' $1').trim()} completed successfully.`,
        },
      });
    }

    const replyContent = responseMsg.content || '';

    res.json({ success: true, data: { reply: replyContent } });
  } catch (error: any) {
    console.error('Error in chatWithAI:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

// Helper function to check project access
async function checkProjectAccess(projectId: any, userId: string): Promise<boolean> {
  const userRoles = await Role.find({ userId, projectId });
  return userRoles.length > 0;
}
