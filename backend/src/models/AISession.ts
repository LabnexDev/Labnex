import mongoose, { Schema, Document } from 'mongoose';

export interface IAISession extends Document {
  userId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  title: string;
  archived: boolean;
}

const AISessionSchema = new Schema<IAISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
  createdAt: { type: Date, default: Date.now },
  title: { type: String, default: 'Untitled Session' },
  archived: { type: Boolean, default: false },
});

AISessionSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

export const AISession = mongoose.model<IAISession>('AISession', AISessionSchema); 