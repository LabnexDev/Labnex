import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CodeSnippet } from '../models/CodeSnippet';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { Project } from '../models/Project'; // If snippets can be linked to projects


const BOT_API_SECRET = process.env.LABNEX_API_BOT_SECRET;


// Renaming for clarity
export const createSnippetFromDiscordLegacy = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    // Assuming legacy command might send different fields or less structured data
    const { discordUserId, title, language, code, description, projectIdentifier } = req.body;

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !title || !language || !code) {
        return res.status(400).json({ message: 'Missing discordUserId, title, language, or code.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(404).json({ message: 'Discord account not linked.' });
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

        const newSnippet = new CodeSnippet({
            userId: labnexUserId,
            title,
            language,
            code,
            description,
            projectId,
        });
        await newSnippet.save();
        res.status(201).json({ message: 'Snippet created successfully via legacy endpoint.', snippetId: newSnippet._id });
    } catch (error) {
        console.error('Error creating snippet from Discord (Legacy):', error);
        res.status(500).json({ message: 'Server error while creating snippet.' });
    }
};

export const createSnippetForDiscordSlashCommand = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, title, language, code, description, projectIdentifier } = req.body; // description & projectIdentifier are optional

    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret.' });
    }
    if (!discordUserId || !title || !language || !code) {
        return res.status(400).json({ message: 'Missing discordUserId, title, language, or code.' });
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

        const newSnippet = new CodeSnippet({
            userId: labnexUserId,
            title,
            language,
            code,
            description, // Can be undefined
            projectId,   // Can be undefined
        });
        await newSnippet.save();
        res.status(201).json({ message: `Snippet "${title}" created successfully!`, snippetId: newSnippet._id });
    } catch (error) {
        console.error('Error creating snippet from Discord Slash Command:', error);
        res.status(500).json({ message: 'Server error while creating snippet.' });
    }
};

export const getSnippetsForDiscordUser = async (req: Request, res: Response) => {
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

        const userSnippets = await CodeSnippet.find({ userId: labnexUserId })
            .sort({ createdAt: -1 })
            .populate('projectId', 'name id') // Populate project name and id
            .limit(10); // Limit to recent 10 snippets for brevity

        // Map to the LabnexSnippet interface format expected by the bot
        const formattedSnippets = userSnippets.map(snippet => ({
            id: snippet._id.toString(),
            title: snippet.title,
            language: snippet.language,
            description: snippet.description,
            code: snippet.code, // Bot might choose to show a snippet of this
            createdAt: snippet.createdAt.toISOString(),
            project: snippet.projectId ? { 
                id: (snippet.projectId as any)._id.toString(), // TS safety
                name: (snippet.projectId as any).name
            } : undefined,
        }));

        res.status(200).json({ snippets: formattedSnippets });

    } catch (error) {
        console.error('Error fetching snippets for Discord user:', error);
        res.status(500).json({ message: 'Server error while fetching snippets.' });
    }
};

/**
 * @route   POST /api/integrations/discord/snippets
 * @desc    Called by the Discord bot to create a code snippet for a linked Discord user.
 * @access  Private (Bot authenticated by secret key)
 */
export const createSnippetFromDiscord = async (req: Request, res: Response) => {
    const providedSecret = req.headers['x-bot-secret'] as string;
    const { discordUserId, title, language, code, description, projectIdentifier } = req.body;

    if (!BOT_API_SECRET) {
        console.error('CRITICAL: LABNEX_API_BOT_SECRET is not configured on the server.');
        return res.status(500).json({ message: 'Server configuration error for bot actions.' });
    }
    if (providedSecret !== BOT_API_SECRET) {
        return res.status(401).json({ message: 'Unauthorized: Invalid bot secret for snippet creation.' });
    }

    if (!discordUserId || !title || !language || !code) {
        return res.status(400).json({ message: 'Missing discordUserId, title, language, or code.' });
    }

    try {
        const link = await UserDiscordLink.findOne({ discordUserId });
        if (!link) {
            return res.status(403).json({ message: 'Discord account not linked. Please use `!labnex link-account` first.' });
        }
        const labnexUserId = link.userId;

        let projectForSnippet: Types.ObjectId | undefined = undefined;
        if (projectIdentifier && typeof projectIdentifier === 'string') {
            let projectIdentityQuery;
            if (Types.ObjectId.isValid(projectIdentifier)) {
                projectIdentityQuery = { _id: new Types.ObjectId(projectIdentifier) };
            } else {
                const escapedIdentifier = projectIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                projectIdentityQuery = { name: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } };
            }

            const project = await Project.findOne({
                $and: [
                    projectIdentityQuery, // This is now a single condition object
                    { $or: [{ owner: labnexUserId }, { members: labnexUserId }] }
                ]
            });

            if (!project) {
                // Using a simple string concatenation for the message to avoid complex escaping issues for the tool
                return res.status(404).json({ message: 'Project "' + projectIdentifier + '" not found or you don\'t have access.' });
            }
            projectForSnippet = project._id;
        }

        const newSnippet = new CodeSnippet({
            userId: labnexUserId,
            title,
            description,
            language: language.toLowerCase(),
            code,
            projectId: projectForSnippet,
        });

        await newSnippet.save();
        const populatedSnippet = await CodeSnippet.findById(newSnippet._id).populate('projectId', 'name');
        
        res.status(201).json(populatedSnippet);

    } catch (error) {
        console.error('Error creating snippet from Discord:', error);
        res.status(500).json({ message: 'Server error while creating snippet from Discord.' });
    }
}; 