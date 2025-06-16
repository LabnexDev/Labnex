import mongoose, { Schema, Document } from 'mongoose';

export interface ITestResult {
  _id?: mongoose.Types.ObjectId;
  testCaseId: mongoose.Types.ObjectId;
  status: 'pass' | 'fail' | 'pending';
  duration: number;
  message?: string;
  error?: string;
  screenshot?: string;
  logs?: string[];
  startedAt: Date;
  completedAt?: Date;
}

export interface ITestRun extends Document {
  project: mongoose.Types.ObjectId;
  testCases: mongoose.Types.ObjectId[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: {
    parallel: number;
    environment: string;
    aiOptimization: boolean;
    baseUrl?: string;
    suite?: string;
    timeout?: number;
  };
  results: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    duration: number;
  };
  testResults: ITestResult[];
  startedBy: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  aiOptimizations?: {
    selectedTests: string[];
    reasoning: string;
    optimizationTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new Schema<ITestResult>({
  testCaseId: {
    type: Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true,
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending',
  },
  duration: {
    type: Number,
    default: 0,
  },
  message: {
    type: String,
    trim: true,
  },
  error: {
    type: String,
    trim: true,
  },
  screenshot: {
    type: String,
    trim: true,
  },
  logs: [{
    type: String,
  }],
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
}, { _id: false });

const testRunSchema = new Schema<ITestRun>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    testCases: [{
      type: Schema.Types.ObjectId,
      ref: 'TestCase',
    }],
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    config: {
      parallel: {
        type: Number,
        default: 4,
        min: 1,
        max: 20,
      },
      environment: {
        type: String,
        default: 'staging',
        trim: true,
      },
      aiOptimization: {
        type: Boolean,
        default: false,
      },
      baseUrl: {
        type: String,
        trim: true,
      },
      suite: {
        type: String,
        trim: true,
      },
      timeout: {
        type: Number,
        default: 300000, // 5 minutes
        min: 30000, // 30 seconds
        max: 3600000, // 1 hour
      },
    },
    results: {
      total: {
        type: Number,
        default: 0,
      },
      passed: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number,
        default: 0,
      },
    },
    testResults: [testResultSchema],
    startedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
      trim: true,
    },
    aiOptimizations: {
      selectedTests: [{
        type: String,
      }],
      reasoning: {
        type: String,
        trim: true,
      },
      optimizationTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
testRunSchema.index({ project: 1, createdAt: -1 });
testRunSchema.index({ startedBy: 1, createdAt: -1 });
testRunSchema.index({ status: 1, createdAt: -1 });

export const TestRun = mongoose.model<ITestRun>('TestRun', testRunSchema);
