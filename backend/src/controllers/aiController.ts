import { Request, Response } from 'express';
import { TestCase } from '../models/TestCase';
import { TestRun } from '../models/TestRun';
import { Project } from '../models/Project';
import { Role } from '../models/roleModel';
import OpenAI from 'openai';

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

// Initialize OpenAI (assuming you have this setup already)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateTestCase = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?._id) {
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
    if (!currentUser?._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const projectId = req.params.projectId;
    const { codeChanges } = req.body;

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, currentUser._id);
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
    if (!currentUser?._id) {
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
    const hasAccess = await checkProjectAccess(testRun.project._id, currentUser._id);
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

export const interpretTestStep = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  if (!currentUser?._id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { step } = req.body;
  if (!step) {
    return res.status(400).json({ success: false, error: 'Step is required' });
  }

  try {
    console.log(`[AIController] interpretTestStep called with: "${step}"`);

    const prompt = `You are an expert test automation assistant. Your task is to refine a given natural language test step into a more precise and machine-executable format.
If the step is already precise, return it as is.
If it involves an action and a target (e.g., a UI element selector), try to identify them clearly.
Focus on making selectors as robust as possible (e.g., preferring IDs, then specific attributes, then robust XPaths or CSS selectors). Avoid overly brittle selectors.
The goal is to make the step easier for an automation tool to understand and execute.

Original step: "${step}"

Respond with ONLY the refined step string. Do not include any explanations, greetings, or markdown formatting. Just the step string.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a test automation assistant. Respond with only the refined test step string."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
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
  if (!currentUser?._id) {
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
    if (!currentUser?._id) {
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

Please respond with a JSON object containing:
- suggestedSelector: The new selector string (e.g., "xpath://button[@id='submit']" or "css:.my-class > a"). It MUST start with "xpath://" or "css:".
- suggestedStrategy: Explicitly "xpath" or "css". This should match the prefix of suggestedSelector.
- confidence: A numerical score between 0.0 (low) and 1.0 (high) indicating your confidence in this suggestion.
- reasoning: A brief explanation of why this selector was chosen.

Focus on creating a reliable, specific, and non-brittle selector.
If the DOM snippet is insufficient or the information is ambiguous, state that in the reasoning and provide the best guess with lower confidence.
Ensure the suggestedSelector is valid for the chosen strategy.
Provide ONLY the JSON object in your response.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo for cost efficiency
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that suggests robust web element selectors. Respond ONLY with a valid JSON object containing 'suggestedSelector', 'suggestedStrategy', 'confidence', and 'reasoning'."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more deterministic and focused output
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error('[AIController] getDynamicSelectorSuggestion: No content from AI');
      return res.status(500).json({ success: false, error: 'AI suggestion failed: No content received' });
    }

    let suggestion;
    try {
      suggestion = JSON.parse(content);
      // Basic validation of the AI's response structure
      if (!suggestion.suggestedSelector || !suggestion.suggestedStrategy || typeof suggestion.confidence !== 'number') {
        throw new Error('Invalid JSON structure from AI. Missing required fields.');
      }
      // Fix the selector format if necessary
      if (!suggestion.suggestedSelector.startsWith('xpath://') && !suggestion.suggestedSelector.startsWith('css:')) {
        if (suggestion.suggestedStrategy === 'xpath') {
          suggestion.suggestedSelector = 'xpath://' + suggestion.suggestedSelector;
        } else if (suggestion.suggestedStrategy === 'css') {
          suggestion.suggestedSelector = 'css:' + suggestion.suggestedSelector;
        } else {
          throw new Error("Invalid suggestedSelector format. Must start with 'xpath://' or 'css:' after considering strategy.");
        }
      }
      if (suggestion.suggestedSelector.startsWith('xpath://') && suggestion.suggestedStrategy !== 'xpath') {
        throw new Error("Strategy mismatch: selector starts with 'xpath://' but strategy is not 'xpath'.");
      }
      if (suggestion.suggestedSelector.startsWith('css:') && suggestion.suggestedStrategy !== 'css') {
        throw new Error("Strategy mismatch: selector starts with 'css:' but strategy is not 'css'.");
      }
    } catch (parseError: any) {
      console.error('[AIController] getDynamicSelectorSuggestion: Failed to parse AI response or invalid structure:', parseError.message);
      console.error('[AIController] Raw AI Response:', content); // Log raw response for debugging
      // Fallback or error response
      return res.status(500).json({ 
        success: false, 
        error: `AI suggestion parsing failed: ${parseError.message}. Raw response: ${content.substring(0, 200)}...`
      });
    }
    
    console.log('[AIController] Successfully received and parsed AI suggestion:', suggestion);

    res.json({
      success: true,
      data: suggestion,
      message: 'Dynamic selector suggestion retrieved successfully.'
    });

  } catch (error: any) {
    console.error('[AIController] Error in getDynamicSelectorSuggestion:', error.stack || error.message);
    // Check for OpenAI specific errors if possible, e.g., error.response.data
    if (error.response && error.response.data) {
        console.error('[AIController] OpenAI API Error:', error.response.data);
        return res.status(500).json({ success: false, error: `OpenAI API error: ${error.response.data.error?.message || error.message}` });
    }
    return res.status(500).json({ success: false, error: `Internal server error in AI suggestion: ${error.message}` });
  }
};

// Helper function to check project access
async function checkProjectAccess(projectId: any, userId: string): Promise<boolean> {
  const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: userId });
  if (projectForOwnerCheck) return true;

  const userRoleInProject = await Role.findOne({ projectId, userId });
  return !!userRoleInProject;
}
