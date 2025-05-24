import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUser } from '../../src/models/User'; // Adjust path as needed

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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('User Model', () => {
  const validUserData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should create a user successfully with valid data', async () => {
    const user = new User(validUserData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUserData.name);
    expect(savedUser.email).toBe(validUserData.email.toLowerCase());
    expect(savedUser.avatar).toBe('');
    expect(savedUser.emailNotifications).toBe(true);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  // Test for required fields
  it('should fail if name is missing', async () => {
    const { name, ...userDataWithoutName } = validUserData;
    let err: any;
    try {
      const user = new User(userDataWithoutName);
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail if email is missing', async () => {
    const { email, ...userDataWithoutEmail } = validUserData;
    let err: any;
    try {
      const user = new User(userDataWithoutEmail);
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
  });

  it('should fail if password is missing', async () => {
    const { password, ...userDataWithoutPassword } = validUserData;
    let err: any;
    try {
      const user = new User(userDataWithoutPassword);
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.password).toBeDefined();
  });

  // Test for email validation
  it('should fail if email is not unique', async () => {
    const user1 = new User(validUserData);
    await user1.save();

    const user2Data = { ...validUserData, name: 'Another User' }; // Same email
    let err: any;
    try {
      const user2 = new User(user2Data);
      await user2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Mongoose duplicate key error
  });

  it('should fail if email format is invalid', async () => {
    const userDataWithInvalidEmail = { ...validUserData, email: 'invalid-email' };
    let err: any;
    try {
      const user = new User(userDataWithInvalidEmail);
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.email).toBeDefined();
    expect(err.errors.email.message).toBe('Please enter a valid email');
  });

  it('should convert email to lowercase', async () => {
    const userDataWithUppercaseEmail = { ...validUserData, email: 'TEST@EXAMPLE.COM' };
    const user = new User(userDataWithUppercaseEmail);
    const savedUser = await user.save();
    expect(savedUser.email).toBe('test@example.com');
  });

  // Test for password validation
  it('should fail if password is too short', async () => {
    const userDataWithShortPassword = { ...validUserData, password: '123' }; // Less than 6 chars
    let err: any;
    try {
      const user = new User(userDataWithShortPassword);
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.password).toBeDefined();
    expect(err.errors.password.message).toBe('Password must be at least 6 characters long');
  });

  it('should hash password before saving', async () => {
    const rawPassword = 'password123';
    const user = new User({ ...validUserData, password: rawPassword });
    const savedUser = await user.save();
    
    expect(savedUser.password).toBeDefined();
    expect(savedUser.password).not.toBe(rawPassword);
    
    // Test the comparePassword method
    const isMatch = await savedUser.comparePassword(rawPassword);
    expect(isMatch).toBe(true);

    const isNotMatch = await savedUser.comparePassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });
  
  // Test default values
  it('should have default avatar as empty string if not provided', async () => {
    const user = new User(validUserData); // avatar not provided
    const savedUser = await user.save();
    expect(savedUser.avatar).toBe('');
  });

  it('should set avatar if provided', async () => {
    const avatarUrl = 'http://example.com/avatar.png';
    const user = new User({ ...validUserData, avatar: avatarUrl });
    const savedUser = await user.save();
    expect(savedUser.avatar).toBe(avatarUrl);
  });

  it('should have default emailNotifications as true if not provided', async () => {
    const user = new User(validUserData); // emailNotifications not provided
    const savedUser = await user.save();
    expect(savedUser.emailNotifications).toBe(true);
  });

  it('should set emailNotifications if provided', async () => {
    const user = new User({ ...validUserData, emailNotifications: false });
    const savedUser = await user.save();
    expect(savedUser.emailNotifications).toBe(false);
  });
  
  // Test trim functionality
  it('should trim name and email', async () => {
    const userDataWithSpaces = {
      name: '  Spaced Name   ',
      email: '  spaced.email@example.com  ',
      password: 'password123'
    };
    const user = new User(userDataWithSpaces);
    const savedUser = await user.save();
    expect(savedUser.name).toBe('Spaced Name');
    expect(savedUser.email).toBe('spaced.email@example.com');
  });
}); 