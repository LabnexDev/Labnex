import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlistEntry extends Document {
  email: string;
  createdAt: Date;
}

const waitlistEntrySchema = new Schema<IWaitlistEntry>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

// Create the model
const WaitlistEntry = mongoose.model<IWaitlistEntry>('WaitlistEntry', waitlistEntrySchema);

export { WaitlistEntry }; 