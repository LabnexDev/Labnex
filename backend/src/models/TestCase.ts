import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase extends Document {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'pass' | 'fail' | 'pending';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  project: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    title: {
      type: String,
      required: [true, 'Test case title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Test case description is required'],
      trim: true,
    },
    steps: {
      type: [String],
      required: [true, 'Test steps are required'],
      validate: {
        validator: function (v: string[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Test case must have at least one step.',
      },
    },
    expectedResult: {
      type: String,
      required: [true, 'Expected result is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'pending'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      required: [true, 'Priority is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound unique index for title and project
testCaseSchema.index({ project: 1, title: 1 }, { unique: true });

export const TestCase = mongoose.model<ITestCase>('TestCase', testCaseSchema); 