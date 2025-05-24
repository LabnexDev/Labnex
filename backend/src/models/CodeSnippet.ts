import { Schema, model, Document, Types } from 'mongoose';

export interface ICodeSnippet extends Document {
    userId: Types.ObjectId;
    projectId?: Types.ObjectId;
    title: string;
    description?: string;
    language: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
}

const CodeSnippetSchema = new Schema<ICodeSnippet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: false, // Optional
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        language: {
            type: String,
            required: true,
            trim: true,
            lowercase: true, // Store language names consistently
        },
        code: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Index for faster querying of snippets by user
CodeSnippetSchema.index({ userId: 1 });
// Index for user and project
CodeSnippetSchema.index({ userId: 1, projectId: 1 });

export const CodeSnippet = model<ICodeSnippet>('CodeSnippet', CodeSnippetSchema); 