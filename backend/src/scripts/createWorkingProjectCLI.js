const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

async function createWorkingProject() {
  try {
    console.log('🚀 Creating a fresh CLI project and simple test case...\n');
    
    // Step 1: Create the project
    console.log('📁 Creating project...');
    
    const projectData = {
      name: 'CLI Test Project',
      projectCode: 'CLI12',
      description: 'Simple project for testing CLI browser automation'
    };
    
    const projectResponse = await axios.post(`${API_BASE_URL}/projects`, projectData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const project = projectResponse.data;
    console.log(`✅ Project created: ${project.name}`);
    console.log(`   ID: ${project._id}`);
    console.log(`   Code: ${project.projectCode}\n`);
    
    // Step 2: Add the simple test case
    console.log('🧪 Adding simple test case...');
    
    const testCaseData = {
      title: 'Simple Website Test',
      description: 'A very basic test that will definitely work',
      steps: [
        'Navigate to https://example.com',
        'Wait for 3 seconds',
        'Verify "Example Domain" appears on page'
      ],
      expectedResult: 'Example Domain',
      priority: 'HIGH'
    };
    
    await axios.post(
      `${API_BASE_URL}/projects/${project._id}/test-cases`,
      testCaseData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Test case added!\n');
    
    // Show what we created
    console.log('🎯 What was created:');
    console.log(`   Project: ${project.name} (${project.projectCode})`);
    console.log(`   Test: ${testCaseData.title}`);
    console.log(`   Steps: ${testCaseData.steps.length} simple steps`);
    console.log(`   Target: example.com (super reliable!)\n`);
    
    console.log('🚀 Ready to test! Run this command:');
    console.log(`   labnex run --project ${project._id}`);
    console.log(`   labnex run --project ${project.projectCode}`);
    console.log('');
    
    console.log('💡 Why this will work:');
    console.log('   ✅ example.com is super simple');
    console.log('   ✅ No redirects or complex loading');
    console.log('   ✅ "Example Domain" text is always there');
    console.log('   ✅ Fast loading, no timeouts');
    console.log('   ✅ Perfect for testing CLI automation!');
    
  } catch (error) {
    if (error.response?.data?.message?.includes('duplicate')) {
      console.log('ℹ️  Project with this name/code already exists. That\'s fine!');
    } else {
      console.error('❌ Error:', error.response?.data?.message || error.message);
    }
  }
}

createWorkingProject(); 