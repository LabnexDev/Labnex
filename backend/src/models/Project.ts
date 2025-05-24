import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  projectCode: string;
  description?: string;
  isActive: boolean;
  testCaseCount: number;
  taskCount: number;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    projectCode: {
      type: String,
      required: [true, 'Project code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Project code must be at least 3 characters long'],
      maxlength: [5, 'Project code must be no more than 5 characters long'],
      match: [/^[A-Z0-9]+$/, 'Project code must be uppercase letters and numbers only'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    testCaseCount: {
      type: Number,
      default: 0,
    },
    taskCount: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Create a compound index for name and owner to ensure uniqueness per owner
projectSchema.index({ name: 1, owner: 1 }, { unique: true });

// Create the model
const Project = mongoose.model<IProject>('Project', projectSchema);

// Function to handle index operations
const setupIndexes = async () => {
  try {
    // Drop the old unique index on name if it exists
    await Project.collection.dropIndex('name_1');
    console.log('Dropped old name index');
  } catch (error) {
    // Ignore error if index doesn't exist
    console.log('No old name index to drop');
  }
};

// Run index setup when the model is ready
mongoose.connection.on('connected', () => {
  setupIndexes().catch(console.error);
});

export { Project }; 