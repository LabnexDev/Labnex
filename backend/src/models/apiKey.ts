import { Schema, model, Document, Types } from 'mongoose';

export interface IApiKey extends Document {
  user: Types.ObjectId;
  label: string;
  hashedKey: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  hashedKey: {
    type: String,
    required: true,
    unique: true,
  },
  prefix: {
    type: String,
    required: true,
  },
  lastUsedAt: {
    type: Date,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

apiKeySchema.index({ user: 1 });

const ApiKey = model<IApiKey>('ApiKey', apiKeySchema);

export default ApiKey; 