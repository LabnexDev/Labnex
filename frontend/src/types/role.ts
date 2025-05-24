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

// Permission types enum
export enum Permission {
  MANAGE_PROJECT = 'MANAGE_PROJECT',
  MANAGE_TEST_CASES = 'MANAGE_TEST_CASES',
  EXECUTE_TEST_CASES = 'EXECUTE_TEST_CASES',
  VIEW_TEST_CASES = 'VIEW_TEST_CASES',
  MANAGE_TEAM = 'MANAGE_TEAM'
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Role {
  _id: string;
  type: RoleType;
  userId: User;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Role permissions mapping
export const rolePermissions: Record<RoleType, Permission[]> = {
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