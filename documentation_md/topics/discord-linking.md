## Linking Your Discord Account to Labnex

Integrating your Labnex account with Discord allows you to receive notifications and use Labnex bot commands directly within your Discord server. This enhances collaboration and keeps you updated on project activities without needing to switch applications.

### Prerequisites

*   A Labnex account (see "Account Creation" if you don't have one).
*   A Discord account.
*   The Labnex AI Bot must be present on a Discord server you are part of.

### Steps to Link Your Account

1.  **Initiate Linking from Discord**:
    *   In any channel where the Labnex AI Bot is present, type the command:
        ```
        !labnex link-account
        ```
    *   The bot will acknowledge your request and state that it will send you a Direct Message (DM) with a unique linking URL.

2.  **Check Your Discord DMs**:
    *   You will receive a DM from the Labnex AI Bot.
    *   This message will contain a unique URL. This URL is time-sensitive and typically expires in 15 minutes.
    *   The message will also confirm the Discord ID and username that the link is intended for.

3.  **Open the Linking URL in Your Browser**:
    *   Click the unique URL provided in the DM. This will open a page in your Labnex web application.

4.  **Log in to Labnex (if not already logged in)**:
    *   If you are not already logged into Labnex in your browser, you will be prompted to log in with your Labnex credentials.
    *   Ensure you log in with the Labnex account you wish to associate with your Discord profile.

5.  **Confirm the Link**:
    *   After logging in (or if already logged in), you will see a confirmation page.
    *   This page will display your Labnex username and the Discord username it is about to be linked with.
    *   Review the details to ensure they are correct.
    *   Click the "Confirm Link" or "Link Account" button.

6.  **Confirmation**: 
    *   Upon successful linking, you should see a success message in the Labnex web application.
    *   The Labnex AI Bot might also send a confirmation message to your Discord DM.

Your Labnex and Discord accounts are now linked! You can start using features like `!labnex my tasks` and receive project notifications via Discord.

### Managing Linked Accounts

*   You can view and manage your linked Discord accounts in your Labnex User Settings under the "Integrations" tab.
*   From there, you can typically see which Discord account is linked and have the option to unlink it if needed.

### Troubleshooting

*   **Link expired?** If the URL from the bot has expired, simply run `!labnex link-account` again in Discord to generate a new one.
*   **Didn't receive a DM?** Ensure your Discord privacy settings allow DMs from server members or bots. Also, check that the Labnex AI Bot is not blocked.
*   **Wrong account linked?** If you accidentally linked the wrong Labnex or Discord account, go to your Labnex User Settings -> Integrations to unlink, and then repeat the linking process. 