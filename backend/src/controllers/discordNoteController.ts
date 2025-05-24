import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Note } from '../models/Note';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { Project } from '../models/Project'; // If notes can be linked to projects
// import { User } from '../models/User'; // User model is not directly used in these functions

const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;

/**
 * @route   POST /api/integrations/discord/notes
 * @desc    Called by the Discord bot to create a new note.
 * @access  Private (Bot authenticated by secret key)
 */
export const createNoteFromDiscordLegacy = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, content, projectIdentifier } = req.body; // Assuming prefix command sends 'content'

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !content) {
        return res.status(400).json({ message: 'Missing discordUserId or content.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked.' });
        }
        const labnexUserId = link.userId;

        let projectId;
        if (projectIdentifier) {
            // Try to find project by ID or name
            const project = await Project.findOne({
                $and: [
                    { $or: [
                        { _id: Types.ObjectId.isValid(projectIdentifier) ? new Types.ObjectId(projectIdentifier) : null },
                        { name: projectIdentifier }
                    ]},
                    { $or: [{ owner: labnexUserId }, { members: labnexUserId }] }
                ]
            });
            if (!project) {
                return res.status(404).json({ message: `Project "${projectIdentifier}" not found or you don't have access.` });
            }
            projectId = project._id;
        }
        
        // For legacy, if title is not part of INote, we just save content
        // Now that INote has title, this legacy function might need adjustment or be deprecated.
        // Assuming for now, it still works by creating a note without an explicit title from bot,
        // or the bot using this would need to be updated.
        // For this refactor, let's assume it implies a title or uses a default.
        // Given the Note model update, it now *requires* a title.
        // This legacy function is now problematic if title isn't sent.
        // Let's assume prefix command will send title as part of content or a generic title is used.
        const noteTitle = "Note from Discord (Legacy)"; // Placeholder for required title

        const newNote = new Note({
            userId: labnexUserId,
            discordUserId, // Storing for reference/querying
            title: noteTitle, // Now required
            content,
            project: projectId,
        });
        await newNote.save();
        res.status(201).json({ message: 'Note created successfully via legacy endpoint.', noteId: newNote._id });
    } catch (error) {
        console.error('Error creating note from Discord (Legacy):', error);
        res.status(500).json({ message: 'Server error while creating note.' });
    }
};

export const createNoteForDiscordSlashCommand = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, title, content, projectIdentifier } = req.body; // projectIdentifier is optional

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !title || !content) {
        return res.status(400).json({ message: 'Missing discordUserId, title, or content.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked. Please use /linkaccount.' });
        }
        const labnexUserId = link.userId;

        let projectId;
        if (projectIdentifier) {
            const project = await Project.findOne({
                $and: [
                    { $or: [
                        { _id: Types.ObjectId.isValid(projectIdentifier) ? new Types.ObjectId(projectIdentifier) : null },
                        { name: projectIdentifier }
                    ]},
                    { $or: [{ owner: labnexUserId }, { members: labnexUserId }] }
                ]
            });
            if (!project) {
                return res.status(404).json({ message: `Project "${projectIdentifier}" not found or you don't have access.` });
            }
            projectId = project._id;
        }

        const newNote = new Note({
            userId: labnexUserId,
            discordUserId,
            title,
            content,
            project: projectId,
        });
        await newNote.save();
        res.status(201).json({ message: `Note "${title}" created successfully!`, noteId: newNote._id });
    } catch (error) {
        console.error('Error creating note from Discord Slash Command:', error);
        res.status(500).json({ message: 'Server error while creating note.' });
    }
};

export const getNotesForDiscordUser = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId } = req.query;

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || typeof discordUserId !== 'string') {
        return res.status(400).json({ message: 'Missing or invalid discordUserId in query parameters.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked. Please use /linkaccount.' });
        }
        const labnexUserId = link.userId;

        const userNotes = await Note.find({ userId: labnexUserId })
            .sort({ createdAt: -1 })
            .populate('project', 'name id') // Populate project name and id
            .limit(20); // Limit to recent 20 notes for brevity in bot

        // Map to the LabnexNote interface format expected by the bot
        const formattedNotes = userNotes.map(note => ({
            id: note._id.toString(),
            title: note.title,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            project: note.project ? { 
                id: (note.project as any)._id.toString(), // TS safety
                name: (note.project as any).name 
            } : undefined,
        }));
        
        res.status(200).json({ notes: formattedNotes });

    } catch (error) {
        console.error('Error fetching notes for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching notes.' });
    }
}; 