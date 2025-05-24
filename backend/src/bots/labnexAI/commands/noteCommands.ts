import axios from 'axios';
import { CommandInteraction, CacheType } from 'discord.js';
import { LabnexNote } from '../types/labnexAI.types';
import { getInteractionStringOption } from '../utils/discordHelpers';

const LABNEX_API_URL = process.env.LABNEX_API_URL;
const LABNEX_API_BOT_SECRET = process.env.LABNEX_API_BOT_SECRET;

export async function handleAddNoteCommandNLU(
    options: {
        discordUserId: string;
        title: string;
        content: string;
        projectIdentifier?: string | null; 
    },
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    const { discordUserId, title, content, projectIdentifier } = options;
    console.log(`[handleAddNoteCommandNLU] Handling for user ${discordUserId}. Title: "${title}"`);

    if (!title || !content) {
        await replyFunction("Both title and content are required to add a note.", true);
        return;
    }

    try {
        const apiPayload: any = {
            discordUserId,
            title,
            content,
        };
        if (projectIdentifier) {
            console.log(`[handleAddNoteCommandNLU] Note project linking via NLU for project "${projectIdentifier}" - currently ignored by API endpoint for NLU.`);
        }

        const response = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/notes`,
            apiPayload,
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );
        await replyFunction(response.data.message || `Note "${title}" created successfully! (via NLU)`);
    } catch (error: any) {
        console.error(`[handleAddNoteCommandNLU] Error creating note for user ${discordUserId}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn't create your note. Please try again later.";
        await replyFunction(errorMessage, true);
    }
}

export async function handleListNotesCommandNLU(
    discordUserId: string,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void | any>
) {
    console.log(`[handleListNotesCommandNLU] Handling for user ${discordUserId} (NLU)`);
    try {
        const response = await axios.get<{ notes: LabnexNote[], message?: string }>(
            `${LABNEX_API_URL}/integrations/discord/notes`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: { discordUserId: discordUserId }
            }
        );

        const notes = response.data.notes;
        if (notes && notes.length > 0) {
            let notesMessage = '**Your Recent Notes (via NLU):**\n\n';
            notes.slice(0, 10).forEach(note => { 
                notesMessage += `**${note.title}** (ID: ${note.id})\n`;
                const contentSnippet = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
                notesMessage += `> ${contentSnippet.replace(/\n/g, '\n> ')}\n`;
                if (note.project) {
                    notesMessage += `*Project: ${note.project.name}*\n`;
                }
                notesMessage += `*Created: ${new Date(note.createdAt).toLocaleDateString()}*\n\n`;
            });
            if (notes.length > 10) {
                notesMessage += `\n*Showing 10 of ${notes.length} notes. View all in Labnex.*`;
            }
            await replyFunction(notesMessage, false);
        } else {
            await replyFunction(response.data.message || "You don\'t have any notes yet. Use `/addnote` or tell me to add one!", true);
        }
    } catch (error: any) {
        console.error(`[handleListNotesCommandNLU] Error fetching notes for user ${discordUserId}:`, error.response?.data || error.message);
        let errorMessage = "Sorry, I couldn't fetch your notes. Please try again later.";
        if (error.response?.status === 404 && error.response?.data?.message?.includes('not linked')) {
             errorMessage = "Your Discord account is not linked to a Labnex account. Please use `/linkaccount` first.";
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        await replyFunction(errorMessage, true);
    }
}

export async function handleAddNoteSlashCommand(interaction: CommandInteraction<CacheType>) {
    const title = getInteractionStringOption(interaction, 'title', true);
    const body = getInteractionStringOption(interaction, 'body', true);

    if (!title || !body) {
        await interaction.reply({ content: "Both title and body are required to add a note.", ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: false });
    try {
        const response = await axios.post(
            `${LABNEX_API_URL}/integrations/discord/notes`,
            {
                discordUserId: interaction.user.id,
                title: title,
                content: body, 
            },
            { headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET } }
        );
        await interaction.editReply(response.data.message || `Note "${title}" created successfully!`);
    } catch (error: any) {
        console.error(`[addnote slash] Error creating note for user ${interaction.user.id}:`, error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Sorry, I couldn't create your note. Please try again later.";
        await interaction.editReply({ content: errorMessage });
    }
}

export async function handleListNotesSlashCommand(interaction: CommandInteraction<CacheType>) {
    await interaction.deferReply({ ephemeral: false });
    try {
        const response = await axios.get<{ notes: LabnexNote[], message?: string }>(
            `${LABNEX_API_URL}/integrations/discord/notes`,
            {
                headers: { 'x-bot-secret': LABNEX_API_BOT_SECRET },
                params: { discordUserId: interaction.user.id }
            }
        );

        const notes = response.data.notes;
        if (notes && notes.length > 0) {
            let notesMessage = '**Your Recent Notes:**\n\n';
            notes.slice(0, 10).forEach(note => {
                notesMessage += `**${note.title}** (ID: ${note.id})\n`;
                const contentSnippet = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
                notesMessage += `> ${contentSnippet.replace(/\n/g, '\n> ')}\n`;
                if (note.project) {
                    notesMessage += `*Project: ${note.project.name}*\n`;
                }
                notesMessage += `*Created: ${new Date(note.createdAt).toLocaleDateString()}*\n\n`;
            });
            if (notes.length > 10) {
                notesMessage += `\n*Showing 10 of ${notes.length} notes. View all in Labnex.*`;
            }
            await interaction.editReply(notesMessage);
        } else {
            await interaction.editReply(response.data.message || "You don't have any notes yet. Use `/addnote` to create one!");
        }
    } catch (error: any) {
        console.error(`[notes slash] Error fetching notes for user ${interaction.user.id}:`, error.response?.data || error.message);
        let errorMessage = "Sorry, I couldn't fetch your notes. Please try again later.";
        if (error.response?.status === 404 && error.response?.data?.message?.includes('not linked')) {
             errorMessage = "Your Discord account is not linked to a Labnex account. Please use `/linkaccount` first.";
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        await interaction.editReply({ content: errorMessage });
    }
}

export { handleAddNoteCommandNLU as handleAddNoteCommand, handleListNotesCommandNLU as handleListNotesCommand }; 