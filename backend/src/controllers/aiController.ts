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

// Helper function to check project access
async function checkProjectAccess(projectId: any, userId: string): Promise<boolean> {
  const projectForOwnerCheck = await Project.findOne({ _id: projectId, owner: userId });
  if (projectForOwnerCheck) return true;

  const userRoleInProject = await Role.findOne({ projectId, userId });
  return !!userRoleInProject;
}
