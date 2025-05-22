# Notes & Snippets via Discord Bot

This document explains how to use the Labnex Discord Bot to create and manage notes and code snippets using slash commands.

## Prerequisites

-   Labnex Bot is active on your Discord server.
-   Your Labnex account is linked to your Discord account (via `/linkaccount`).
-   You have permissions to create notes and snippets in Labnex.

## Adding a Note

Use the `/addnote` command.

**Usage:**

`/addnote title:"Your Note Title" body:"The content of your note."`

-   `title`: (Required) The title for your note.
-   `body`: (Required) The main content of your note.

**Example:**

`/addnote title:"Project Alpha Ideas" body:"- Consider adding a caching layer. - Refactor the user authentication module."`

## Adding a Code Snippet

Use the `/addsnippet` command.

**Usage:**

`/addsnippet language:<language_name> title:"Your Snippet Title" code:"your_code_here"`

-   `language`: (Required) Specify the programming language (e.g., `javascript`, `python`, `css`). This helps with syntax highlighting in the Labnex web application.
-   `title`: (Required) Title for your snippet.
-   `code`: (Required) The actual code. For multi-line code entered into the Discord command option, ensure your input method preserves newlines (Discord typically handles this for slash command string options).

**Example:**

`/addsnippet language:javascript title:"Basic Logger" code:"function logMessage(level, message) { console.log(`[${level.toUpperCase()}]: ${message}`); }"`

## Viewing Notes & Snippets

-   **`/notes`**: Lists your recent notes.
-   **`/snippets`**: Lists your recent snippets.

## Important Considerations

-   **Character Limits**: Discord has character limits for messages. For very long notes or complex code snippets, creating them through the web app might be more suitable.
-   **Bot-Specific Syntax**: While these are standard slash commands, always refer to the bot's `/help` command for detailed option descriptions on your server.
-   **Permissions**: Ensure the bot has permissions to read messages and send replies in the channel you're using.

Using the Discord bot for quick notes and snippets can be a great time-saver, especially when you're already in Discord discussing project-related matters. 