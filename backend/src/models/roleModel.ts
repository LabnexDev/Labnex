import mongoose, { Document, Schema } from 'mongoose';

// Role types enum
export enum RoleType {
  PROJECT_OWNER = 'PROJECT_OWNER',
  TEST_MANAGER = 'TEST_MANAGER',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER'
}

// System role types enum
export enum SystemRoleType {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// Interface for role document
export interface IRole extends Document {
  type: RoleType;
  systemRole: SystemRoleType;
  projectId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Role schema
const roleSchema = new Schema<IRole>(
  {
    type: {
      type: String,
      enum: Object.values(RoleType),
      // Required if systemRole is not present
      required: function(this: IRole) {
        return !this.systemRole;
      }
    },
    systemRole: {
      type: String,
      enum: Object.values(SystemRoleType),
      // Required if type is not present
      required: function(this: IRole) {
        return !this.type;
      }
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      // Required if type is present and systemRole is not (i.e., it's a project-specific role)
      required: function(this: IRole) {
        return !!this.type && !this.systemRole;
      }
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for project roles
roleSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Create index for system roles (only when systemRole is present)
roleSchema.index({ userId: 1, systemRole: 1 }, { 
  unique: true,
  partialFilterExpression: { systemRole: { $exists: true, $ne: null } }
});

// Create the model
export const Role = mongoose.model<IRole>('Role', roleSchema); 