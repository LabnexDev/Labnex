import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage extends Document {
  sessionId: mongoose.Types.ObjectId | string;
  projectId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  action?: {
    type: string;
    params: Record<string, any>;
    status: 'success' | 'error' | 'pending';
  };
}

const AIMessageSchema = new Schema<IAIMessage>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'AISession', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: {
    type: {
      type: String,
    },
    params: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'pending'],
    },
  },
});

AIMessageSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });

export const AIMessage = mongoose.model<IAIMessage>('AIMessage', AIMessageSchema); 