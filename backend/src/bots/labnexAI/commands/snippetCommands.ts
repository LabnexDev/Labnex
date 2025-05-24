import axios from 'axios';
import { CommandInteraction, CacheType } from 'discord.js';
import { LabnexSnippet } from '../types/labnexAI.types';
import { getInteractionStringOption } from '../utils/discordHelpers';

const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

export async function handleListSnippetsCommandNLU(
    discordUserId: string,
    language: string | null,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleListSnippetsCommandNLU] Handling for user ${discordUserId}. Language filter: ${language || 'None'}`);

    try {
        const params: any = { discordUserId };
        if (language) {
            params.language = language;
        }

        const response = await axios.get<{ snippets: LabnexSnippet[], message?: string }>(
            `${LABNEX_API_URL}/integrations/discord/snippets`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: params
            }
        );

        const snippets = response.data.snippets;
        if (snippets && snippets.length > 0) {
            let snippetsMessage = `**Your Recent Code Snippets${language ? ` for language \"${language}\"` : ''} (via NLU):**\n\n`;
            snippets.slice(0, 5).forEach(snippet => {
                snippetsMessage += `**${snippet.title}** (ID: ${snippet.id}) - Language: \`${snippet.language}\`\n`;
                if (snippet.description) {
                    snippetsMessage += `> ${snippet.description.substring(0, 100)}${snippet.description.length > 100 ? '...' : ''}\n`;
                }
                if (snippet.project) {
                    snippetsMessage += `*Project: ${snippet.project.name}*\n`;
                }
                snippetsMessage += `*Created: ${new Date(snippet.createdAt).toLocaleDateString()}*\n\n`;
            });
            if (snippets.length > 5) {
                snippetsMessage += `\n*Showing 5 of ${snippets.length} snippets. View all in Labnex.*`;
            }
            await replyFunction(snippetsMessage, false);
        } else {
            await replyFunction(response.data.message || `No snippets found${language ? ` for language \"${language}\"` : ''}. Use \`/addsnippet\` or tell me to create one!`, true);
        }
    } catch (error: any) {
        console.error(`[handleListSnippetsCommandNLU] Error fetching snippets for user ${discordUserId}:`, error.response?.data || error.message);
        let errorMessage = "Sorry, I couldn't fetch your snippets. Please try again later.";
        if (error.response?.status === 404 && error.response?.data?.message?.includes('not linked')) {
            errorMessage = "Your Discord account is not linked to a Labnex account. Please use \`/linkaccount\` first.";
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        await replyFunction(errorMessage, true);
    }
}

export async function handleCreateSnippetCommandNLU(
    options: {
        discordUserId: string;
        title: string;
        language: string;
        code: string;
        projectIdentifier?: string | null;
    },
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    const { discordUserId, title, language, code, projectIdentifier } = options;
    console.log(`[handleCreateSnippetCommandNLU] Handling for user ${discordUserId}. Title: "${title}", Language: "${language}"`);

    if (!title || !language || !code) {
        await replyFunction("Title, language, and code are required to add a snippet.", true);
        return;
    }

    try {
        const apiPayload: any = {
            discordUserId,
            title,
            language,
            code,
        };
        if (projectIdentifier) {
            console.log(`[handleCreateSnippetCommandNLU] Snippet project linking via NLU for project "${projectIdentifier}" - currently ignored by API endpoint for NLU.`);
        }

        const response = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/snippets`,
            apiPayload,
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );
        await replyFunction(response.data.message || `Snippet "${title}" created successfully! (via NLU)`);
    } catch (error: any) {
        console.error(`[handleCreateSnippetCommandNLU] Error creating snippet for user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn't create your snippet. Please try again later.";
        await replyFunction(errorMessage, true);
    }
}

export async function handleAddSnippetSlashCommand(interaction: CommandInteraction<CacheType>) {
    const language = getInteractionStringOption(interaction, 'language', true);
    const title = getInteractionStringOption(interaction, 'title', true);
    const code = getInteractionStringOption(interaction, 'code', true);

    if (!language || !title || !code) {
        await interaction.reply({ content: "Language, title, and code are required to add a snippet.", ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: false });
    try {
        const response = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/snippets`,
            {
                discordUserId: interaction.user.id,
                title: title,
                language: language,
                code: code,
            },
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );
        await interaction.editReply(response.data.message || `Snippet "${title}" created successfully!`);
    } catch (error: any) {
        console.error(`[addsnippet slash] Error creating snippet for user ${interaction.user.id}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn't create your snippet. Please try again later.";
        await interaction.editReply({ content: errorMessage });
    }
}

export async function handleListSnippetsSlashCommand(interaction: CommandInteraction<CacheType>) {
    await interaction.deferReply({ ephemeral: false });
    try {
        const response = await axios.get<{ snippets: LabnexSnippet[], message?: string }>(
            `${LABNEX_API_URL}/integrations/discord/snippets`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: { discordUserId: interaction.user.id }
            }
        );
        const snippets = response.data.snippets;
        if (snippets && snippets.length > 0) {
            let snippetsMessage = '**Your Recent Code Snippets:**\n\n';
            snippets.slice(0, 5).forEach(snippet => {
                snippetsMessage += `**${snippet.title}** (ID: ${snippet.id}) - Language: \`${snippet.language}\`\n`;
                if (snippet.description) {
                     snippetsMessage += `> ${snippet.description.substring(0,100)}${snippet.description.length > 100 ? '...' : ''}\n`;
                }
                if (snippet.project) {
                    snippetsMessage += `*Project: ${snippet.project.name}*\n`;
                }
                snippetsMessage += `*Created: ${new Date(snippet.createdAt).toLocaleDateString()}*\n\n`;
            });
             if (snippets.length > 5) {
                snippetsMessage += `\n*Showing 5 of ${snippets.length} snippets. View all in Labnex.*`;
            }
            await interaction.editReply(snippetsMessage);
        } else {
            await interaction.editReply(response.data.message || "You don't have any snippets yet. Use `/addsnippet` to create one!");
        }
    } catch (error: any) {
        console.error(`[snippets slash] Error fetching snippets for user ${interaction.user.id}:`, error.response?.data || error.message);
        let errorMessage = "Sorry, I couldn't fetch your snippets. Please try again later.";
         if (error.response?.status === 404 && error.response?.data?.message?.includes('not linked')) {
             errorMessage = "Your Discord account is not linked to a Labnex account. Please use \`/linkaccount\` first.";
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        await interaction.editReply({ content: errorMessage });
    }
}

export { handleListSnippetsCommandNLU as handleListSnippetsCommand, handleCreateSnippetCommandNLU as handleCreateSnippetCommand }; 