import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';
import { Role, SystemRoleType } from '../models/roleModel';

// Load environment variables from .env file at the root of the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ADMIN_EMAIL = 'labnexcontact@gmail.com';

const seedAdmin = async () => {
  const adminPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('Error: NEW_ADMIN_PASSWORD environment variable is not set.');
    console.log('Please set it before running the script:');
    console.log('  export NEW_ADMIN_PASSWORD="your_secure_password" (for Linux/macOS)');
    console.log('  set NEW_ADMIN_PASSWORD=your_secure_password (for Windows CMD)');
    console.log('  $env:NEW_ADMIN_PASSWORD="your_secure_password" (for Windows PowerShell)');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      console.log(`Admin user with email ${ADMIN_EMAIL} already exists.`);
      // Optionally, update their role if it's not ADMIN or ensure it is.
      let existingRole = await Role.findOne({ userId: existingUser._id });
      if (existingRole) {
        if (existingRole.systemRole !== SystemRoleType.ADMIN) {
          existingRole.systemRole = SystemRoleType.ADMIN;
          await existingRole.save();
          console.log(`Updated role for ${ADMIN_EMAIL} to ADMIN.`);
        } else {
          console.log(`Role for ${ADMIN_EMAIL} is already ADMIN.`);
        }
      } else {
        await Role.create({
          userId: existingUser._id,
          systemRole: SystemRoleType.ADMIN,
        });
        console.log(`Created ADMIN role for existing user ${ADMIN_EMAIL}.`);
      }
       // Optionally update password if needed, though generally seed scripts don't force password changes on existing users
      // If you need to reset the password, you could add logic here:
      // existingUser.password = adminPassword; // The pre-save hook will hash it
      // await existingUser.save();
      // console.log(`Password for admin user ${ADMIN_EMAIL} has been updated.`);

    } else {
      // Create new admin user
      const adminUser = new User({
        name: 'Labnex Admin', // Or derive from email
        email: ADMIN_EMAIL,
        password: adminPassword, // Password will be hashed by pre-save hook
      });
      await adminUser.save();
      console.log(`Admin user ${ADMIN_EMAIL} created successfully.`);

      // Assign system role ADMIN
      await Role.create({
        userId: adminUser._id,
        systemRole: SystemRoleType.ADMIN,
      });
      console.log(`Assigned ADMIN role to ${ADMIN_EMAIL}.`);
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected from seeding.');
  }
};

seedAdmin(); 