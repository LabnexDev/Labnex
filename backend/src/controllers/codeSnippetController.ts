import { Request, Response } from 'express';
import { CodeSnippet, ICodeSnippet } from '../models/CodeSnippet';
import { Project } from '../models/Project';
import { Types } from 'mongoose';
import { assistWithCode } from '../bots/labnexAI/chatgpt.service';

// @desc    Create a new code snippet
// @route   POST /api/snippets
// @access  Private
export const createSnippet = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { title, description, language, code, projectId } = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
        console.error('Create Snippet Error: User ID is invalid or missing. Received:', userId);
        return res.status(400).json({ message: 'User ID is invalid or missing. Cannot create snippet.' });
    }

    if (!title || !language || !code) {
        return res.status(400).json({ message: 'Title, language, and code are required.' });
    }

    try {
        let projectForSnippet: Types.ObjectId | undefined = undefined;
        if (projectId && typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found to link snippet.' });
            }
            const userIsOwner = project.owner.equals(userId);
            const userIsMember = Array.isArray(project.members) && project.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
            if (!userIsOwner && !userIsMember && !(req as any).user.isAdmin) { // Allow admin to link to any project
                return res.status(403).json({ message: 'You do not have permission to link a snippet to this project.' });
            }
            projectForSnippet = project._id;
        }

        const newSnippet = new CodeSnippet({
            userId,
            title,
            description,
            language: language.toLowerCase(),
            code,
            projectId: projectForSnippet,
        });

        await newSnippet.save();
        // Populate project name for the response if linked
        const populatedSnippet = await CodeSnippet.findById(newSnippet._id).populate('projectId', 'name');
        res.status(201).json(populatedSnippet);
    } catch (error) {
        console.error('Error creating snippet:', error);
        res.status(500).json({ message: 'Server error while creating snippet.' });
    }
};

// @desc    Get all code snippets for the authenticated user, optionally filtered by project
// @route   GET /api/snippets
// @access  Private
export const getSnippets = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { projectId: queryProjectId } = req.query; // Renamed to avoid conflict with projectId in snippet schema

    try {
        const query: any = { userId };
        if (queryProjectId && typeof queryProjectId === 'string' && Types.ObjectId.isValid(queryProjectId)) {
            query.projectId = new Types.ObjectId(queryProjectId);
        }

        const snippets = await CodeSnippet.find(query)
            .populate('projectId', 'name')
            .sort({ updatedAt: -1 });
        res.status(200).json(snippets);
    } catch (error) {
        console.error('Error fetching snippets:', error);
        res.status(500).json({ message: 'Server error while fetching snippets.' });
    }
};

// @desc    Get a single code snippet by ID
// @route   GET /api/snippets/:snippetId
// @access  Private
export const getSnippetById = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { snippetId } = req.params;

    if (!Types.ObjectId.isValid(snippetId)) {
        return res.status(400).json({ message: 'Invalid snippet ID.' });
    }

    try {
        const snippet = await CodeSnippet.findById(snippetId).populate('projectId', 'name');
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }
        // Ensure the user owns the snippet or is an admin
        if (snippet.userId.toString() !== userId.toString() && !(req as any).user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to view this snippet.' });
        }
        res.status(200).json(snippet);
    } catch (error) {
        console.error('Error fetching snippet by ID:', error);
        res.status(500).json({ message: 'Server error while fetching snippet.' });
    }
};

// @desc    Update an existing code snippet
// @route   PUT /api/snippets/:snippetId
// @access  Private
export const updateSnippet = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { snippetId } = req.params;
    const { title, description, language, code, projectId } = req.body;

    if (!Types.ObjectId.isValid(snippetId)) {
        return res.status(400).json({ message: 'Invalid snippet ID.' });
    }

    try {
        const snippet = await CodeSnippet.findById(snippetId);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }
        if (snippet.userId.toString() !== userId.toString() && !(req as any).user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to update this snippet.' });
        }

        if (title) snippet.title = title;
        if (description !== undefined) snippet.description = description;
        if (language) snippet.language = language.toLowerCase();
        if (code) snippet.code = code;

        if (projectId !== undefined) {
            if (projectId === null || projectId === '') { // Allow unlinking
                snippet.projectId = undefined;
            } else if (typeof projectId === 'string' && Types.ObjectId.isValid(projectId)) {
                const projectDoc = await Project.findById(projectId);
                if (!projectDoc) {
                    return res.status(404).json({ message: 'Project not found to link snippet.' });
                }
                const userIsOwner = projectDoc.owner.equals(userId);
                const userIsMember = Array.isArray(projectDoc.members) && projectDoc.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
                if (!userIsOwner && !userIsMember && !(req as any).user.isAdmin) {
                    return res.status(403).json({ message: 'You do not have permission to link this snippet to this project.' });
                }
                snippet.projectId = projectDoc._id;
            } else {
                return res.status(400).json({ message: 'Invalid project ID for linking.' });
            }
        }

        await snippet.save();
        const populatedSnippet = await CodeSnippet.findById(snippet._id).populate('projectId', 'name');
        res.status(200).json(populatedSnippet);
    } catch (error) {
        console.error('Error updating snippet:', error);
        res.status(500).json({ message: 'Server error while updating snippet.' });
    }
};

// @desc    Delete a code snippet
// @route   DELETE /api/snippets/:snippetId
// @access  Private
export const deleteSnippet = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { snippetId } = req.params;

    if (!Types.ObjectId.isValid(snippetId)) {
        return res.status(400).json({ message: 'Invalid snippet ID.' });
    }

    try {
        const snippet = await CodeSnippet.findById(snippetId);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }
        if (snippet.userId.toString() !== userId.toString() && !(req as any).user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this snippet.' });
        }

        await snippet.deleteOne();
        res.status(200).json({ message: 'Snippet deleted successfully.' });
    } catch (error) {
        console.error('Error deleting snippet:', error);
        res.status(500).json({ message: 'Server error while deleting snippet.' });
    }
};

// @desc    Get AI assistance for a code snippet (cleanup or fix errors)
// @route   POST /api/snippets/:snippetId/assist
// @access  Private
export const getAISuggestionForSnippet = async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { snippetId } = req.params;
    const { action } = req.body; // action should be 'cleanup' or 'fix_errors'

    if (!Types.ObjectId.isValid(snippetId)) {
        return res.status(400).json({ message: 'Invalid snippet ID.' });
    }

    if (!action || (action !== 'cleanup' && action !== 'fix_errors')) {
        return res.status(400).json({ message: 'Invalid action specified. Must be \'cleanup\' or \'fix_errors\'.' });
    }

    try {
        const snippet = await CodeSnippet.findById(snippetId);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }

        // Ensure the user owns the snippet or is an admin
        if (snippet.userId.toString() !== userId.toString() && !(req as any).user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to get AI assistance for this snippet.' });
        }

        const aiSuggestion = await assistWithCode(snippet.code, snippet.language, action);

        if (aiSuggestion.startsWith('Error:') || aiSuggestion.startsWith("I'm sorry, but my connection")) {
            // AI service returned an error
            return res.status(500).json({ message: aiSuggestion });
        }
         if (aiSuggestion === "The AI generated an empty response. Please try again." || aiSuggestion === "Error: OpenAI returned no content.") {
             return res.status(400).json({ message: aiSuggestion });
        }

        res.status(200).json({ suggestion: aiSuggestion });

    } catch (error) {
        console.error(`Error getting AI suggestion for snippet ${snippetId}:`, error);
        res.status(500).json({ message: 'Server error while getting AI suggestion.' });
    }
}; 