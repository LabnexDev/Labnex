import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
    console.warn('Warning: OPENAI_API_KEY is not set. ChatGPT functionality will be disabled.');
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Helper function to call OpenAI completion API
async function callOpenAICompletion(
    systemMessage: string,
    userPrompt: string,
    model: string = "gpt-3.5-turbo",
    temperature: number = 0.7,
    max_tokens: number = 250,
    response_format: { type: "json_object" } | undefined = undefined, // For JSON mode
    conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<string | null> {
    if (!openai) {
        console.error("[callOpenAICompletion] OpenAI service not configured.");
        // Return a specific error string or throw an error, consistent with existing functions
        return "Error: OpenAI service not configured."; 
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage }
    ];

    if (conversationHistory) {
        messages.push(...conversationHistory);
    }

    messages.push({ role: "user", content: userPrompt });

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            response_format: response_format,
        });

        const answer = completion.choices[0]?.message?.content;
        if (!answer) {
            console.warn("[callOpenAICompletion] OpenAI returned an empty message content.");
            return "Error: OpenAI returned no content.";
        }
        return answer;

    } catch (error: any) {
        console.error("[callOpenAICompletion] Error calling OpenAI API:", error.message);
        if (error.response) {
            console.error("[callOpenAICompletion] OpenAI API Response Error Data:", error.response.data);
        }
        let friendlyMessage = "Sorry, I encountered an issue while trying to reach the OpenAI service.";
        if (error.message && error.message.includes('insufficient_quota')) {
            friendlyMessage = "It seems I've run out of my current capacity. Please notify my administrator.";
        }
        return `Error: ${friendlyMessage}`;
    }
}

export async function generateProjectName(featureTopic: string): Promise<string> {
    const systemMessage = `You are an AI assistant. Your task is to generate a concise and relevant project name for a software project. 
The project name should be a maximum of 5 words.
Return ONLY the project name, without any additional text, explanations, or quotation marks.`;
    const userPrompt = `Generate a project name for a feature described as: "${featureTopic}"`;

    const name = await callOpenAICompletion(systemMessage, userPrompt, "gpt-3.5-turbo", 0.7, 20);
    
    if (name && name.startsWith("Error:")) {
        // Propagate error or handle as needed; for now, returning the error string
        return name;
    }
    // Basic cleanup, remove quotes if any
    return name ? name.replace(/[\"\']/g, "").trim() : "Default Project Name";
}

export async function generateProjectDescription(featureTopic: string): Promise<string> {
    const systemMessage = `You are an AI assistant. Your task is to generate a brief project description (1-2 sentences) for a software project.
Return ONLY the project description, without any additional text or explanations.`;
    const userPrompt = `Generate a 1-2 sentence project description for a feature described as: "${featureTopic}"`;

    const description = await callOpenAICompletion(systemMessage, userPrompt, "gpt-3.5-turbo", 0.7, 100);

    if (description && description.startsWith("Error:")) {
        return description; // Propagate error
    }
    return description ? description.trim() : "Default project description.";
}

export async function askChatGPT(question: string, conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    if (!openai) {
        return "I'm sorry, but my connection to the OpenAI service is not configured. Please tell my administrator.";
    }

    // Add a system message to guide the AI. This should be refined.
    const systemMessage = `You are Labnex AI, a helpful assistant for the Labnex test case management application. 
    Your goal is to answer user questions about how to use Labnex, its features, and best practices for test management. 
    Be concise and helpful. If you don't know the answer, say so. Do not make up features that don't exist. 
    Refer to Labnex components and concepts accurately. For example, users create 'Projects', then 'Test Cases' within those projects. 
    Test cases have 'steps', 'expected results', 'status' (e.g., pass, fail, pending), and 'priority' (e.g., LOW, MEDIUM, HIGH).
    Labnex supports team collaboration through project invites and roles (e.g., PROJECT_OWNER, TESTER).
    The UI has a dashboard, project details pages, test case lists, and a notification center.
    When reviewing conversation history, if a previous turn involved listing items (e.g., projects, notes, tasks) and the user asks a follow-up question like "What do you think about the first one?" or "Tell me more about [item from the list]", use the prior assistant message from the history to understand which item they are referring to.
    Provide insightful and relevant comments if the user asks for your opinion on their project or plans based on the context.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage }
    ];

    if (conversationHistory) {
        messages.push(...conversationHistory);
    }
    messages.push({ role: "user", content: question });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using a more context-aware model
            messages: messages,
            temperature: 0.7, // Adjust for creativity vs. factuality
            max_tokens: 350, // Increased max_tokens for potentially more detailed contextual answers
        });

        const answer = completion.choices[0]?.message?.content;
        return answer || "I received a response, but it was empty. Please try rephrasing your question.";

    } catch (error: any) {
        console.error("Error calling OpenAI API:", error.message);
        if (error.response) {
            console.error("OpenAI API Response Error Data:", error.response.data);
        }
        // Provide a user-friendly error message
        let friendlyMessage = "Sorry, I encountered an issue while trying to reach the OpenAI service.";
        if (error.message && error.message.includes('insufficient_quota')) {
            friendlyMessage = "It seems I've run out of my current capacity to answer questions. Please notify my administrator.";
        }
        return friendlyMessage;
    }
}

export async function generateNoteContent(prompt: string): Promise<string> {
    if (!openai) {
        return "I'm sorry, but my connection to the OpenAI service is not configured. Please tell my administrator.";
    }

    const systemMessage = `You are a helpful AI assistant. Your task is to generate note content based on the user's prompt. 
The note should be concise, well-structured, and directly address the user's request. 
Avoid conversational fluff unless the prompt implies a specific style. Focus on delivering the core information or draft requested.
For example, if the user asks for "meeting minutes template", provide a template. If they ask to "summarize article X", provide a summary.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: 0.5, // Slightly more factual for note-taking
            max_tokens: 500, // Allow for slightly longer notes if needed
        });

        const answer = completion.choices[0]?.message?.content;
        return answer || "The AI generated an empty response. Please try rephrasing your prompt.";

    } catch (error: any) {
        console.error("Error calling OpenAI API for note generation:", error.message);
        if (error.response) {
            console.error("OpenAI API Response Error Data:", error.response.data);
        }
        let friendlyMessage = "Sorry, I encountered an issue while trying to generate the note content with AI.";
        if (error.message && error.message.includes('insufficient_quota')) {
            friendlyMessage = "It seems the AI service has run out of capacity. Please notify the administrator.";
        }
        // It might be better to throw an error here that the controller can catch and return a specific HTTP status code.
        // For now, returning a string that indicates failure.
        return `Error: ${friendlyMessage}`; 
    }
}

export async function assistWithCode(code: string, language: string, action: 'cleanup' | 'fix_errors'): Promise<string> {
    if (!openai) {
        // Consistent with other functions in this file, return an error string for the controller to check.
        return "I'm sorry, but my connection to the OpenAI service is not configured. Please tell my administrator.";
    }

    const systemPrompt =
      action === 'cleanup'
        ? `You are an expert code refactoring assistant. Clean up the following ${language} code without changing its behavior. Return ONLY the raw, cleaned code. Do NOT include any explanations, summaries, or markdown formatting.`
        : `You are an expert debugging assistant. Identify and fix errors in the following ${language} code. Analyze the code for syntax errors, common runtime issues, and logical flaws. If no obvious errors are found, return the original code. Return ONLY the raw, corrected (or original) code. Do NOT include any explanations, summaries, or markdown formatting.`;

    const userPrompt = [
      `Here is the ${language} code:`,
      '',
      `\`\`\`${language}`,
      code,
      '\`\`\`',
      ''
    ].join('\n');

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using the suggested model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, 
        max_tokens: 1500,
      });

      const message = completion.choices?.[0]?.message?.content;
      if (!message) {
        // Return an error string for the controller
        return "Error: OpenAI returned no content.";
      }
      return message;

    } catch (error: any) {
        console.error(`Error calling OpenAI API for code assistance (action: ${action}):`, error.message);
        if (error.response) {
            console.error("OpenAI API Response Error Data:", error.response.data);
        }
        let friendlyMessage = "Sorry, I encountered an issue while trying to assist with the code.";
        if (error.message && error.message.includes('insufficient_quota')) {
            friendlyMessage = "It seems the AI service has run out of capacity for code assistance. Please notify the administrator.";
        }
        return `Error: ${friendlyMessage}`;
    }
} 

export interface NLUResponse {
    intent: string; // e.g., "create_task", "list_projects", "add_note", "general_question"
    entities: { [key: string]: string }; // e.g., { "project_name": "WebApp", "task_title": "Fix login bug" }
    confidence?: number; // Optional: 0.0 to 1.0
    processed_query?: string; // Optional: The query after some cleanup by the NLU
    original_query: string; // The original user query
    answer_suggestion?: string; // For general_question intent, if the LLM can answer directly
}

export async function getIntentAndEntitiesFromQuery(
  query: string,
  conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<NLUResponse | null> {
    if (!openai) {
        console.error("[getIntentAndEntitiesFromQuery] OpenAI service not configured.");
        // Return a specific structure or throw an error that can be handled upstream
        return {
            intent: "error",
            entities: { "error_message": "OpenAI service not configured." },
            original_query: query
        };
    }

    const systemPrompt = `
Your task is to act as a Natural Language Understanding (NLU) engine for the Labnex Discord Bot.
Analyze the user's query and identify their primary intent and any relevant entities.
Return the output as a JSON object with the following structure:
{
  "intent": "PRIMARY_INTENT",
  "entities": {
    "entity_name_1": "value_1",
    "entity_name_2": "value_2"
  },
  "original_query": "The user's original unaltered query"
}

Primary Intents to recognize:
- "create_task": User wants to create a new task.
  - Entities: "project_name", "task_title", "task_description", "priority", "due_date"
- "list_tasks": User wants to list tasks, possibly for a specific project.
  - Entities: "project_name", "status", "priority"
- "get_task_details": User wants to see details for a specific task.
  - Entities: "task_identifier" (This could be a task ID like "TSK-123" or a partial title like "login button fix")
- "update_task_status": User wants to change the status of a task.
  - Entities: "task_identifier", "new_status"
- "create_project": User wants to create a new project (this might be a multi-step NLU interaction or a direct command).
  - Entities: "project_name", "project_description", "project_code" (less common for NLU, more for setup command)
- "list_projects": User wants to list their projects.
  - Entities: None typically, but could have filters like "active" if supported.
- "get_project_details": User wants details for a specific project.
  - Entities: "project_identifier" (name or ID)
- "add_note": User wants to add a note.
  - Entities: "note_title", "note_content", "project_name" (optional, for associating note with project)
- "list_notes": User wants to list notes.
  - Entities: "project_name" (optional filter)
- "create_snippet": User wants to create a code snippet.
  - Entities: "snippet_title", "snippet_language", "snippet_code", "project_name" (optional)
- "list_snippets": User wants to list code snippets.
  - Entities: "language" (optional filter), "project_name" (optional filter)
- "create_test_case": User wants to create a new test case.
  - Entities: "project_name" (or "project_identifier"), "test_case_title", "test_case_description", "test_case_steps", "expected_result", "priority"
- "update_test_case_status": User wants to change the status of a test case.
  - Entities: "test_case_identifier" (name or ID), "new_status" (e.g., "Pass", "Fail", "Pending"), "project_identifier" (optional, if user specifies it)
- "list_test_cases": User wants to list test cases for a specific project.
  - Entities: "project_identifier" (name or ID of the project)
- "update_test_case_priority": User wants to change the priority of a test case.
  - Entities: "test_case_identifier" (name or ID), "new_priority" (e.g., "High", "Medium", "Low"), "project_identifier" (optional)
- "general_question": User is asking a general question about Labnex, test management, or seeking advice.
  - Entities: None specifically, the whole query is the question.
- "get_nlu_capabilities": User is asking what they can say or what the bot can do.
  - Entities: None.
- "link_discord_account": User wants to link their Discord account to their Labnex account.
  - Entities: None typically.

Entity Extraction:
- "project_name" or "project_identifier": Extract the name or ID of a project.
- "task_identifier": Extract the name or ID of a task.
- "test_case_identifier": Extract the name or ID of a test case. Quotes around names should be removed by you before populating the entity.
- "new_status": For task and test case status updates, extract the desired new status. You MUST normalize common synonyms to one of "Pass", "Fail", or "Pending".
    - For "Pass": "done", "passed", "complete", "ok", "good", "successful"
    - For "Fail": "failed", "broken", "error", "bad", "unsuccessful", "not working"
    - For "Pending": "waiting", "in progress", "todo", "hold", "on hold", "pending review", "needs review"
  If a status is ambiguous or not one of the recognized synonyms, extract it as provided by the user, and the bot application will handle clarification.
- "new_priority": For test case priority updates, extract the desired new priority. You MUST normalize common synonyms to one of "High", "Medium", or "Low".
    - For "High": "hi", "urgent", "critical"
    - For "Medium": "med", "normal", "standard"
    - For "Low": "lo", "deferred", "later"
  If a priority is ambiguous or not recognized, extract it as provided by the user for bot clarification.

Example Queries and Expected JSON Output:

Example for listing projects:
Query: "list my projects"
{
  "intent": "list_projects",
  "entities": {},
  "original_query": "list my projects"
}

Example for creating a task:
Query: "Create a task to fix the login button in the WebApp project."
{
  "intent": "create_task",
  "entities": {
    "task_title": "fix the login button",
    "project_name": "WebApp"
  },
  "original_query": "Create a task to fix the login button in the WebApp project."
}

Example for creating a project (advanced, might be multi-step in reality for bot):
Query: "Create a new project called 'Omega Initiative' code OMEGA with description 'Top secret planning'"
{
  "intent": "create_project",
  "entities": {
    "project_name": "Omega Initiative",
    "project_code": "OMEGA",
    "project_description": "Top secret planning"
  },
  "original_query": "Create a new project called 'Omega Initiative' code OMEGA with description 'Top secret planning'"
}

Example for initiating test case creation:
Query: "create a test case"
{
  "intent": "create_test_case",
  "entities": {},
  "original_query": "create a test case"
}

Example for creating a test case with project pre-filled:
Query: "create a new test case for project Alpha"
{
  "intent": "create_test_case",
  "entities": {
    "project_name": "Alpha"
  },
  "original_query": "create a new test case for project Alpha"
}

Example for creating a test case with full details (advanced, might be multi-step in reality for bot):
Query: "Create a test case for 'User Login' in project 'Phoenix'. Steps: 1. Enter username 2. Enter password 3. Click login. Expected result: User is logged in. Priority: High."
{
  "intent": "create_test_case",
  "entities": {
    "project_name": "Phoenix",
    "test_case_title": "User Login",
    "test_case_steps": "1. Enter username 2. Enter password 3. Click login.",
    "expected_result": "User is logged in.",
    "priority": "High"
  },
  "original_query": "Create a test case for 'User Login' in project 'Phoenix'. Steps: 1. Enter username 2. Enter password 3. Click login. Expected result: User is logged in. Priority: High."
}

Example for updating a test case status:
Query: "mark the 'Login Page' test case as passed"
{
  "intent": "update_test_case_status",
  "entities": {
    "test_case_identifier": "Login Page",
    "new_status": "Pass"
  },
  "original_query": "mark the 'Login Page' test case as passed"
}

Query: "set test case Login Bug Fix to failed in project SecureLogin"
{
  "intent": "update_test_case_status",
  "entities": {
    "test_case_identifier": "Login Bug Fix",
    "new_status": "Fail",
    "project_identifier": "SecureLogin"
  },
  "original_query": "set test case Login Bug Fix to failed in project SecureLogin"
}

Query: "change 'Password Reset' to pending"
{
  "intent": "update_test_case_status",
  "entities": {
    "test_case_identifier": "Password Reset",
    "new_status": "Pending"
  },
  "original_query": "change 'Password Reset' to pending"
}

Query: "mark test case User Profile Display as complete"
{
  "intent": "update_test_case_status",
  "entities": {
    "test_case_identifier": "User Profile Display",
    "new_status": "Pass"
  },
  "original_query": "mark test case User Profile Display as complete"
}

Example for listing test cases:
Query: "Show me all test cases for the AuraTest project"
{
  "intent": "list_test_cases",
  "entities": {
    "project_identifier": "AuraTest"
  },
  "original_query": "Show me all test cases for the AuraTest project"
}

Query: "List test cases for AuraTest"
{
  "intent": "list_test_cases",
  "entities": {
    "project_identifier": "AuraTest"
  },
  "original_query": "List test cases for AuraTest"
}

Example for updating test case priority:
Query: "Update the priority of test case 'Session Timeout' to high"
{
  "intent": "update_test_case_priority",
  "entities": {
    "test_case_identifier": "Session Timeout",
    "new_priority": "High"
  },
  "original_query": "Update the priority of test case 'Session Timeout' to high"
}

Query: "set priority of 'Login Test' to low in project 'WebApp'"
{
  "intent": "update_test_case_priority",
  "entities": {
    "test_case_identifier": "Login Test",
    "new_priority": "Low",
    "project_identifier": "WebApp"
  },
  "original_query": "set priority of 'Login Test' to low in project 'WebApp'"
}

Example for asking a general question:
Query: "How do I invite a team member to my project?"
{
  "intent": "general_question",
  "entities": {},
  "original_query": "How do I invite a team member to my project?",
  "answer_suggestion": "You can invite team members to your project by going to the project settings page and using the 'Invite Members' feature. You'll typically need their email address."
}

Example for "get_nlu_capabilities":
Query: "What can I ask?"
{
  "intent": "get_nlu_capabilities",
  "entities": {},
  "original_query": "What can I ask?"
}

Example for linking Discord account:
Query: "link my discord account"
{
  "intent": "link_discord_account",
  "entities": {},
  "original_query": "link my discord account"
}
Query: "How do I connect my discord?"
{
  "intent": "link_discord_account",
  "entities": {},
  "original_query": "How do I connect my discord?"
}
`; // System message ends here

    console.log("[getIntentAndEntitiesFromQuery] System Prompt for NLU:", systemPrompt);

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using a more capable model might be beneficial for structured JSON output
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0.2, // Low temperature for more deterministic NLU output
            max_tokens: 500,  // Max tokens for the JSON response
            response_format: { type: "json_object" } // Request JSON response from capable models
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (responseContent) {
            try {
                const parsedResponse = JSON.parse(responseContent) as NLUResponse;
                // Ensure original_query is always present, even if model omits it
                if (!parsedResponse.original_query) {
                    parsedResponse.original_query = query;
                }
                console.log("[getIntentAndEntitiesFromQuery] Successfully parsed NLU response:", parsedResponse);
                return parsedResponse;
            } catch (parseError: any) {
                console.error("[getIntentAndEntitiesFromQuery] Error parsing JSON response from OpenAI:", parseError.message);
                console.error("[getIntentAndEntitiesFromQuery] Raw OpenAI response:", responseContent);
                return {
                    intent: "nlu_parse_error",
                    entities: { "error_message": "Failed to parse NLU response from AI.", "raw_response": responseContent },
                    original_query: query
                };
            }
        }
        console.error("[getIntentAndEntitiesFromQuery] OpenAI response was empty or malformed.");
        return {
            intent: "nlu_error",
            entities: { "error_message": "OpenAI returned an empty or malformed response for NLU." },
            original_query: query
        };

    } catch (error: any) {
        console.error("[getIntentAndEntitiesFromQuery] Error calling OpenAI API:", error.message);
        if (error.response) {
            console.error("[getIntentAndEntitiesFromQuery] OpenAI API Response Error Data:", error.response.data);
        }
        let friendlyMessage = "Sorry, I encountered an issue while trying to understand your request with AI.";
        if (error.message && error.message.includes('insufficient_quota')) {
            friendlyMessage = "It seems the AI understanding service has run out of capacity. Please notify the administrator.";
        }
        return {
            intent: "nlu_api_error",
            entities: { "error_message": friendlyMessage, "api_error": error.message },
            original_query: query
        };
    }
} 

// Interface for the structure of a single test case generated by AI
export interface ITestCaseGenerationItem {
    title: string;
    description: string; // A brief description for the test case itself
    steps: string[];
    expectedResult: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Interface for the expected JSON structure from OpenAI for test cases
interface IOpenAITestCasesResponse {
    testCases: ITestCaseGenerationItem[];
}

export async function generateTestCases(
    featureTopic: string, 
    coverageLevel: 'Light' | 'Medium' | 'Thorough', 
    projectName: string
): Promise<ITestCaseGenerationItem[] | string> { // Returns array or error string
    let numTestCases = "3-5";
    let detailLevel = "standard detail";
    switch (coverageLevel) {
        case 'Light':
            numTestCases = "2-3";
            detailLevel = "concise detail, focusing on critical paths";
            break;
        case 'Medium':
            numTestCases = "3-5";
            detailLevel = "standard detail, covering common scenarios";
            break;
        case 'Thorough':
            numTestCases = "5-7";
            detailLevel = "comprehensive detail, including edge cases and common failure points";
            break;
    }

    const systemMessage = `You are an AI assistant specialized in software testing and quality assurance.
Your task is to generate a list of test cases for a given software feature. 
Output ONLY a valid JSON object with a single key "testCases", which is an array of test case objects.
Each test case object must contain the following fields:
- "title": string (A concise, unique title for this test case within the context of the project '${projectName}')
- "description": string (A brief 1-sentence description of what this specific test case is validating)
- "steps": string[] (An array of 2-5 clear, actionable steps a tester would perform)
- "expectedResult": string (What should happen after performing the steps)
- "priority": string (Enum: "LOW", "MEDIUM", or "HIGH")

Adhere strictly to the JSON format. Do not include any explanations, introductory text, or markdown formatting outside the JSON structure.`;

    const userPrompt = `Generate ${numTestCases} test cases for a feature described as: "${featureTopic}" for the project named "${projectName}".
The test cases should have ${detailLevel}. Ensure test case titles are unique for this project.
Focus on functionality, usability, and basic negative testing appropriate for the coverage level.

Example of a single test case object structure:
{
  "title": "Example Test Case Title",
  "description": "Verify that the main action button performs its function correctly.",
  "steps": ["Navigate to the feature page.", "Click the main action button."],
  "expectedResult": "The expected outcome occurs and is visible to the user.",
  "priority": "HIGH"
}

Provide the full JSON object containing the "testCases" array.`;

    // Using a higher max_tokens for potentially longer JSON output
    const jsonResponse = await callOpenAICompletion(systemMessage, userPrompt, "gpt-4o-mini", 0.5, 1500, { type: "json_object" });

    if (!jsonResponse || jsonResponse.startsWith("Error:")) {
        return jsonResponse || "Error: Failed to generate test cases."; // Propagate error or provide default error
    }

    try {
        const parsed = JSON.parse(jsonResponse) as IOpenAITestCasesResponse;
        if (parsed && parsed.testCases && Array.isArray(parsed.testCases)) {
            // Basic validation of the parsed structure
            if (parsed.testCases.every(tc => 
                typeof tc.title === 'string' && 
                typeof tc.description === 'string' && 
                Array.isArray(tc.steps) && 
                tc.steps.every(s => typeof s === 'string') &&
                typeof tc.expectedResult === 'string' &&
                ['LOW', 'MEDIUM', 'HIGH'].includes(tc.priority)
            )) {
                return parsed.testCases;
            }
        }
        console.error("[generateTestCases] OpenAI response was not the expected JSON structure:", jsonResponse);
        return "Error: AI generated an invalid format for test cases.";
    } catch (e) {
        console.error("[generateTestCases] Failed to parse JSON response from OpenAI:", e, "\nResponse was:", jsonResponse);
        return "Error: AI generated invalid JSON for test cases. Please try again.";
    }
} 

// Interface for the structure of a single development task generated by AI
export interface ITaskGenerationItem {
    title: string;
    description?: string; // Optional description for the task
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Interface for the expected JSON structure from OpenAI for tasks
interface IOpenAITasksResponse {
    tasks: ITaskGenerationItem[];
}

export async function generateDevelopmentTasks(
    featureTopic: string, 
    projectName: string
): Promise<ITaskGenerationItem[] | string> { // Returns array or error string
    const numTasks = "3-5"; // Define the number of tasks to generate

    const systemMessage = `You are an AI assistant specialized in project management and software development planning.
Your task is to generate a list of high-level development tasks for a given software feature.
Output ONLY a valid JSON object with a single key "tasks", which is an array of task objects.
Each task object must contain the following fields:
- "title": string (A concise, unique title for this task within the context of the project '${projectName}')
- "description": string (Optional: A brief 1-sentence description of what this task involves)
- "priority": string (Enum: "LOW", "MEDIUM", or "HIGH")

Adhere strictly to the JSON format. Do not include any explanations, introductory text, or markdown formatting outside the JSON structure. Ensure task titles are unique within this set.`;

    const userPrompt = `Generate ${numTasks} high-level development tasks to build a feature described as: "${featureTopic}" for the project named "${projectName}".
The tasks should be actionable steps a developer could take. Assign a priority to each task.

Example of a single task object structure:
{
  "title": "Example Task Title",
  "description": "Implement the core logic for the new authentication module.",
  "priority": "HIGH"
}

Provide the full JSON object containing the "tasks" array.`;

    const jsonResponse = await callOpenAICompletion(systemMessage, userPrompt, "gpt-4o-mini", 0.5, 1000, { type: "json_object" });

    if (!jsonResponse || jsonResponse.startsWith("Error:")) {
        return jsonResponse || "Error: Failed to generate development tasks.";
    }

    try {
        const parsed = JSON.parse(jsonResponse) as IOpenAITasksResponse;
        if (parsed && parsed.tasks && Array.isArray(parsed.tasks)) {
            // Basic validation of the parsed structure
            if (parsed.tasks.every(task => 
                typeof task.title === 'string' &&
                (typeof task.description === 'string' || typeof task.description === 'undefined') &&
                ['LOW', 'MEDIUM', 'HIGH'].includes(task.priority)
            )) {
                return parsed.tasks;
            }
        }
        console.error("[generateDevelopmentTasks] OpenAI response was not the expected JSON structure:", jsonResponse);
        return "Error: AI generated an invalid format for development tasks.";
    } catch (e) {
        console.error("[generateDevelopmentTasks] Failed to parse JSON response from OpenAI:", e, "\nResponse was:", jsonResponse);
        return "Error: AI generated invalid JSON for development tasks. Please try again.";
    }
} 