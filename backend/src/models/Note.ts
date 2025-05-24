import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
    userId: Types.ObjectId; // Labnex User ID
    discordUserId: string;  // Discord User ID for reference
    title: string;
    content: string;
    project?: Types.ObjectId; // Optional: Link to a project
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discordUserId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false, // Optional
    },
}, { timestamps: true });

// Index for querying notes by user, and by user + project
NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, project: 1, createdAt: -1 });

export const Note = model<INote>('Note', NoteSchema); 