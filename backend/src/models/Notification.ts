import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from './Project';
import { ITestCase } from './TestCase';
import { IUser } from './User';
import { RoleType } from './roleModel';

export enum NotificationType {
  PROJECT_INVITE = 'PROJECT_INVITE',
  PROJECT_INVITE_SENT = 'PROJECT_INVITE_SENT',
  TEST_CASE_ASSIGNED = 'TEST_CASE_ASSIGNED',
  TEST_CASE_UPDATED = 'TEST_CASE_UPDATED',
  TEST_CASE_COMPLETED = 'TEST_CASE_COMPLETED',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  STATUS_UPDATE = 'STATUS_UPDATE',
  MENTION = 'MENTION',
  GENERAL = 'GENERAL',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_REJECTED = 'INVITE_REJECTED',
  TASK_ASSIGNED = 'TASK_ASSIGNED'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  READ = 'READ'
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  type: NotificationType;
  status: NotificationStatus;
  projectId?: mongoose.Types.ObjectId | IProject;
  senderId?: mongoose.Types.ObjectId | IUser;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  testCaseId?: mongoose.Types.ObjectId | ITestCase;
  assignedRoleType?: RoleType;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true
    },
    testCaseId: {
      type: Schema.Types.ObjectId,
      ref: 'TestCase'
    },
    assignedRoleType: {
      type: String,
      enum: Object.values(RoleType),
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ projectId: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 