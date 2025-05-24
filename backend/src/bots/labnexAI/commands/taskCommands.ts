import axios from 'axios';
import { CommandInteraction, CacheType } from 'discord.js';
import {
    LabnexTaskItem,
    CreateTaskOptions,
    LabnexTaskDetails
} from '../types/labnexAI.types';

const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

export async function handleProjectTasksCommand(
    discordUserId: string,
    projectIdentifier: string | null, 
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>,
    interaction?: CommandInteraction<CacheType> 
) {
    console.log(`[handleProjectTasksCommand] Handling for user ${discordUserId}, Project: ${projectIdentifier || 'All/Default'}`);
    if (interaction?.channel &&
        ('sendTyping' in interaction.channel) &&
        typeof interaction.channel.sendTyping === 'function' &&
        projectIdentifier) { 
        try {
            await interaction.channel.sendTyping();
        } catch (e) { console.warn("Typing indicator failed in handleProjectTasksCommand", e); }
    }
    if (!projectIdentifier) {
        await replyFunction("Please specify a project name or ID to list tasks. Usage: `/tasks project:<name_or_id>`", true);
        return;
    }

    try {
        const apiResponse = await axios.get<LabnexTaskItem[]>(
            `${LABNEX_API_URL}/integrations/discord/project-tasks`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: {
                    discordUserId: discordUserId,
                    projectIdentifier: projectIdentifier 
                }
            }
        );

        const tasks = apiResponse.data;

        if (tasks && tasks.length > 0) {
            const tasksToShow = tasks.slice(0, 15); 
            const taskList = tasksToShow.map(task => 
                `- **${task.title}** (ID: ${task.id})\n  *Status:* ${task.status}, *Priority:* ${task.priority}`
            ).join('\n\n'); 
            
            let replyMessage = `Here are the tasks for project \"${projectIdentifier}\":\n\n${taskList}`;
            if (tasks.length > tasksToShow.length) {
                replyMessage += `\n\n*Showing ${tasksToShow.length} of ${tasks.length} tasks. For a full list, please check the Labnex web application.*`;
            }
            await replyFunction(replyMessage, false); 
        } else {
            await replyFunction(`No tasks found for project \"${projectIdentifier}\", or you may not have access.`, true);
        }

    } catch (error: any) {
        console.error(`[handleProjectTasksCommand] Error fetching tasks for project ${projectIdentifier}, user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn\'t fetch tasks for that project. Please ensure the project name/ID is correct, your account is linked, and try again.";
        await replyFunction(errorMessage, true);
    }
}

export async function handleCreateTaskCommand(
    options: CreateTaskOptions,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>,
    interaction?: CommandInteraction<CacheType> 
) {
    const { discordUserId, projectIdentifier, title, description, priority, status, dueDate } = options;
    console.log(`[handleCreateTaskCommand] Handling for user ${discordUserId}, Project: ${projectIdentifier}, Title: ${title}`);

    if (interaction?.channel &&
        ('sendTyping' in interaction.channel) &&
        typeof interaction.channel.sendTyping === 'function') {
        try {
            await interaction.channel.sendTyping();
        } catch (e) { console.warn("Typing indicator failed in handleCreateTaskCommand", e); }
    }

    if (!title || !projectIdentifier) { 
        await replyFunction("To create a task, you must provide at least a title and a project name/ID.", true);
        return;
    }

    let validatedPriority = priority;
    if (priority) {
        const validPriorities: { [key: string]: string } = { "low": "LOW", "medium": "MEDIUM", "high": "HIGH" };
        if (!validPriorities[priority.toLowerCase()]) {
            await replyFunction(`Invalid priority: \"${priority}\". Please use one of: Low, Medium, High.`, true);
            return;
        }
        validatedPriority = validPriorities[priority.toLowerCase()];
    }

    let validatedStatus = status;
    if (status) {
        const validStatuses: { [key: string]: string } = {
            "todo": "To Do", "to do": "To Do", "inprogress": "In Progress", "in progress": "In Progress",
            "blocked": "Blocked", "inreview": "In Review", "in review": "In Review", "done": "Done", "cancelled": "Cancelled"
        };
        if (!validStatuses[status.toLowerCase()]) {
            await replyFunction(`Invalid status: \"${status}\". Please use one of: To Do, In Progress, Blocked, In Review, Done, Cancelled.`, true);
            return;
        }
        validatedStatus = validStatuses[status.toLowerCase()];
    } else {
        validatedStatus = "To Do"; 
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        await replyFunction(`Invalid date format for due_date: \"${dueDate}\". Please use YYYY-MM-DD.`, true);
        return;
    }

    try {
        const apiPayload: any = {
            discordUserId,
            projectIdentifier,
            title,
            status: validatedStatus,
        };
        if (description) apiPayload.description = description;
        if (validatedPriority) apiPayload.priority = validatedPriority;
        if (dueDate) apiPayload.dueDate = dueDate;

        const apiResponse = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/tasks`,
            apiPayload,
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );
        
        const responseData = apiResponse.data;
        await replyFunction(responseData.message || `Task created successfully! (ID: ${responseData.taskId})`, false); 

    } catch (error: any) {
        console.error(`[handleCreateTaskCommand] Error creating task for user ${discordUserId}:`, error.response?.data || error.message);
        const backendErrorMessage = error.response?.data?.message;
        let replyMessage = "Sorry, I couldn\'t create the task. Please check your input and permissions, and try again.";
        if (backendErrorMessage && typeof backendErrorMessage === 'string') {
            replyMessage = `Error from Labnex: ${backendErrorMessage}`;
        }
        await replyFunction(replyMessage, true);
    }
}

export async function handleTaskInfoCommand(
    discordUserId: string,
    taskIdentifier: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>,
    interaction?: CommandInteraction<CacheType> 
) {
    console.log(`[handleTaskInfoCommand] Handling for user ${discordUserId}, Task Identifier: ${taskIdentifier}`);
    if (interaction?.channel &&
        ('sendTyping' in interaction.channel) &&
        typeof interaction.channel.sendTyping === 'function') {
        try {
            await interaction.channel.sendTyping();
        } catch (e) { console.warn("Typing indicator failed in handleTaskInfoCommand", e); }
    }
    try {
        const encodedTaskIdentifier = encodeURIComponent(taskIdentifier);
        const response = await axios.get<LabnexTaskDetails>(
            `${LABNEX_API_URL}/integrations/discord/task-details/${encodedTaskIdentifier}?discordUserId=${discordUserId}`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET }
            }
        );

        const task = response.data;
        if (!task) {
            await replyFunction('Could not retrieve task details.', true);
            return;
        }

        let message = `**Task Details: ${task.title}** (ID: ${task.id}${task.taskReferenceId ? `, Ref: ${task.taskReferenceId}` : ''})\n`;
        message += `Project: ${task.project.name} (${task.project.projectCode || task.project.id})\n`;
        message += `Status: ${task.status} | Priority: ${task.priority}\n`;
        message += `Description: ${task.description || 'N/A'}\n`;
        if (task.dueDate) message += `Due Date: ${new Date(task.dueDate).toLocaleDateString()}\n`;
        if (task.reporter) message += `Reporter: ${task.reporter.name}\n`;
        if (task.assignee) {
            message += `Assignee: ${task.assignee.name}\n`;
        }
        message += `Created: ${new Date(task.createdAt).toLocaleString()} | Updated: ${new Date(task.updatedAt).toLocaleString()}`;

        await replyFunction(message);

    } catch (error: any) {
        console.error(`[handleTaskInfoCommand] Error fetching task info for ${taskIdentifier}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn\'t fetch the task details. Please ensure the identifier is correct, your account is linked, and you have permissions to view it.";
        await replyFunction(errorMessage, true);
    }
}

export async function handleUpdateTaskStatusCommand(interaction: CommandInteraction<CacheType>) {
    const getInteractionStringOption = (interaction: CommandInteraction<CacheType>, name: string, required: boolean): string | null => {
        const option = interaction.options.get(name, required);
        if (option && typeof option.value === 'string') return option.value;
        if (option && typeof option.value === 'number') return option.value.toString();
        if (option && typeof option.value === 'boolean') return option.value.toString();
        return null;
    };    

    const taskIdentifier = getInteractionStringOption(interaction, 'task_identifier', true);
    const newStatus = getInteractionStringOption(interaction, 'new_status', true);
    const discordUserId = interaction.user.id;

    if (!taskIdentifier || !newStatus) {
        await interaction.reply({ content: 'Task identifier and new status are required.', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: false }); 

    try {
        const encodedTaskIdentifier = encodeURIComponent(taskIdentifier);
        console.log(`[handleUpdateTaskStatusCommand] Attempting to update task "${encodedTaskIdentifier}" to status "${newStatus}" for user ${discordUserId}`);

        const response = await axios.put(
            `${LABNEX_API_URL}/integrations/discord/tasks/${encodedTaskIdentifier}/status`,
            { discordUserId, status: newStatus }, 
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );

        console.log('[handleUpdateTaskStatusCommand] API Response:', response.data);

        if (response.status === 200 && response.data.message) {
            await interaction.editReply(
                `Successfully updated task "${taskIdentifier}" to status: **${response.data.newStatus || newStatus}**.\n${response.data.message}`
            );
        } else {
            throw new Error(response.data.message || 'Failed to update task status. No specific message from server.');
        }

    } catch (error: any) {
        console.error(`[handleUpdateTaskStatusCommand] Error updating task "${taskIdentifier}" for user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || `Sorry, I couldn\'t update the task status. Please ensure the task identifier is correct, your account is linked, and you have permissions.`;
        await interaction.editReply(errorMessage);
    }
}

export async function handleGetTaskDetailsCommand(
    discordUserId: string,
    taskIdentifier: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleGetTaskDetailsCommand] Handling for user ${discordUserId}, Task Identifier: "${taskIdentifier}"`);

    if (!taskIdentifier) {
        await replyFunction("A task identifier (ID or part of the title) is required to get task details.", true);
        return;
    }

    try {
        const encodedTaskIdentifier = encodeURIComponent(taskIdentifier);
        const response = await axios.get<LabnexTaskDetails>(
            `${LABNEX_API_URL}/integrations/discord/task-details/${encodedTaskIdentifier}?discordUserId=${discordUserId}`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET }
            }
        );

        const task = response.data;
        if (!task) {
            await replyFunction('Could not retrieve task details for that identifier.', true);
            return;
        }

        let message = `**Task Details (via NLU): ${task.title}** (ID: ${task.id}${task.taskReferenceId ? `, Ref: ${task.taskReferenceId}` : ''})\n`;
        message += `Project: ${task.project.name} (${task.project.projectCode || task.project.id})\n`;
        message += `Status: ${task.status} | Priority: ${task.priority}\n`;
        message += `Description: ${task.description || 'N/A'}\n`;
        if (task.dueDate) message += `Due Date: ${new Date(task.dueDate).toLocaleDateString()}\n`;
        if (task.reporter) message += `Reporter: ${task.reporter.name}\n`;
        if (task.assignee) {
            message += `Assignee: ${task.assignee.name}\n`;
        }
        message += `Created: ${new Date(task.createdAt).toLocaleString()} | Updated: ${new Date(task.updatedAt).toLocaleString()}`;

        await replyFunction(message, false);

    } catch (error: any) {
        console.error(`[handleGetTaskDetailsCommand] Error fetching task info for "${taskIdentifier}":`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn\'t fetch details for that task. Please ensure the identifier is correct, your account is linked, and you have permissions.";
        await replyFunction(errorMessage, true);
    }
}

export async function handleListTasksCommand(
    discordUserId: string,
    projectIdentifier: string | null, 
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleListTasksCommand] Handling for user ${discordUserId}, Project Identifier: "${projectIdentifier || 'All/Default'}"`);

    if (!projectIdentifier) {
        await replyFunction("Which project\'s tasks would you like to see? Please specify a project name or ID.", true);
        return;
    }

    try {
        const apiResponse = await axios.get<LabnexTaskItem[]>(
            `${LABNEX_API_URL}/integrations/discord/project-tasks`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: {
                    discordUserId: discordUserId,
                    projectIdentifier: projectIdentifier 
                }
            }
        );

        const tasks = apiResponse.data;

        if (tasks && tasks.length > 0) {
            const tasksToShow = tasks.slice(0, 15); 
            const taskList = tasksToShow.map(task => 
                `- **${task.title}** (ID: ${task.id})\n  *Status:* ${task.status}, *Priority:* ${task.priority}`
            ).join('\n\n'); 
            
            let replyMessage = `**Tasks for project \"${projectIdentifier}\" (via NLU):**\n\n${taskList}`;
            if (tasks.length > tasksToShow.length) {
                replyMessage += `\n\n*Showing ${tasksToShow.length} of ${tasks.length} tasks. For a full list, please check Labnex.*`;
            }
            await replyFunction(replyMessage, false);
        } else {
            await replyFunction(`No tasks found for project \"${projectIdentifier}\", or you may not have access.`, true);
        }

    } catch (error: any) {
        console.error(`[handleListTasksCommand] Error fetching tasks for project ${projectIdentifier}, user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || `Sorry, I couldn\'t fetch tasks for project \"${projectIdentifier}\". Please ensure the name/ID is correct, your account is linked, and try again.`;
        await replyFunction(errorMessage, true);
    }
}

export async function handleUpdateTaskStatusCommandNLU(
    discordUserId: string,
    taskIdentifier: string,
    newStatus: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleUpdateTaskStatusCommandNLU] Handling for user ${discordUserId}, Task: "${taskIdentifier}", New Status: "${newStatus}"`);

    if (!taskIdentifier || !newStatus) {
        await replyFunction("Task identifier and new status are required to update a task.", true);
        return;
    }

    try {
        const encodedTaskIdentifier = encodeURIComponent(taskIdentifier);
        console.log(`[handleUpdateTaskStatusCommandNLU] Attempting to update task "${encodedTaskIdentifier}" to status "${newStatus}" for user ${discordUserId}`);

        const response = await axios.put(
            `${LABNEX_API_URL}/integrations/discord/tasks/${encodedTaskIdentifier}/status`,
            { discordUserId, status: newStatus }, 
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );

        console.log('[handleUpdateTaskStatusCommandNLU] API Response:', response.data);

        if (response.status === 200 && response.data.message) {
            await replyFunction(
                `Successfully updated task "${taskIdentifier}" to status: **${response.data.newStatus || newStatus}** (via NLU).\n${response.data.message}`
            );
        } else {
            throw new Error(response.data.message || 'Failed to update task status. No specific message from server.');
        }

    } catch (error: any) {
        console.error(`[handleUpdateTaskStatusCommandNLU] Error updating task "${taskIdentifier}" for user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || `Sorry, I couldn\'t update the task status. Please ensure the task identifier is correct, your account is linked, and you have permissions.`;
        await replyFunction(errorMessage, true);
    }
} 