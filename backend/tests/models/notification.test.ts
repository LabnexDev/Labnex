import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Notification, INotification, NotificationType, NotificationStatus } from '../../src/models/Notification'; // Adjust path
import { User } from '../../src/models/User';
import { Project } from '../../src/models/Project';
import { TestCase } from '../../src/models/TestCase';

let mongoServer: MongoMemoryServer;
let userId: mongoose.Types.ObjectId;
let senderId: mongoose.Types.ObjectId;
let projectId: mongoose.Types.ObjectId;
let testCaseId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create dummy data for references
  const user1 = await User.create({ name: 'Test User 1', email: 'user1@example.com', password: 'password123' });
  userId = user1._id;
  const user2 = await User.create({ name: 'Test User 2', email: 'user2@example.com', password: 'password123' });
  senderId = user2._id;

  const project = await Project.create({ name: 'Test Project', owner: userId });
  projectId = project._id;

  const testCase = await TestCase.create({
    title: 'Test Case for Notification',
    description: 'Desc',
    steps: ['Step 1'],
    expectedResult: 'Result',
    project: projectId,
    createdBy: userId,
    priority: 'MEDIUM'
  });
  testCaseId = testCase._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    // Keep User, Project, TestCase data for subsequent tests if needed, only clear Notifications
    // For full isolation, clear all and recreate in beforeEach or beforeAll if objects are small
    if (key === 'notifications') {
        await collections[key].deleteMany({});
    }
  }
});

describe('Notification Model', () => {
  const validNotificationData: Partial<INotification> = {
    userId: userId, // Will be set by beforeAll
    type: NotificationType.PROJECT_INVITE,
    projectId: projectId, // Will be set by beforeAll
    senderId: senderId, // Will be set by beforeAll
    message: 'You have been invited to a project.',
  };
  
  beforeEach(() => {
    // Ensure IDs are populated if tests run in a way that clears them or for robustness
    validNotificationData.userId = userId;
    validNotificationData.projectId = projectId;
    validNotificationData.senderId = senderId;
  });

  it('should create a notification successfully with valid data', async () => {
    const notification = new Notification(validNotificationData);
    const savedNotification = await notification.save();

    expect(savedNotification._id).toBeDefined();
    expect(savedNotification.userId).toEqual(userId);
    expect(savedNotification.type).toBe(NotificationType.PROJECT_INVITE);
    expect(savedNotification.status).toBe(NotificationStatus.PENDING); // Default status
    expect(savedNotification.projectId).toEqual(projectId);
    expect(savedNotification.senderId).toEqual(senderId);
    expect(savedNotification.message).toBe(validNotificationData.message);
    expect(savedNotification.createdAt).toBeDefined();
    expect(savedNotification.updatedAt).toBeDefined();
  });

  it('should create a notification with an optional testCaseId', async () => {
    const notificationDataWithTestCase = {
      ...validNotificationData,
      testCaseId: testCaseId,
      type: NotificationType.TEST_CASE_ASSIGNED,
      message: 'A test case has been assigned to you.'
    };
    const notification = new Notification(notificationDataWithTestCase);
    const savedNotification = await notification.save();
    expect(savedNotification.testCaseId).toEqual(testCaseId);
  });

  // Test for required fields
  const requiredFields: (keyof INotification)[] = ['userId', 'type', 'projectId', 'senderId', 'message'];
  requiredFields.forEach((field) => {
    it(`should fail if ${field} is missing`, async () => {
      const incompleteData = { ...validNotificationData };
      delete incompleteData[field];
      let err: any;
      try {
        const notification = new Notification(incompleteData);
        await notification.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors[field]).toBeDefined();
    });
  });

  // Test enum validation for 'type'
  it('should fail if type has an invalid enum value', async () => {
    const invalidTypeData = { ...validNotificationData, type: 'INVALID_TYPE' as NotificationType };
    let err: any;
    try {
      const notification = new Notification(invalidTypeData);
      await notification.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

  // Test enum validation for 'status'
  it('should fail if status has an invalid enum value when explicitly set', async () => {
    const invalidStatusData = { ...validNotificationData, status: 'INVALID_STATUS' as NotificationStatus };
    let err: any;
    try {
      const notification = new Notification(invalidStatusData);
      await notification.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });

  // Test default value for 'status'
  it('should apply default status PENDING if not provided', async () => {
    const { status, ...dataWithoutStatus } = validNotificationData;
    const notification = new Notification(dataWithoutStatus);
    const savedNotification = await notification.save();
    expect(savedNotification.status).toBe(NotificationStatus.PENDING);
  });
  
  it('should correctly set status if provided', async () => {
    const notification = new Notification({ ...validNotificationData, status: NotificationStatus.READ });
    const savedNotification = await notification.save();
    expect(savedNotification.status).toBe(NotificationStatus.READ);
  });

}); 