import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestCase, ITestCase } from '../../src/models/TestCase'; // Adjust path as needed
import { User } from '../../src/models/User'; // For createdBy
import { Project } from '../../src/models/Project'; // For project

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('TestCase Model', () => {
  let validUserId: mongoose.Types.ObjectId;
  let validProjectId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create a dummy user and project for referencing in test cases
    const user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    validUserId = user._id;

    const project = await Project.create({ name: 'Test Project', description: 'A project for testing', owner: validUserId });
    validProjectId = project._id;
  });

  it('should create a test case successfully with all valid data', async () => {
    const testCaseData: Partial<ITestCase> = {
      title: 'Valid Test Case Title',
      description: 'Valid description.',
      steps: ['Step 1', 'Step 2'],
      expectedResult: 'Valid expected result.',
      status: 'pass',
      priority: 'HIGH',
      project: validProjectId,
      createdBy: validUserId,
    };
    const testCase = new TestCase(testCaseData);
    const savedTestCase = await testCase.save();

    expect(savedTestCase._id).toBeDefined();
    expect(savedTestCase.title).toBe(testCaseData.title);
    expect(savedTestCase.description).toBe(testCaseData.description);
    expect(savedTestCase.steps).toEqual(expect.arrayContaining(testCaseData.steps as string[]));
    expect(savedTestCase.expectedResult).toBe(testCaseData.expectedResult);
    expect(savedTestCase.status).toBe('pass');
    expect(savedTestCase.priority).toBe('HIGH');
    expect(savedTestCase.project).toEqual(validProjectId);
    expect(savedTestCase.createdBy).toEqual(validUserId);
    expect(savedTestCase.createdAt).toBeDefined();
    expect(savedTestCase.updatedAt).toBeDefined();
  });

  // Test for required fields
  it('should fail if title is missing', async () => {
    const testCaseData = {
      description: 'Valid description.',
      steps: ['Step 1'],
      expectedResult: 'Valid result.',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.title).toBeDefined();
  });

  it('should fail if description is missing', async () => {
    const testCaseData = {
      title: 'Valid Title',
      steps: ['Step 1'],
      expectedResult: 'Valid result.',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.description).toBeDefined();
  });
  
  it('should fail if steps are missing or empty array', async () => {
    const testCaseDataMissing = {
      title: 'Valid Title',
      description: 'Valid desc',
      expectedResult: 'Valid result.',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    let errMissing: any;
    try {
      const testCase = new TestCase(testCaseDataMissing);
      await testCase.save();
    } catch (error) {
      errMissing = error;
    }
    expect(errMissing).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(errMissing.errors.steps).toBeDefined();

    const testCaseDataEmpty = {
      ...testCaseDataMissing,
      steps: [], // Empty array
    };
    let errEmpty: any;
    try {
      const testCase = new TestCase(testCaseDataEmpty);
      await testCase.save();
    } catch (error) {
      errEmpty = error;
    }
    // Mongoose default validator for array required might not catch empty array unless minLength is set.
    // Let's assume for now the model definition implies steps must have content.
    // If `required: true` on array doesn't prevent empty array, schema needs `validate: v => Array.isArray(v) && v.length > 0`
    // For now, checking if the error exists.
    expect(errEmpty).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(errEmpty.errors.steps).toBeDefined();
  });

  it('should fail if expectedResult is missing', async () => {
    const testCaseData = {
      title: 'Valid Title',
      description: 'Valid desc',
      steps: ['Step 1'],
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.expectedResult).toBeDefined();
  });

  it('should fail if project is missing', async () => {
    const testCaseData = {
      title: 'Valid Title',
      description: 'Valid desc',
      steps: ['Step 1'],
      expectedResult: 'Valid Result',
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.project).toBeDefined();
  });

  it('should fail if createdBy is missing', async () => {
    const testCaseData = {
      title: 'Valid Title',
      description: 'Valid desc',
      steps: ['Step 1'],
      expectedResult: 'Valid Result',
      project: validProjectId,
      priority: 'MEDIUM',
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.createdBy).toBeDefined();
  });
  
  it('should fail if priority is missing', async () => {
    const testCaseData = {
      title: 'Valid Title',
      description: 'Valid desc',
      steps: ['Step 1'],
      expectedResult: 'Valid Result',
      project: validProjectId,
      createdBy: validUserId,
      // priority is missing
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.priority).toBeDefined();
  });


  // Test for default values
  it('should apply default status "pending" if not provided', async () => {
    const testCaseData: Partial<ITestCase> = {
      title: 'Test Case For Default Status',
      description: 'Valid description.',
      steps: ['Step 1'],
      expectedResult: 'Valid expected result.',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM', // Priority is required, so we provide it
      // status is not provided
    };
    const testCase = new TestCase(testCaseData);
    const savedTestCase = await testCase.save();
    expect(savedTestCase.status).toBe('pending');
  });

  it('should apply default priority "MEDIUM" if not provided', async () => {
    // This test assumes the TestCase model has a default for priority
    // From our previous schema update, priority *is* required. Let's adjust this.
    // If priority is required, it cannot have a default that kicks in if it's undefined.
    // However, Mongoose defaults apply if the path is not set.
    // Since priority is required, a value must be provided.
    // Let's test that the default is applied correctly when other required fields are present.
    const testCaseData: Partial<ITestCase> = {
      title: 'Test Case For Default Priority',
      description: 'Valid description.',
      steps: ['Step 1'],
      expectedResult: 'Valid expected result.',
      project: validProjectId,
      createdBy: validUserId,
      // Priority is NOT provided, relies on schema default
      // Status is also not provided, relies on schema default
    };
    const testCase = new TestCase(testCaseData);
    const savedTestCase = await testCase.save();
    expect(savedTestCase.priority).toBe('MEDIUM');
    expect(savedTestCase.status).toBe('pending'); // Also check status default here
  });


  // Test for enum validation
  it('should fail if status has an invalid value', async () => {
    const testCaseData = {
      title: 'Test Invalid Status',
      description: 'Desc',
      steps: ['Step 1'],
      expectedResult: 'Result',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'HIGH',
      status: 'invalid_status_value', // Invalid enum value
    };
    let err: any;
    try {
      const testCase = new TestCase(testCaseData as any); // Use 'as any' to bypass TS type check for testing
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.message).toMatch(/is not a valid enum value/);
  });

  it('should fail if priority has an invalid value', async () => {
    const testCaseData = {
      title: 'Test Invalid Priority',
      description: 'Desc',
      steps: ['Step 1'],
      expectedResult: 'Result',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'invalid_priority_value', // Invalid enum value
    };
    let err: any;
    try {
      // Cast to any to bypass TypeScript's enum check for the purpose of testing runtime validation
      const testCase = new TestCase(testCaseData as any);
      await testCase.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.priority).toBeDefined();
    expect(err.errors.priority.message).toMatch(/is not a valid enum value/);
  });

  // Test for uniqueness
  it('should fail if title is not unique', async () => {
    const commonTitle = 'Non Unique Title';
    const testCaseData1 = {
      title: commonTitle,
      description: 'First description',
      steps: ['Step 1'],
      expectedResult: 'Expected result 1',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };
    const testCase1 = new TestCase(testCaseData1);
    await testCase1.save();

    const testCaseData2 = {
      title: commonTitle, // Same title
      description: 'Second description',
      steps: ['Step A'],
      expectedResult: 'Expected result 2',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'LOW',
    };
    let err: any;
    try {
      const testCase2 = new TestCase(testCaseData2);
      await testCase2.save();
    } catch (error) {
      err = error;
    }
    // Check for a Mongoose duplicate key error (code 11000)
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); 
  });
  
  // Adjusting the steps validation test based on the new schema validator
  it('should fail if steps are missing or an empty array', async () => {
    const baseData = {
      title: 'Test Steps Validation',
      description: 'Valid desc',
      expectedResult: 'Valid result.',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'MEDIUM',
    };

    // Test case with steps missing
    const testCaseDataMissing = { ...baseData };
    let errMissing: any;
    try {
      const testCase = new TestCase(testCaseDataMissing);
      await testCase.save();
    } catch (error) {
      errMissing = error;
    }
    expect(errMissing).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(errMissing.errors.steps).toBeDefined();
    expect(errMissing.errors.steps.message).toBe('Test steps are required');


    // Test case with steps as an empty array
    const testCaseDataEmpty = {
      ...baseData,
      steps: [], // Empty array
    };
    let errEmpty: any;
    try {
      const testCase = new TestCase(testCaseDataEmpty);
      await testCase.save();
    } catch (error) {
      errEmpty = error;
    }
    expect(errEmpty).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(errEmpty.errors.steps).toBeDefined();
    expect(errEmpty.errors.steps.message).toBe('Test case must have at least one step.');
  });

  // Test for other fields if necessary (e.g., trim)
  it('should trim title, description, and expectedResult', async () => {
    const testCaseData = {
      title: '  Spaced Title   ',
      description: '  Spaced Description  ',
      steps: ['Step 1'],
      expectedResult: '  Spaced Result  ',
      project: validProjectId,
      createdBy: validUserId,
      priority: 'HIGH',
    };
    const testCase = new TestCase(testCaseData);
    const savedTestCase = await testCase.save();

    expect(savedTestCase.title).toBe('Spaced Title');
    expect(savedTestCase.description).toBe('Spaced Description');
    expect(savedTestCase.expectedResult).toBe('Spaced Result');
  });

}); 