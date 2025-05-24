import mongoose from 'mongoose';
import dotenv from 'dotenv';
require('../models/User'); // Explicitly register User model for population
import { Role, RoleType } from '../models/roleModel';
import { Project } from '../models/Project';
import { User } from '../models/User';

dotenv.config();

async function fixRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labnex');
    console.log('Connected to MongoDB');

    // Get all projects
    const projects = await Project.find();
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      // Check if project owner has a role
      const ownerRole = await Role.findOne({
        projectId: project._id,
        userId: project.owner,
        type: RoleType.PROJECT_OWNER
      });

      if (!ownerRole) {
        console.log(`Creating PROJECT_OWNER role for project ${project._id}`);
        await Role.create({
          projectId: project._id,
          userId: project.owner,
          type: RoleType.PROJECT_OWNER
        });
      }

      // List all roles for this project
      const roles = await Role.find({ projectId: project._id })
        .populate<{ userId: { name: string; email: string } }>('userId', 'name email');
      
      console.log(`\nProject ${project._id} roles:`);
      roles.forEach(role => {
        const user = role.userId as unknown as { name: string; email: string };
        console.log(`- ${user.name} (${user.email}): ${role.type}`);
      });
    }

    console.log('\nRole check complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixRoles(); 