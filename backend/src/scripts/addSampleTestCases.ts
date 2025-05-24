import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { TestCase } from '../models/TestCase';
import { User } from '../models/User';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labnex');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Sample test cases to add to projects
const sampleTestCases = [
  {
    title: 'User Login Test',
    description: 'Test user login functionality with valid credentials',
    steps: [
      'Navigate to login page',
      'Enter valid username and password',
      'Click login button',
      'Verify successful login and redirect to dashboard'
    ],
    expectedResult: 'User should be successfully logged in and redirected to dashboard',
    priority: 'HIGH' as const
  },
  {
    title: 'Navigation Test',
    description: 'Test main navigation menu functionality',
    steps: [
      'Navigate to main page',
      'Click on each menu item',
      'Verify each page loads correctly',
      'Check for any broken links'
    ],
    expectedResult: 'All navigation links should work and pages should load without errors',
    priority: 'MEDIUM' as const
  },
  {
    title: 'Form Validation Test',
    description: 'Test form validation with invalid data',
    steps: [
      'Navigate to contact form',
      'Submit form with empty fields',
      'Verify validation errors appear',
      'Fill form with invalid email format',
      'Verify email validation error'
    ],
    expectedResult: 'Form should display appropriate validation errors for invalid data',
    priority: 'MEDIUM' as const
  },
  {
    title: 'Responsive Design Test',
    description: 'Test website responsiveness on different screen sizes',
    steps: [
      'Open website in desktop browser',
      'Resize browser window to tablet size',
      'Resize to mobile size',
      'Check menu functionality on mobile',
      'Verify all content is accessible'
    ],
    expectedResult: 'Website should be fully functional and well-formatted on all screen sizes',
    priority: 'LOW' as const
  }
];

async function addSampleTestCases() {
  try {
    // Get all projects
    const projects = await Project.find({}).populate('owner');
    
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      console.log(`\nChecking project: ${project.name} (${project._id})`);
      
      // Check if project already has test cases
      const existingTestCases = await TestCase.find({ project: project._id });
      
      if (existingTestCases.length === 0) {
        console.log(`  No test cases found. Adding sample test cases...`);
        
        // Add sample test cases
        for (const sampleCase of sampleTestCases) {
          try {
            const testCase = await TestCase.create({
              ...sampleCase,
              project: project._id,
              createdBy: project.owner._id
            });
            console.log(`    ✅ Added: ${testCase.title}`);
          } catch (error) {
            console.error(`    ❌ Error adding test case "${sampleCase.title}":`, error);
          }
        }
      } else {
        console.log(`  Already has ${existingTestCases.length} test cases. Skipping.`);
      }
    }

    console.log('\n✅ Sample test cases added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample test cases:', error);
  }
}

async function main() {
  await connectDB();
  await addSampleTestCases();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { addSampleTestCases }; 