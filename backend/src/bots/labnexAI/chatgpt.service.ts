import OpenAI from 'openai';
import dotenv from 'dotenv';
import * as fs from 'fs/promises'; // Added for RAG
import * as path from 'path'; // Added for RAG

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

// Cache for RAG
const documentationCache: { [key: string]: string } = {};
const documentationFolderPath = path.join(__dirname, '../../../../frontend/public/documentation_md/topics/'); // Adjusted path relative to this file's compiled location in 'dist'

// Function to load documentation into the cache
export async function loadDocumentation(): Promise<void> {
    console.log('[loadDocumentation] Attempting to load documentation from:', documentationFolderPath);
    const filesToLoad = [
        'getting-started.md', 'cli-usage.md', 'introduction.md', 'website-usage.md',
        'faq.md', 'developer-guide.md', 'api-reference.md', 'bot-note-snippet.md',
        'discord-bot-usage.md', 'bot-commands.md', 'user-settings.md', 'notes-snippets.md',
        'test-case-management.md', 'task-management.md', 'project-management.md',
        'dashboard.md', 'discord-linking.md', 'account-creation.md', 'advanced-topics.md'
    ];

    for (const fileName of filesToLoad) {
        try {
            const filePath = path.join(documentationFolderPath, fileName);
            const content = await fs.readFile(filePath, 'utf-8');
            const key = path.basename(fileName, '.md');
            documentationCache[key] = content;
            console.log(`[loadDocumentation] Loaded ${fileName} into cache as ${key}.`);
        } catch (error: any) {
            console.error(`[loadDocumentation] Error loading ${fileName}:`, error.message);
        }
    }
    if (Object.keys(documentationCache).length > 0) {
        console.log('[loadDocumentation] Documentation loaded successfully. Cache size:', Object.keys(documentationCache).length);
    } else {
        console.warn('[loadDocumentation] No documentation was loaded. Please check paths and file permissions.');
    }
}

// Load documentation when the module starts - REMOVED, will be loaded on-demand
// loadDocumentation().catch(error => {
//     console.error("[loadDocumentation] Critical error during initial documentation load:", error);
// });

// Function to find relevant documentation based on keywords
async function findRelevantDocumentation(query: string): Promise<string | null> {
    if (Object.keys(documentationCache).length === 0) {
        console.warn("[findRelevantDocumentation] Documentation cache is empty. Loading on-demand.");
        await loadDocumentation();
        if (Object.keys(documentationCache).length === 0) {
            console.error("[findRelevantDocumentation] Failed to load documentation on-demand. Cannot search.");
            return null;
        }
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2); // Simple tokenizer, ignore small words
    if (queryWords.length === 0) {
        return null;
    }

    let bestMatchContent: string | null = null;
    let maxMatches = 0;

    console.log(`[findRelevantDocumentation] Searching for query: "${query}", using words: ${queryWords.join(', ')}`);

    for (const key in documentationCache) {
        const content = documentationCache[key];
        const contentLower = content.toLowerCase();
        let currentMatches = 0;

        for (const word of queryWords) {
            if (contentLower.includes(word)) {
                currentMatches++;
            }
        }

        // Prioritize documents with more matches
        if (currentMatches > maxMatches) {
            maxMatches = currentMatches;
            bestMatchContent = content;
            console.log(`[findRelevantDocumentation] New best match: ${key} with ${currentMatches} matches.`);
        }
    }

    // Only return content if there's a reasonable number of matches (e.g., > 1 or a certain percentage)
    // This threshold might need tuning.
    if (maxMatches > 1) { // Let's say we need at least 2 keyword matches
        console.log(`[findRelevantDocumentation] Found relevant doc with ${maxMatches} matches. Returning content.`);
        // We could potentially return a snippet here instead of the full document for very long docs.
        // For now, returning full content, truncated if too long for the LLM context.
        const MAX_DOC_LENGTH_FOR_CONTEXT = 3000; // Characters, adjust as needed
        if (bestMatchContent && bestMatchContent.length > MAX_DOC_LENGTH_FOR_CONTEXT) {
            return bestMatchContent.substring(0, MAX_DOC_LENGTH_FOR_CONTEXT) + "... (content truncated)";
        }
        return bestMatchContent;
    }

    console.log("[findRelevantDocumentation] No sufficiently relevant documentation found.");
    return null;
}

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

export async function generateTagsForTicket(issueDescription: string): Promise<string[] | null> {
    const systemMessage = `You are a ticket processing AI. Your task is to analyze a user's issue description and generate 2-3 relevant, single-word, lowercase tags that categorize the issue.
Return the tags as a JSON object with a single key "tags" containing an array of strings. For example: {"tags": ["bug", "ui", "login"]}`;
    const userPrompt = `Generate tags for the following issue: "${issueDescription}"`;

    try {
        const response = await callOpenAICompletion(
            systemMessage,
            userPrompt,
            "gpt-3.5-turbo",
            0.5,
            50,
            { type: "json_object" }
        );

        if (response && !response.startsWith("Error:")) {
            const parsed = JSON.parse(response);
            if (parsed.tags && Array.isArray(parsed.tags)) {
                return parsed.tags;
            }
        }
        return null;
    } catch (error) {
        console.error('[generateTagsForTicket] Failed to generate or parse tags:', error);
        return null;
    }
}

export async function generateSuggestedReply(userMessage: string): Promise<string | null> {
    const systemMessage = `You are a support agent AI for Labnex. A user has submitted a support ticket. 
Your task is to generate a brief, helpful, and polite initial response. 
The reply should acknowledge the user's issue and, if possible, ask a clarifying question or suggest a common first step. 
Keep the tone professional and empathetic. Do not make up features.
Return ONLY the suggested reply text, without any extra formatting, titles, or quotation marks.`;
    const userPrompt = `Generate a reply for this user message: "${userMessage}"`;

    try {
        const response = await callOpenAICompletion(
            systemMessage,
            userPrompt,
            "gpt-3.5-turbo",
            0.7,
            150
        );

        if (response && !response.startsWith("Error:")) {
            return response.trim();
        }
        return null;
    } catch (error) {
        console.error('[generateSuggestedReply] Failed to generate reply:', error);
        return null;
    }
}

export async function askChatGPT(question: string, conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    if (!openai) {
        return "I'm sorry, but my connection to the OpenAI service is not configured. Please tell my administrator.";
    }

    // Ensure documentation is loaded before trying to find relevant content
    if (Object.keys(documentationCache).length === 0) {
        await loadDocumentation();
    }

    let relevantDocContent = await findRelevantDocumentation(question);

    // Base system message
    let systemMessageContent = `You are Labnex AI, a helpful assistant for the Labnex test case management application. 
    Your goal is to answer user questions about how to use Labnex, its features, and best practices for test management.`;

    // Dynamically add to system message if relevant docs are found
    if (relevantDocContent) {
        systemMessageContent += `\n\nRelevant Information from Labnex Documentation (use this to answer the user's current question if applicable):
---
${relevantDocContent}
---
When answering, if you use this information, you can subtly indicate it comes from Labnex's resources, but avoid phrases like 'According to the documentation I found...'. Instead, integrate the information naturally. If the provided information doesn't directly answer the question, rely on your general knowledge.`;
    } else {
        systemMessageContent += `
    You have access to and should refer to the official Labnex documentation for detailed information. Key documentation topics include:
    - Introduction to Labnex, Getting Started, Account Creation
    - Project Management, Test Case Management, Task Management
    - Dashboard, Website Usage, User Settings
    - CLI Usage, API Reference, Developer Guide
    - Discord Bot Usage, Bot Commands, Discord Linking
    - Notes & Snippets, FAQ, and Advanced Topics.
    When a user's question can be answered using this documentation, prioritize information from it.`;
    }
    
    systemMessageContent += `
    Be concise and helpful. If you don't know the answer or the information isn't in the documentation, say so. Do not make up features that don't exist. 
    Refer to Labnex components and concepts accurately. For example, users create 'Projects', then 'Test Cases' within those projects. 
    Test cases have 'steps', 'expected results', 'status' (e.g., pass, fail, pending), and 'priority' (e.g., LOW, MEDIUM, HIGH).
    Labnex supports team collaboration through project invites and roles (e.g., PROJECT_OWNER, TESTER).
    The UI has a dashboard, project details pages, test case lists, and a notification center.

    You should also be able to discuss:
    - The Labnex CLI: its commands, installation, and common use cases.
    - Current waitlist status for new features or access, if applicable (you may need to state if this information is not available to you).
    - General development status or roadmap insights for Labnex, if this information is publicly available or provided to you.

    When reviewing conversation history, if a previous turn involved listing items (e.g., projects, notes, tasks) and the user asks a follow-up question like "What do you think about the first one?" or "Tell me more about [item from the list]", use the prior assistant message from the history to understand which item they are referring to.
    Provide insightful and relevant comments if the user asks for your opinion on their project or plans based on the context.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessageContent }
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
  conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[],
  pageContext?: Record<string, any>
): Promise<NLUResponse | null> {
    if (!openai) {
        console.error("[getIntentAndEntitiesFromQuery] OpenAI service not configured.");
        return null;
    }

    // Build human-readable context lines for the prompt
    const ctxLines = pageContext && Object.keys(pageContext).length > 0
      ? Object.entries(pageContext)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `• ${k}: ${v}`)
          .join('\n')
      : 'none';

    // System prompt for intent extraction, JSON-only response
    const systemPromptIntentExtraction = `
    You are an NLU (Natural Language Understanding) engine for Labnex AI, a Discord/web assistant for the Labnex platform.
    Your task is to analyze the user's query and determine their intent and any relevant entities.

    Current UI context (use this to fill missing entities before asking the user):
    ${ctxLines}

    Respond ONLY with a JSON object matching the NLUResponse interface:
    { "intent": "string", "entities": { "key": "value" }, "confidence": number, "processed_query": "string", "original_query": "string", "answer_suggestion": "string (optional)" }

    If the query is ambiguous or you cannot confidently determine a specific Labnex-related intent, set intent to "general_question".
    If something is missing but clearly required (e.g. project_code) you may still set the correct intent but leave the field empty.
    `;
    
    const userMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (conversationHistory) {
        userMessages.push(...conversationHistory);
    }
    userMessages.push({ role: "user", content: query });
    
    const rawResponse = await callOpenAICompletion(
        systemPromptIntentExtraction,
        query, // Pass query directly as userPrompt, system prompt already has instructions to use conversation history
        "gpt-4o-mini", // Using a model known for good instruction following and JSON mode
        0.2, // Lower temperature for more deterministic NLU output
        300, // Max tokens for the NLU JSON response
        { type: "json_object" },
        conversationHistory // Pass full history for context
    );

    if (rawResponse && !rawResponse.startsWith("Error:")) {
        try {
            const parsedResponse = JSON.parse(rawResponse) as NLUResponse;
            // Ensure original_query is always populated
            if (!parsedResponse.original_query) {
                parsedResponse.original_query = query;
            }
            // Merge page context fallback for certain entities
            const mergedEntities = mergeContextEntities(parsedResponse.entities, pageContext);
            parsedResponse.entities = mergedEntities;

            if (parsedResponse.intent && typeof parsedResponse.entities === 'object') {
                return parsedResponse;
            }
            console.warn("[getIntentAndEntitiesFromQuery] Parsed JSON does not match NLUResponse structure:", parsedResponse);
            return { intent: "general_question", entities: {}, original_query: query, confidence: 0.3, processed_query: query, answer_suggestion: "I had a little trouble understanding that, could you rephrase?" };    
        } catch (e) {
            console.error("[getIntentAndEntitiesFromQuery] Error parsing NLU JSON response:", e);
            console.error("[getIntentAndEntitiesFromQuery] Raw response was:", rawResponse);
            // Fallback to general_question if JSON parsing fails
            return { intent: "general_question", entities: {}, original_query: query, confidence: 0.2, processed_query: query, answer_suggestion: "I had a little trouble understanding your request structure, could you try rephrasing?" };
        }
    }
    // If rawResponse contains an error string from callOpenAICompletion, or is null
    console.error("[getIntentAndEntitiesFromQuery] Failed to get valid NLU response from OpenAI. Raw response:", rawResponse);
    return { intent: "general_question", entities: {}, original_query: query, confidence: 0.1, processed_query: query, answer_suggestion: "I'm having trouble connecting to my understanding circuits right now. Could you try that again in a moment?" };
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

function mergeContextEntities(entities: Record<string, any>, ctx?: Record<string, any>): Record<string, any> {
    if (!ctx) return entities;
    const merged = { ...entities };
    if (!merged.project_id && ctx.projectId) merged.project_id = ctx.projectId;
    if (!merged.project_name && ctx.projectName) merged.project_name = ctx.projectName;
    if (!merged.task_id && ctx.selectedTaskId) merged.task_id = ctx.selectedTaskId;
    if (!merged.test_case_id && ctx.selectedTestCaseId) merged.test_case_id = ctx.selectedTestCaseId;
    return merged;
} 