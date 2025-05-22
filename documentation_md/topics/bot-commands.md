# Available Bot Commands

This page lists the common commands available for the Labnex Discord Bot. Please note that command prefixes (e.g., `/`, `!labnex`, `?`) might vary based on server configuration. The examples below will use `/` as a generic prefix.

## General Commands

-   **`/help` or `/labnex help`**
    -   Displays a list of available commands or categories of commands.
    -   Usage: `/help [command_category]`

-   **`/linkaccount`**
    -   Initiates the process to link your Discord account with your Labnex account.
    -   Follow the bot's DM instructions.

## Project & Task Management Commands

-   **`/projects`**
    -   Lists projects you have access to.
    -   Usage: `/projects`

-   **`/tasks [project_name_or_id]`**
    -   Lists tasks for a specified project. If no project is specified, it might list tasks from a default or recently active project.
    -   Usage: `/tasks project:MyProject` or `/tasks status:open project:MyProject`

-   **`/createtask [project_name_or_id] <task_title>`**
    -   Creates a new task in the specified project.
    -   Usage: `/createtask project:WebApp title:Implement login page`
    -   Additional parameters like `description`, `assignee`, `priority` might be supported.

-   **`/taskinfo <task_id_or_keyword>`**
    -   Displays detailed information about a specific task.
    -   Usage: `/taskinfo task:123` or `/taskinfo keyword:LoginBug`

-   **`/updatetask <task_id> <field:value...>`**
    -   Updates a task's properties (e.g., status, assignee, description).
    -   Usage: `/updatetask task:123 status:in-progress assignee:@user`

## Notes & Snippets Commands

-   **`/addnote <title> <body>`**
    -   Creates a new note.
    -   Usage: `/addnote title:Meeting Ideas body:Discuss new features...`

-   **`/addsnippet <language> <title> <code>`**
    -   Creates a new code snippet.
    -   Usage: `/addsnippet lang:js title:Helper Function code:\`\`\`function greet() { console.log(\"Hello!\"); }\`\`\``

-   **`/notes`**
    -   Lists your recent notes.
    -   Usage: `/notes`

-   **`/snippets`**
    -   Lists your recent snippets.
    -   Usage: `/snippets`

## Important Notes

-   Command availability might depend on your permissions within Labnex and the bot's configuration on the server.
-   For commands requiring multiple arguments (like titles with spaces), use quotes: `/createtask project:MyProject title:\"Design new user interface\"`
-   The bot will usually provide feedback or error messages directly in the channel or via DM.

*This list is not exhaustive and may be updated as new features are added to the bot. Always use `/help` for the most current command list on your server.* 