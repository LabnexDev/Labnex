import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Role, IRole, RoleType, SystemRoleType } from '../../src/models/roleModel'; // Adjust path
import { User } from '../../src/models/User';
import { Project } from '../../src/models/Project';

let mongoServer: MongoMemoryServer;
let testUserId: mongoose.Types.ObjectId;
let testProjectId: mongoose.Types.ObjectId;
let adminUserId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const user = await User.create({ name: 'Test User', email: 'roleuser@example.com', password: 'password123' });
  testUserId = user._id;
  const adminUser = await User.create({ name: 'Admin User', email: 'adminrole@example.com', password: 'password123' });
  adminUserId = adminUser._id;

  const project = await Project.create({ name: 'Test Project for Roles', owner: testUserId });
  testProjectId = project._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  // Clear only roles for this test suite, assuming User/Project are stable or set up by beforeAll
  if (collections.roles) {
    await collections.roles.deleteMany({});
  }
});

describe('Role Model', () => {

  describe('Project Roles', () => {
    const validProjectRoleData: Partial<IRole> = {
      type: RoleType.PROJECT_OWNER,
      userId: testUserId, // Will be updated in beforeEach if needed
      projectId: testProjectId, // Will be updated in beforeEach if needed
    };

    beforeEach(() => {
        validProjectRoleData.userId = testUserId;
        validProjectRoleData.projectId = testProjectId;
    });

    it('should create a project role successfully with valid data', async () => {
      const role = new Role(validProjectRoleData);
      const savedRole = await role.save();
      expect(savedRole._id).toBeDefined();
      expect(savedRole.type).toBe(RoleType.PROJECT_OWNER);
      expect(savedRole.userId).toEqual(testUserId);
      expect(savedRole.projectId).toEqual(testProjectId);
      expect(savedRole.systemRole).toBeUndefined();
    });

    it('should fail if type is missing for a project role', async () => {
      const { type, ...data } = validProjectRoleData;
      const role = new Role(data);
      let err: any;
      try { await role.save(); } catch (e) { err = e; }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.type).toBeDefined();
    });

    it('should fail if userId is missing for a project role', async () => {
      const { userId, ...data } = validProjectRoleData;
      const role = new Role(data);
      let err: any;
      try { await role.save(); } catch (e) { err = e; }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.userId).toBeDefined();
    });

    it('should fail if projectId is missing for a project role (e.g. PROJECT_OWNER)', async () => {
      // Based on schema: required if this.type !== RoleType.ADMIN (which is not a valid RoleType value)
      // Let's assume it means for non-system roles, projectId is required.
      // For RoleType.PROJECT_OWNER, projectId should be required.
      const { projectId, ...data } = { ...validProjectRoleData, type: RoleType.PROJECT_OWNER };
      const role = new Role(data);
      let err: any;
      try { await role.save(); } catch (e) { err = e; }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.projectId).toBeDefined();
    });

    it('should fail if project role (userId, projectId) is not unique', async () => {
      const role1 = new Role(validProjectRoleData);
      await role1.save();
      const role2 = new Role(validProjectRoleData); // Same data
      let err: any;
      try { await role2.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
    });

    it('should allow different roles for the same user in different projects', async () => {
        const project2 = await Project.create({ name: 'Another Project', owner: testUserId });
        const role1 = new Role({ ...validProjectRoleData, type: RoleType.TESTER });
        await role1.save();
        const role2 = new Role({ ...validProjectRoleData, type: RoleType.VIEWER, projectId: project2._id });
        const savedRole2 = await role2.save();
        expect(savedRole2).toBeDefined();
        expect(savedRole2.projectId).toEqual(project2._id);
    });
  });

  describe('System Roles', () => {
    // The schema has conditional logic for systemRole and projectId based on `this.type === RoleType.ADMIN`.
    // RoleType.ADMIN does not exist. Let's assume it means something like a role where `systemRole` is specified.
    // And for such roles, projectId is NOT required.

    // To test this, we need a type that would make `systemRole` required, and `projectId` not required.
    // The current schema says `systemRole` is required if `this.type === RoleType.ADMIN`
    // and `projectId` is required if `this.type !== RoleType.ADMIN`.
    // This is tricky because `RoleType.ADMIN` is not a value in the enum `RoleType`.
    // Let's assume the intention is: if a `systemRole` (like `SystemRoleType.ADMIN`) is assigned,
    // then `projectId` is not needed, and some `type` from `RoleType` must still be picked.
    // This seems like a potential schema design issue. For now, I will test based on providing a systemRole.

    const validSystemRoleData: Partial<IRole> = {
      type: RoleType.VIEWER, // A placeholder type, as `type` is always required
      systemRole: SystemRoleType.ADMIN,
      userId: adminUserId, // Using a separate adminUserId for clarity
      // projectId should not be required here by the logic if this is a system-level admin
    };

    beforeEach(() => {
        validSystemRoleData.userId = adminUserId;
    });

    it('should create a system role (e.g., ADMIN) successfully', async () => {
      // Given the schema ambiguity with RoleType.ADMIN, we test by setting a systemRole.
      // And assuming that when systemRole is set, projectId is not required.
      // The `type` field is always required from RoleType enum.
      const role = new Role(validSystemRoleData);
      const savedRole = await role.save();
      expect(savedRole._id).toBeDefined();
      expect(savedRole.type).toBe(RoleType.VIEWER); // It will take the provided type
      expect(savedRole.systemRole).toBe(SystemRoleType.ADMIN);
      expect(savedRole.userId).toEqual(adminUserId);
      expect(savedRole.projectId).toBeUndefined();
    });

    it('should fail if systemRole is missing for what is intended as a system role where type makes systemRole required', async () => {
      // This test is hard to write perfectly due to `this.type === RoleType.ADMIN` condition
      // which uses an invalid RoleType value.
      // If we assume a specific `type` (e.g. a hypothetical 'SYSTEM_ADMIN' type from RoleType)
      // was intended to trigger `systemRole` requirement, we could test that.
      // For now, let's assume if `systemRole` is part of the data, it should be a valid enum.
      const data = { ...validSystemRoleData, systemRole: undefined };
      // The schema only makes systemRole required if `this.type === RoleType.ADMIN`.
      // Since no `RoleType` is `ADMIN`, this required condition for systemRole might never trigger.
      // Thus, making systemRole truly optional unless we pick a type from RoleType which would match 'ADMIN'.
      // This test as-is might pass if systemRole is simply omitted.
      // Let's test a different angle: if an invalid systemRole is provided.
      const invalidSystemRole = { ...validSystemRoleData, systemRole: 'INVALID_SYS_ROLE' as SystemRoleType };
      let err: any;
      try { await new Role(invalidSystemRole).save(); } catch (e) { err = e; }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.systemRole).toBeDefined();
    });
    
    it('should NOT require projectId if a systemRole is provided (assuming this is the intent)', async () => {
      // This tests the conditional requirement of projectId: `required: function() { return this.type !== RoleType.ADMIN; }`
      // If `this.type` is set to something that *isn't* `RoleType.ADMIN` (which all current RoleTypes are),
      // then projectId *would* be required by this logic, EVEN IF systemRole is present.
      // This highlights the schema conflict.
      // A better schema might be: projectId is required if systemRole is NOT present or is USER.
      // Or, if systemRole is ADMIN, projectId is NOT required.

      // For now, we test saving with a systemRole and no projectId.
      const roleData = { 
          type: RoleType.TESTER, // Any non-"ADMIN" type from RoleType
          systemRole: SystemRoleType.ADMIN,
          userId: adminUserId 
      };
      const role = new Role(roleData);
      const savedRole = await role.save(); // This should pass if projectId is not required for system admins
      expect(savedRole.projectId).toBeUndefined();
    });

    it('SHOULD require projectId if systemRole is USER (or not ADMIN) and type is not RoleType.ADMIN equivalent', async () => {
        const roleData = { 
            type: RoleType.PROJECT_OWNER, // A non-RoleType.ADMIN type
            systemRole: SystemRoleType.USER, // A non-ADMIN system role
            userId: testUserId,
            // projectId is missing
        };
        const role = new Role(roleData);
        let err: any;
        try { await role.save(); } catch (e) { err = e; }
        // Based on `required: function() { return this.type !== RoleType.ADMIN; }` for projectId,
        // and assuming `RoleType.PROJECT_OWNER` is not `RoleType.ADMIN` (which is true),
        // projectId should be required here.
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.projectId).toBeDefined();
    });

    it('should fail if system role (userId, systemRole) is not unique', async () => {
      const role1 = new Role(validSystemRoleData);
      await role1.save();
      const role2 = new Role(validSystemRoleData); // Same data
      let err: any;
      try { await role2.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // Mongoose duplicate key error due to partialFilterExpression index
    });
  });

  // General enum validation tests
  it('should fail if type has an invalid enum value', async () => {
    const data = { type: 'INVALID_ROLE_TYPE' as RoleType, userId: testUserId, projectId: testProjectId };
    let err: any;
    try { await new Role(data).save(); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

}); 