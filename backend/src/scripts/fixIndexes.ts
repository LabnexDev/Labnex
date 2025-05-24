import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Get the User collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the problematic index
    await collection.dropIndex('username_1');
    console.log('Successfully dropped username_1 index');

    // Create the correct index
    await collection.createIndex({ email: 1 }, { unique: true });
    console.log('Successfully created email index');

    console.log('Index fixes completed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

fixIndexes(); 