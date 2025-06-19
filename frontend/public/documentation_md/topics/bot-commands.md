# Available Bot Commands

This page lists the common slash commands available for the Labnex Discord Bot. All commands are invoked using the `/` prefix.

## General Commands

-   **`/help`**
    -   Displays a comprehensive list of available commands with detailed descriptions, organized by category.
    -   Usage: `/help`

-   **`/ping`**
    -   Checks if the bot is online and responsive. Useful for testing bot connectivity.
    -   Usage: `/ping`

-   **`/linkaccount`**
    -   Initiates the process to link your Discord account with your Labnex account.
    -   Follow the bot's DM instructions for a secure linking URL.
    -   Usage: `/linkaccount`

## Project & Task Management Commands

-   **`/projects`**
    -   Lists Labnex projects you have access to.
    -   Usage: `/projects`

-   **`/tasks`**
    -   Lists tasks. Can be filtered by project.
    -   Usage: `/tasks [project:<project_name_or_id>]`
    -   Example: `/tasks project:WebApp`
    -   If `project` is omitted, it may list tasks from a default project or all accessible tasks based on bot configuration.

-   **`/createtask`**
    -   Creates a new task in the specified project.
    -   **Required Options**:
        *   `project`: Project name or ID where the task will be created.
        *   `title`: Title of the task.
    -   **Optional Options**:
        *   `description`: Detailed description of the task.
        *   `priority`: Priority of the task (Choices: `Low`, `Medium`, `High`).
        *   `status`: Status of the task (Choices: `To Do`, `In Progress`, `Blocked`, `In Review`, `Done`, `Cancelled`).
        *   `due_date`: Due date in YYYY-MM-DD format (e.g., `2024-12-31`).
    -   Usage Example: `/createtask project:WebApp title:"Implement User Login" description:"Full login flow with JWT" priority:High status:"To Do"`

-   **`/taskinfo`**
    -   Displays detailed information about a specific task.
    -   **Required Options**:
        *   `task_identifier`: The ID or unique reference of the task.
    -   Usage: `/taskinfo task_identifier:TASK-123`

-   **`/updatetask status`**
    -   Updates the status of a specific task.
    -   **Required Options**:
        *   `task_identifier`: The ID or unique reference of the task to update.
        *   `new_status`: The new status for the task (Choices: `To Do`, `In Progress`, `Blocked`, `In Review`, `Done`, `Cancelled`).
    -   Usage: `/updatetask status task_identifier:TASK-123 new_status:"In Progress"`

## Notes & Snippets Commands

-   **`/addnote`**
    -   Creates a new note.
    -   **Required Options**:
        *   `title`: Title of the note.
        *   `body`: Content of the note.
    -   Usage: `/addnote title:"Meeting Recap" body:"Key discussion points..."`

-   **`/addsnippet`**
    -   Creates a new code snippet.
    -   **Required Options**:
        *   `language`: Programming language of the snippet (e.g., `javascript`, `python`, `css`).
        *   `title`: Title of the snippet.
        *   `code`: The actual code for the snippet.
    -   Usage: `/addsnippet language:javascript title:"Basic Logger" code:"function logMessage(level, message) { console.log(\`[\${level.toUpperCase()}]: \${message}\`); }"`

-   **`/notes`**
    -   Lists your recent notes.
    -   Usage: `/notes`

-   **`/snippets`**
    -   Lists your recent snippets.
    -   Usage: `/snippets`

## Support Ticket System

-   **`/ticket create`**
    -   Creates a new support ticket channel for assistance.
    -   Usage: `/ticket create`
    -   This creates a private channel where you can get help from support staff.

-   **`/ticket close`**
    -   Closes the current ticket channel.
    -   **Optional Options**:
        *   `reason`: The reason for closing the ticket.
    -   Usage: `/ticket close reason:"Issue resolved"`

-   **`/ticket delete`**
    -   **[STAFF ONLY]** Permanently deletes the current ticket channel.
    -   Usage: `/ticket delete`
    -   *Note: Only available to staff members with appropriate permissions.*

-   **`/ticket escalate`**
    -   Escalates a ticket to higher-level staff for additional assistance.
    -   **Required Options**:
        *   `reason`: Reason for escalating the ticket.
    -   Usage: `/ticket escalate reason:"Complex technical issue requiring senior developer"`

## Server Management Commands (Admin Only)

*These commands are restricted to server administrators and require Administrator permissions.*

-   **`/sendembed`**
    -   Sends a custom embedded message to a specified channel.
    -   **Required Options**:
        *   `title`: The title of the embed message.
        *   `description`: The main content (description) of the embed message.
    -   **Optional Options**:
        *   `channel`: The channel to send the embed to (defaults to current channel).
        *   `color`: Hex color code for the embed (e.g., `#0099ff`).
        *   `footer`: Footer text for the embed.
    -   Usage: `/sendembed title:"Announcement" description:"Server maintenance tonight at 10 PM EST" color:#ff6b35`

-   **`/sendrules`**
    -   Sends the pre-formatted Labnex server rules embed with reaction button.
    -   Usage: `/sendrules`

-   **`/sendinfo`**
    -   Sends the pre-formatted Labnex server information embed.
    -   Usage: `/sendinfo`

-   **`/sendwelcome`**
    -   Sends the pre-formatted welcome embed for new members.
    -   Usage: `/sendwelcome`

-   **`/sendroleselect`**
    -   Posts the role selection embed (Developer/Tester roles) with emoji reactions.
    -   Usage: `/sendroleselect`
    -   Members can react to automatically get assigned Developer or Tester roles.

## Natural Language Commands

In addition to slash commands, you can interact with the bot using natural language by mentioning it:

-   **Project Management**: `@Labnex AI create project for [description]`
-   **Task Information**: `@Labnex AI show task [ID]`
-   **General Help**: `@Labnex AI what can you help me with?`
-   **Status Inquiries**: `@Labnex AI what's my project status?`

## Important Notes

-   **Permissions**: Command availability depends on your permissions within Labnex and the bot's configuration on the server.
-   **Account Linking**: Most project and task-related commands require your Discord account to be linked with your Labnex account via `/linkaccount`.
-   **Character Limits**: Discord has character limits for messages. For very long notes or complex code snippets, creating them through the web app might be more suitable.
-   **Admin Commands**: Server management commands require Administrator permissions and are disabled in DMs.
-   **Bot Feedback**: The bot will provide feedback or error messages directly in the channel or via DM for most commands.

## Troubleshooting

-   **Bot not responding?** Try `/ping` to check if the bot is online.
-   **Commands not available?** Ensure the bot has proper permissions and your account is linked.
-   **Ticket system issues?** Contact server administrators if ticket commands are not working.

*This list reflects the current command set. Use `/help` for the most up-to-date command list available to you on your server.* 