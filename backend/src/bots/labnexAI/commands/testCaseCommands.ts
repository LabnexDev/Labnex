import axios from 'axios';
import { LabnexTestCase, TestCaseField, TestCaseInProgress } from '../types/labnexAI.types';

// Environment variables (assuming they are available in this scope or passed as arguments if needed)
const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

// Statistics (if these are meant to be shared, they might need a different approach like a singleton or passed around)
// For now, assuming messagesSentToUser is managed elsewhere or passed to reply function if needed for stats.
// let messagesSentToUser = 0; 

export const testCasesInProgress: Map<string, TestCaseInProgress> = new Map();

export async function handleTestCaseCreationStep(message: any, progress: TestCaseInProgress) {
    const userInput = message.content.trim();
    const discordUserId = progress.discordUserId;

    const reply = async (text: string) => {
        try {
            const sentMsg = await message.reply(text);
            // messagesSentToUser++; // If tracking is needed here, pass messagesSentToUser or a callback to increment
            progress.lastBotMessage = sentMsg; 
        } catch (e) {
            console.error("[handleTestCaseCreationStep] Error replying to user:", e);
        }
    };

    if (userInput.toLowerCase() === 'cancel') {
        testCasesInProgress.delete(discordUserId);
        await reply("Okay, I\'ve cancelled the test case creation.");
        return;
    }

    let nextQuestion = "";
    let nextField: TestCaseField | null = null;
    let readyToCreate = false;

    switch (progress.currentQuestionField) {
        case 'project_name':
            if (!userInput) {
                await reply("Project name cannot be empty. Please provide a project name or ID, or say 'cancel'.");
                return;
            }
            progress.project_name = userInput;
            nextField = 'test_case_title';
            nextQuestion = "Got it. What\'s the title for this test case?";
            break;

        case 'test_case_title':
            if (!userInput) {
                await reply("Test case title cannot be empty. Please provide a title, or say 'cancel'.");
                return;
            }
            progress.test_case_title = userInput;
            nextField = 'test_case_description';
            nextQuestion = "Okay. Could you provide a brief description for this test case?";
            break;

        case 'test_case_description':
            if (!userInput) {
                await reply("Description cannot be empty. Please provide a description, or say 'cancel'.");
                return;
            }
            progress.test_case_description = userInput;
            nextField = 'test_case_steps';
            nextQuestion = "Next, please list the steps to reproduce. You can write them as a numbered or bulleted list.";
            break;

        case 'test_case_steps':
            if (!userInput) {
                await reply("Steps cannot be empty. Please provide the steps, or say 'cancel'.");
                return;
            }
            progress.test_case_steps = userInput;
            nextField = 'expected_result';
            nextQuestion = "What is the expected result after performing these steps?";
            break;

        case 'expected_result':
            if (!userInput) {
                await reply("Expected result cannot be empty. Please provide the expected result, or say 'cancel'.");
                return;
            }
            progress.expected_result = userInput;
            nextField = 'priority';
            nextQuestion = "What\'s the priority for this test case? (e.g., Low, Medium, High - you can skip this by saying 'skip' or 'none').";
            break;

        case 'priority':
            const lowerInput = userInput.toLowerCase();
            if (lowerInput === 'skip' || lowerInput === 'none' || !userInput) {
                progress.priority = undefined; 
            } else {
                const validPriorities = ["low", "medium", "high"];
                if (validPriorities.includes(lowerInput)) {
                    progress.priority = lowerInput.toUpperCase();
                } else {
                    await reply("Invalid priority. Please enter Low, Medium, High, or say 'skip'.");
                    return; 
                }
            }
            nextField = 'done'; 
            nextQuestion = "Thanks! I have all the details: " +
                           `\\nProject: ${progress.projectName}` +
                           `\\nTitle: ${progress.test_case_title}` +
                           `\\nDescription: ${progress.test_case_description}` +
                           `\\nSteps: ${progress.test_case_steps}` +
                           `\\nExpected Result: ${progress.expected_result}` +
                           `${progress.priority ? `\\nPriority: ${progress.priority}` : ''}` +
                           "\\n\\nShall I create this test case? (yes/no)";
            break;
        
        case 'done': 
            const confirmInput = userInput.toLowerCase();
            if (confirmInput === 'yes' || confirmInput === 'y') {
                readyToCreate = true;
            } else if (confirmInput === 'no' || confirmInput === 'n') {
                testCasesInProgress.delete(discordUserId);
                await reply("Okay, I\'ve discarded this test case. Let me know if you want to start over!");
                return;
            } else {
                await reply("Please answer 'yes' or 'no'.");
                return; 
            }
            break;
    }

    if (readyToCreate) {
        console.log(`[handleTestCaseCreationStep] Ready to create test case for user ${discordUserId}:`, progress);
        try {
            const testCasePayload: LabnexTestCase = {
                discordUserId: discordUserId,
                projectIdentifier: progress.projectId!,
                title: progress.test_case_title!,
                description: progress.test_case_description!,
                steps: progress.test_case_steps!,
                expectedResult: progress.expected_result!,
                priority: progress.priority 
            };

            if (progress.originalMessage?.channel && typeof progress.originalMessage.channel.sendTyping === 'function') {
                 try {
                    await progress.originalMessage.channel.sendTyping();
                } catch (typingError) {
                    console.warn("[handleTestCaseCreationStep] Could not send typing indicator:", typingError);
                }
            }

            console.log('[handleTestCaseCreationStep] Attempting to create test case via API with payload:', testCasePayload);
            const apiResponse = await axios.post(`${LABNEX_API_URL}/integrations/discord/test-cases`, testCasePayload, {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET }
            });
            
            await reply(apiResponse.data.message || `Test case created successfully!`);
            testCasesInProgress.delete(discordUserId);

        } catch (error: any) {
            console.error(`[handleTestCaseCreationStep] Error creating test case for user ${discordUserId}:`, error.response?.data || error.message);
            await reply("Sorry, I couldn\'t create the test case due to an error. Please try again later.");
        }
    } else if (nextField) {
        progress.currentQuestionField = nextField;
        testCasesInProgress.set(discordUserId, progress); 
        await reply(nextQuestion);
    } else if (!nextField && !readyToCreate && userInput.toLowerCase() !== 'cancel') {
        console.warn("[handleTestCaseCreationStep] Reached an unexpected state. Current field:", progress.currentQuestionField, "Input:", userInput);
        await reply("I\'m a bit confused. Could you try rephrasing or say 'cancel' to stop?");
    }
} 