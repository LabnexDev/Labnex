import { Request, Response } from 'express';
import { Note, INote } from '../models/Note';
import { Project } from '../models/Project';
import { Types } from 'mongoose';
import { UserDiscordLink } from '../models/UserDiscordLink';
import { generateNoteContent } from '../bots/labnexAI/chatgpt.service';

// @desc    Get all notes for the authenticated user, optionally filtered by project
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { projectId } = req.query;

    try {
        const query: any = { userId };
        if (projectId && typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
            query.project = new Types.ObjectId(projectId);
        }

        const notes = await Note.find(query)
            .populate('project', 'name') // Populate project name if linked
            .sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error while fetching notes.' });
    }
};

// @desc    Create a new note for the authenticated user
// @route   POST /api/notes
// @access  Private
export const createNote = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const discordUserId = (req as any).user.discordUserId; // Assuming this might be on the user object or we fetch it
    const { content, projectId } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Note content cannot be empty.' });
    }

    try {
        let projectForNote: Types.ObjectId | undefined = undefined;
        let discordUserIdForNote: string = 'N/A'; // Fallback

        // If discordUserId is not directly on req.user, attempt to find it from UserDiscordLink
        // This part is speculative and depends on how user object is populated by auth middleware
        // For now, let's assume it could be missing and we need a robust way to handle it.
        // Or, if the web UI doesn't need to store discordUserId on the Note, this can be simplified.
        // For now, let's prioritize Labnex User ID (userId) and make discordUserId optional on the Note if created via web.

        const userLink = await UserDiscordLink.findOne({ userId: userId });
        if (userLink) {
            discordUserIdForNote = userLink.discordUserId;
        }

        if (projectId && typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found to link note.' });
            }
            // Check if user has access to this project
            const userIsOwner = project.owner.equals(userId);
            const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
            if (!userIsOwner && !userIsMember) {
                return res.status(403).json({ message: 'You do not have permission to link a note to this project.' });
            }
            projectForNote = project._id;
        }

        const newNote = new Note({
            userId,
            discordUserId: discordUserIdForNote, // Potentially from UserDiscordLink or a default/optional value
            content: content.trim(),
            project: projectForNote,
        });

        await newNote.save();
        // Populate project name for the response if linked
        const populatedNote = await Note.findById(newNote._id).populate('project', 'name');
        
        res.status(201).json(populatedNote);

    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error while creating note.' });
    }
};

// @desc    Update an existing note
// @route   PUT /api/notes/:noteId
// @access  Private
export const updateNote = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { noteId } = req.params;
    const { content, projectId } = req.body;

    if (!Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: 'Invalid note ID.' });
    }
    if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
        return res.status(400).json({ message: 'Note content cannot be empty.' });
    }

    try {
        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found.' });
        }
        if (note.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this note.' });
        }

        if (content !== undefined) {
            note.content = content.trim();
        }

        if (projectId !== undefined) {
            if (projectId === null || projectId === '') { // Allow unlinking
                note.project = undefined;
            } else if (typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
                const project = await Project.findById(projectId);
                if (!project) {
                    return res.status(404).json({ message: 'Project not found to link note.' });
                }
                const userIsOwner = project.owner.equals(userId);
                const userIsMember = project.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
                if (!userIsOwner && !userIsMember) {
                    return res.status(403).json({ message: 'You do not have permission to link this note to this project.' });
                }
                note.project = project._id;
            } else {
                return res.status(400).json({ message: 'Invalid project ID for linking.' });
            }
        }

        await note.save();
        const populatedNote = await Note.findById(note._id).populate('project', 'name');
        res.status(200).json(populatedNote);

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Server error while updating note.' });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:noteId
// @access  Private
export const deleteNote = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { noteId } = req.params;

    if (!Types.ObjectId.isValid(noteId)) {
        return res.status(400).json({ message: 'Invalid note ID.' });
    }

    try {
        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found.' });
        }
        if (note.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this note.' });
        }

        await note.deleteOne(); // Corrected from note.remove() which is deprecated
        res.status(200).json({ message: 'Note deleted successfully.' });

    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error while deleting note.' });
    }
};

// @desc    Create a new note with AI for the authenticated user
// @route   POST /api/notes/ai
// @access  Private
export const createNoteWithAI = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { prompt, projectId } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ message: 'AI prompt cannot be empty.' });
    }

    try {
        // 1. Generate note content using AI
        const aiGeneratedContent = await generateNoteContent(prompt.trim());

        if (aiGeneratedContent.startsWith('Error:') || aiGeneratedContent.startsWith("I'm sorry, but my connection to the OpenAI service is not configured")) {
            // If AI service returned an error message, forward it with a 500 or appropriate status
            return res.status(500).json({ message: aiGeneratedContent });
        }
        if (aiGeneratedContent === "The AI generated an empty response. Please try rephrasing your prompt.") {
             return res.status(400).json({ message: aiGeneratedContent });
        }

        // 2. Validate project if projectId is provided (similar to createNote)
        let projectForNote: Types.ObjectId | undefined = undefined;
        if (projectId && typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found to link note.' });
            }
            const userIsOwner = project.owner.equals(userId);
            // Ensure members is an array of ObjectIds before calling .some
            const userIsMember = Array.isArray(project.members) && project.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
            if (!userIsOwner && !userIsMember) {
                return res.status(403).json({ message: 'You do not have permission to link a note to this project.' });
            }
            projectForNote = project._id;
        }
        
        // 3. Find Discord User ID (copied from createNote, can be refactored later if needed)
        let discordUserIdForNote: string = 'N/A'; // Fallback
        const userLink = await UserDiscordLink.findOne({ userId: userId });
        if (userLink) {
            discordUserIdForNote = userLink.discordUserId;
        }

        // 4. Create and save the new note
        const newNote = new Note({
            userId,
            discordUserId: discordUserIdForNote, 
            content: aiGeneratedContent, // Use AI generated content
            project: projectForNote,
        });

        await newNote.save();
        const populatedNote = await Note.findById(newNote._id).populate('project', 'name');
        
        res.status(201).json(populatedNote);

    } catch (error) {
        console.error('Error creating note with AI:', error);
        res.status(500).json({ message: 'Server error while creating note with AI.' });
    }
}; 