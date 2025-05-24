import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Project, IProject } from '../../src/models/Project'; // Adjust path as needed
import { User } from '../../src/models/User'; // For owner/members

let mongoServer: MongoMemoryServer;
let ownerId: mongoose.Types.ObjectId;
let memberId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a dummy user for owner and member references
  const ownerUser = await User.create({ name: 'Owner User', email: 'owner@example.com', password: 'password123' });
  ownerId = ownerUser._id;
  const memberUser = await User.create({ name: 'Member User', email: 'member@example.com', password: 'password123' });
  memberId = memberUser._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up Project collection. User collection will persist for owner/member refs across tests if needed but cleared if this is run after User tests.
  // For isolated project tests, it's better to clear User collection too or ensure beforeEach creates its specific users.
  // Let's clear all for simplicity here, assuming user creation in beforeAll is for general reference.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  // Re-create essential users if cleared
  const ownerUser = await User.create({ name: 'Owner User', email: 'owner@example.com', password: 'password123' });
  ownerId = ownerUser._id;
  const memberUser = await User.create({ name: 'Member User', email: 'member@example.com', password: 'password123' });
  memberId = memberUser._id;
});

describe('Project Model', () => {
  const validProjectData = {
    name: 'Test Project',
    owner: ownerId, // Will be dynamically set in beforeEach or use the one from beforeAll
  };

  beforeEach(async () => {
    // Ensure ownerId is set if not already (e.g. if afterEach clears everything)
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        const ownerUser = await User.create({ name: 'Owner User', email: 'owner@example.com', password: 'password123' });
        ownerId = ownerUser._id;
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        const memberUser = await User.create({ name: 'Member User', email: 'member@example.com', password: 'password123' });
        memberId = memberUser._id;
    }
    validProjectData.owner = ownerId; // Ensure it uses current ownerId
  });


  it('should create a project successfully with valid data', async () => {
    const project = new Project(validProjectData);
    const savedProject = await project.save();

    expect(savedProject._id).toBeDefined();
    expect(savedProject.name).toBe(validProjectData.name);
    expect(savedProject.owner).toEqual(ownerId);
    expect(savedProject.description).toBe('');
    expect(savedProject.isActive).toBe(true);
    expect(savedProject.testCaseCount).toBe(0);
    expect(savedProject.members).toEqual([]);
    expect(savedProject.createdAt).toBeDefined();
    expect(savedProject.updatedAt).toBeDefined();
  });

  // Test for required fields
  it('should fail if name is missing', async () => {
    const { name, ...projectDataWithoutName } = validProjectData;
    let err: any;
    try {
      const project = new Project(projectDataWithoutName);
      await project.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail if owner is missing', async () => {
    const { owner, ...projectDataWithoutOwner } = validProjectData;
    let err: any;
    try {
      const project = new Project(projectDataWithoutOwner);
      await project.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.owner).toBeDefined();
  });

  // Test default values
  it('should have default description as empty string if not provided', async () => {
    const project = new Project(validProjectData);
    const savedProject = await project.save();
    expect(savedProject.description).toBe('');
  });

  it('should set description if provided', async () => {
    const description = 'This is a test project description.';
    const project = new Project({ ...validProjectData, description });
    const savedProject = await project.save();
    expect(savedProject.description).toBe(description);
  });

  it('should have default isActive as true', async () => {
    const project = new Project(validProjectData);
    const savedProject = await project.save();
    expect(savedProject.isActive).toBe(true);
  });

  it('should set isActive if provided', async () => {
    const project = new Project({ ...validProjectData, isActive: false });
    const savedProject = await project.save();
    expect(savedProject.isActive).toBe(false);
  });

  it('should have default testCaseCount as 0', async () => {
    const project = new Project(validProjectData);
    const savedProject = await project.save();
    expect(savedProject.testCaseCount).toBe(0);
  });
  
  it('should allow setting testCaseCount (though typically managed by other logic)', async () => {
    const project = new Project({ ...validProjectData, testCaseCount: 10 });
    const savedProject = await project.save();
    expect(savedProject.testCaseCount).toBe(10);
  });

  it('should have default members as an empty array', async () => {
    const project = new Project(validProjectData);
    const savedProject = await project.save();
    expect(savedProject.members).toEqual([]);
  });

  it('should add members if provided', async () => {
    const project = new Project({ ...validProjectData, members: [memberId] });
    const savedProject = await project.save();
    expect(savedProject.members).toContainEqual(memberId);
  });

  // Test uniqueness (name per owner)
  it('should fail if project name is not unique for the same owner', async () => {
    const project1 = new Project(validProjectData);
    await project1.save();

    const project2Data = { ...validProjectData }; // Same name, same owner
    let err: any;
    try {
      const project2 = new Project(project2Data);
      await project2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Mongoose duplicate key error
  });

  it('should allow same project name for different owners', async () => {
    const project1 = new Project(validProjectData); // Uses global ownerId
    await project1.save();

    // Create a new owner
    const anotherOwner = await User.create({ name: 'Another Owner', email: 'anotherowner@example.com', password: 'password123' });
    const project2Data = { ...validProjectData, owner: anotherOwner._id }; // Same name, different owner
    
    let savedProject2;
    let err: any;
    try {
      const project2 = new Project(project2Data);
      savedProject2 = await project2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeUndefined();
    expect(savedProject2).toBeDefined();
    expect(savedProject2.name).toBe(validProjectData.name);
    expect(savedProject2.owner).toEqual(anotherOwner._id);
  });

  // Test trim functionality
  it('should trim name and description', async () => {
    const projectDataWithSpaces = {
      name: '  Spaced Project Name   ',
      description: '  Spaced Description  ',
      owner: ownerId,
    };
    const project = new Project(projectDataWithSpaces);
    const savedProject = await project.save();
    expect(savedProject.name).toBe('Spaced Project Name');
    expect(savedProject.description).toBe('Spaced Description');
  });
}); 