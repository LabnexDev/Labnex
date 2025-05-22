# Creating Tasks via Discord Bot

This guide details how to create and manage project tasks using the Labnex Discord Bot.

## Prerequisites

-   The Labnex Bot is installed on your Discord server.
-   You have linked your Labnex account to your Discord account (usually via a `/linkaccount` command).
-   You have the necessary permissions in Labnex to create and manage tasks in the relevant projects.

## Creating a New Task

The primary command for creating a task is typically `/createtask` (or a similar command, check `/help`).

**Basic Usage:**

```
/createtask project:<project_name_or_id> title:"Your Task Title"
```

-   `project:<project_name_or_id>`: Specifies the project where the task will be created. You can often use the project's name or its unique ID.
-   `title:"Your Task Title"`: The title of the task. Use quotes if the title contains spaces.

**Example:**

```
/createtask project:"Frontend Development" title:"Implement user authentication UI"
```

**Adding More Details (Optional Parameters):**

Many bots allow you to add more details directly during task creation. The exact parameters can vary, so use the bot's `/help createtask` or similar command to see all options. Common optional parameters include:

-   `description:"Detailed description of the task."`
-   `assignee:<@discord_user or labnex_username>`
-   `priority:<high | medium | low>`
-   `duedate:<YYYY-MM-DD>`
-   `status:<todo | in-progress | etc.>` (Might default to a standard 'To Do' status)

**Example with More Details:**

```
/createtask project:"API Development" title:"Develop user endpoint" description:"Create GET and POST methods for /users." priority:high assignee:@JaneDoe
```

## Viewing Tasks

-   **`/tasks [project_name_or_id]`**: Lists tasks, often for a specific project or with filters.
    -   Example: `/tasks project:"Frontend Development" status:open`
-   **`/taskinfo <task_id>`**: Get details for a specific task.
    -   Example: `/taskinfo task:TASK-123`

## Updating Tasks

-   **`/updatetask <task_id> [field:value]`**: Modify an existing task.
    -   Example: `/updatetask task:TASK-123 status:in-progress assignee:@JohnSmith`
    -   Common fields to update: `title`, `description`, `assignee`, `status`, `priority`, `duedate`.

## Tips for Task Creation via Bot

-   **Use Project IDs**: If project names are long or ambiguous, using a project ID (if known/available) can be more reliable.
-   **Quoting**: Always use quotes for titles, descriptions, or any parameter value that contains spaces.
-   **Check Bot Feedback**: The bot will usually confirm if the task was created successfully or provide an error message if something went wrong.
-   **Default Project**: Some bots might allow setting a default project for your Discord session to avoid specifying it every time.

Refer to the `/help` command within your Discord server for the most accurate and up-to-date command syntax and available parameters for your Labnex Bot instance. 