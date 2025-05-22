# Available Bot Commands

This page lists the common slash commands available for the Labnex Discord Bot. All commands are invoked using the `/` prefix.

## General Commands

-   **`/help`**
    -   Displays a list of available commands and their descriptions.
    -   Usage: `/help`

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
    -   *(Note: Other update operations like changing assignee or priority via `/updatetask` may be added in the future.)*

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
        *   `language`: Programming language of the snippet (e.g., `javascript`, `python`).
        *   `title`: Title of the snippet.
        *   `code`: The actual code for the snippet.
    -   Usage: `/addsnippet language:python title:"API Fetch Utility" code:"import requests..."`

-   **`/notes`**
    -   Lists your recent notes.
    -   Usage: `/notes`

-   **`/snippets`**
    -   Lists your recent snippets.
    -   Usage: `/snippets`

## Important Notes

-   Command availability and behavior might depend on your permissions within Labnex and the bot's configuration on the server.
-   For command options that accept strings with spaces (like titles or descriptions), ensure you enclose the value in quotes if it contains spaces, or rely on Discord's handling of separate arguments for options.
-   The bot will usually provide feedback or error messages directly in the channel or via DM.

*This list reflects currently defined commands. Use `/help` for the most up-to-date command list available to you on your server.* 