# Notes & Snippets via Discord Bot

This document explains how to use the Labnex Discord Bot to create and manage notes and code snippets.

## Prerequisites

-   Labnex Bot is active on your Discord server.
-   Your Labnex account is linked to your Discord account.
-   You have permissions to create notes and snippets in Labnex.

## Adding a Note

Use a command like `/addnote` or `/createnote` (verify with `/help`).

**Basic Usage:**

```
/addnote title:"My Quick Note" body:"This is the content of my note."
```

-   `title:"My Quick Note"`: The title for your note. Use quotes for multi-word titles.
-   `body:"This is the content..."`: The main content of your note. Quotes are essential if the body has spaces or special characters.

**Example:**

```
/addnote title:"Meeting Recap" body:"Key points from today's stand-up: Feature X is on track. Blocked by API issue on Feature Y."
```

**Optional Parameters:**

Some bots might support tagging or categorizing notes.

-   `tags:"work, important, meeting"`

**Example with Tags:**

```
/addnote title:"API Endpoint Ideas" body:"Consider a /status endpoint for services." tags:"api, ideas, backend"
```

## Adding a Code Snippet

Use a command like `/addsnippet` or `/createsnippet`.

**Basic Usage:**

```
/addsnippet language:<language_name> title:"My Snippet" code:"your code here"
```

-   `language:<language_name>`: Specify the programming language (e.g., `javascript`, `python`, `css`). This helps with syntax highlighting in the Labnex app.
-   `title:"My Snippet"`: Title for your snippet.
-   `code:"your code here"`: The actual code. For multi-line code, you might need to use Discord's code block formatting within the command if the bot supports it, or ensure your bot handles newlines correctly. Often, it's easier to paste code directly if the bot supports multi-line input for the code parameter or use an external paste service link if the bot can fetch from it.

**Example (Single Line Code):**

```
/addsnippet language:python title:"Simple Print" code:"print('Hello, Labnex!')"
```

**Example (Conceptual Multi-line, bot support dependent):**

To add multi-line code, the bot might require you to use specific formatting or separate commands. Check the bot's `/help addsnippet`.

One common way bots handle multi-line input is via Discord's built-in code blocks if the command is designed to parse them:

```
/addsnippet language:javascript title:"Greeting Function" code:
\`\`\`javascript
function greet(name) {
  return `Hello, ${name}!`;
}
\`\`\`
```
*(The actual execution of this depends heavily on the bot's parsing capabilities. Simple bots might require the code to be a single string, potentially with escaped newlines `\n`)*

## Viewing Notes & Snippets

-   **`/notes`**: Lists your recent notes.
-   **`/snippets`**: Lists your recent snippets.
-   **`/searchnotes <keyword>`**: Search your notes.
-   **`/searchsnippets <keyword> [language:lang]`**: Search your snippets, optionally filtering by language.

## Important Considerations

-   **Character Limits**: Discord has character limits for messages. For very long notes or complex code snippets, creating them through the web app might be more suitable.
-   **Bot-Specific Syntax**: The exact command names and parameter syntax (`:`, `=`, etc.) can vary. Always refer to the bot's `/help` command.
-   **Permissions**: Ensure the bot has permissions to read messages and send replies in the channel you're using.

Using the Discord bot for quick notes and snippets can be a great time-saver, especially when you're already in Discord discussing project-related matters. 