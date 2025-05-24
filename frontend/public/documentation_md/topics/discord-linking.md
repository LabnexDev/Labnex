## Linking Your Discord Account to Labnex

Integrating your Labnex account with Discord allows you to receive notifications and use Labnex AI bot commands directly within your Discord server. This enhances collaboration and keeps you updated on project activities without needing to switch applications.

### Prerequisites

*   A Labnex account (see "Account Creation" if you don't have one).
*   A Discord account.
*   The Labnex AI Bot must be present on a Discord server you are part of.

### Steps to Link Your Account

1.  **Initiate Linking from Discord**:
    *   In any channel where the Labnex AI Bot is present, type the slash command:
        ```discord
        /linkaccount
        ```
    *   Alternatively, you might be able to use natural language, such as mentioning the bot and asking to link your account (e.g., `@Labnex AI link my account`).
    *   The bot will acknowledge your request and state that it will send you a Direct Message (DM) with a unique linking URL.

2.  **Check Your Discord DMs**:
    *   You will receive a DM from the Labnex AI Bot.
    *   This message will contain a unique URL that is time-sensitive and typically expires in **15 minutes**.
    *   The message will also confirm the Discord ID and username the link is intended for. Example:
        ```
        Hello! To link your Discord account with Labnex, please use the following unique link (expires in 15 minutes):
        https://labnexdev.github.io/Labnex/users/discord/link?token=your_unique_token&discord_id=your_discord_id&discord_username=YourDiscordTag
        
        If you did not request this, please ignore this message.
        ```

3.  **Open the Linking URL in Your Browser**:
    *   Click the unique URL provided in the DM. This will open a page in your Labnex web application.

4.  **Log in to Labnex (if not already logged in)**:
    *   If you are not already logged into Labnex in your browser, you will be prompted to log in with your Labnex credentials.
    *   Ensure you log in with the Labnex account you wish to associate with your Discord profile.

5.  **Confirm the Link on the Web Page**:
    *   After logging in (or if already logged in), you will see a confirmation page.
    *   This page will display the Discord User ID and Discord Username (e.g., YourDiscordTag#1234) that your Labnex account is about to be linked with.
    *   Review these details to ensure they are correct.
    *   Click the "**Confirm & Link Account**" button.

6.  **Confirmation**: 
    *   Upon successful linking, you will see a success message (toast notification) in the Labnex web application, and you will be redirected to your "Integrations" settings page.

Your Labnex and Discord accounts are now linked! You can start using features like `/projects` or asking the bot to `@Labnex AI list my tasks` and receive project notifications via Discord.

### Managing Linked Accounts

*   You can view and manage your linked Discord account in your Labnex **User Settings** under the **Integrations** tab.
*   From there, you can see which Discord account is linked (including username, ID, and linked date) and have the option to **Unlink** it if needed. Unlinking will require confirmation.

### Troubleshooting

*   **Link expired?** If the URL from the bot has expired, simply use the `/linkaccount` command again in Discord to generate a new one.
*   **Didn't receive a DM?** Ensure your Discord privacy settings allow DMs from server members or bots for that server. Also, check that the Labnex AI Bot is not blocked.
*   **Wrong account linked?** If you accidentally linked the wrong Labnex or Discord account, go to your Labnex User Settings -> Integrations to unlink the incorrect account, and then repeat the linking process. 