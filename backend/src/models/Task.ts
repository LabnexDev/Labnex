import { Schema, model, Document, Types } from 'mongoose';

// Enum for Task Status
export enum TaskStatus {
    TODO = 'To Do',
    IN_PROGRESS = 'In Progress',
    BLOCKED = 'Blocked',
    IN_REVIEW = 'In Review', // Optional: if there's a review step after execution
    DONE = 'Done',
    CANCELLED = 'Cancelled', // Optional
}

// Enum for Task Priority
export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export interface ITask extends Document {
    project: Types.ObjectId; // Link to the Project
    taskReferenceId: string; // Added taskReferenceId
    title: string; // Task title, e.g., "Execute Login Test Suite" or "Test Login Functionality - Sprint 2"
    description?: string; // Optional more detailed description of the task itself
    
    assignedTo?: Types.ObjectId; // User assigned to this task
    createdBy: Types.ObjectId; // User who created this task

    status: TaskStatus;
    priority: TaskPriority;

    testCases: Types.ObjectId[]; // Array of TestCase IDs related to this task

    dueDate?: Date; // Optional due date

    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    taskReferenceId: {
        type: String,
        unique: true,
        required: true,
        index: true,
        uppercase: true,
        trim: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Not required, can be unassigned
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    status: { 
        type: String, 
        enum: Object.values(TaskStatus), 
        default: TaskStatus.TODO,
        required: true,
        index: true 
    },
    priority: { 
        type: String, 
        enum: Object.values(TaskPriority), 
        default: TaskPriority.MEDIUM,
        required: true
    },

    testCases: [{ type: Schema.Types.ObjectId, ref: 'TestCase' }], // Array of Test Case references

    dueDate: { type: Date },

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Index for common queries
TaskSchema.index({ project: 1, assignedTo: 1, status: 1 }); 
TaskSchema.index({ project: 1, status: 1 });

export const Task = model<ITask>('Task', TaskSchema); 