import { Request, Response, NextFunction } from 'express';
import { Role, RoleType } from '../models/roleModel';

// Define permission types
export enum Permission {
  MANAGE_PROJECT = 'MANAGE_PROJECT',
  MANAGE_TEST_CASES = 'MANAGE_TEST_CASES',
  EXECUTE_TEST_CASES = 'EXECUTE_TEST_CASES',
  VIEW_TEST_CASES = 'VIEW_TEST_CASES',
  MANAGE_TEAM = 'MANAGE_TEAM'
}

// Define role permissions mapping
const rolePermissions: Record<RoleType, Permission[]> = {
  [RoleType.PROJECT_OWNER]: [
    Permission.MANAGE_PROJECT,
    Permission.MANAGE_TEST_CASES,
    Permission.EXECUTE_TEST_CASES,
    Permission.VIEW_TEST_CASES,
    Permission.MANAGE_TEAM
  ],
  [RoleType.TEST_MANAGER]: [
    Permission.MANAGE_TEST_CASES,
    Permission.EXECUTE_TEST_CASES,
    Permission.VIEW_TEST_CASES,
    Permission.MANAGE_TEAM
  ],
  [RoleType.TESTER]: [
    Permission.EXECUTE_TEST_CASES,
    Permission.VIEW_TEST_CASES
  ],
  [RoleType.VIEWER]: [
    Permission.VIEW_TEST_CASES
  ]
};

// Middleware to check if user has required permission
export const checkPermission = (requiredPermission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated for permission check' });
      }
      const userId = req.user._id;

      // Get user's role for the project
      const role = await Role.findOne({ projectId, userId });

      if (!role) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if role has required permission
      const permissions = rolePermissions[role.type];
      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({ message: 'Error checking permission' });
    }
  };
};

// Middleware to check if user is project owner
export const isProjectOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated for project ownership check' });
    }
    const userId = req.user._id;

    const role = await Role.findOne({
      projectId,
      userId,
      type: RoleType.PROJECT_OWNER
    });

    if (!role) {
      return res.status(403).json({ message: 'Only project owners can perform this action' });
    }

    next();
  } catch (error) {
    console.error('Error checking project ownership:', error);
    res.status(500).json({ message: 'Error checking project ownership' });
  }
}; 