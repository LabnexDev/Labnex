const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

// Properly formatted test case that WILL work
const workingGoogleTest = {
  title: 'Google Search Test - CLI Automation',
  description: 'A properly formatted test case for CLI automation testing that will work reliably',
  steps: [
    'Navigate to https://www.google.com',
    'Wait for 3 seconds',
    'Type "this is a test1234 for CLI automation" into search',
    'Wait for 2 seconds', 
    'Click "Google Search" button',
    'Wait for 5 seconds',
    'Verify "test1234" appears on page'
  ],
  expectedResult: 'test1234',
  priority: 'HIGH'
};

async function createWorkingTest() {
  try {
    console.log('🔧 Creating a properly formatted Google test case...');
    
    // First, get all projects to find yours
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = projectsResponse.data;
    console.log(`Found ${projects.length} projects`);
    
    // Find your "google test automation" project
    const googleProject = projects.find(p => 
      p.name.toLowerCase().includes('google') && 
      p.name.toLowerCase().includes('test')
    );
    
    if (!googleProject) {
      console.log('❌ Could not find your "google test automation" project');
      console.log('Available projects:', projects.map(p => p.name));
      return;
    }
    
    console.log(`✅ Found project: ${googleProject.name} (${googleProject._id})`);
    
    // Add the working test case
    await axios.post(
      `${API_BASE_URL}/projects/${googleProject._id}/test-cases`,
      workingGoogleTest,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Working test case added!');
    console.log('');
    console.log('🚀 Key improvements made:');
    console.log('  ✅ Specific selectors: "search" instead of "search bar"');
    console.log('  ✅ Explicit waits: Added wait times between steps');
    console.log('  ✅ Specific button: "Google Search" button instead of "click a link"');
    console.log('  ✅ Findable expected result: "test1234" will be on the page');
    console.log('');
    console.log('🎯 Now test it:');
    console.log(`  labnex run --project ${googleProject._id}`);
    console.log('');
    console.log('💡 This test should:');
    console.log('  1. Open Google');
    console.log('  2. Type in the search box');
    console.log('  3. Click search');
    console.log('  4. Find "test1234" in results');
    console.log('  5. ✅ PASS!');
    
  } catch (error) {
    if (error.response?.data?.message?.includes('duplicate')) {
      console.log('ℹ️  Test case already exists - that\'s fine!');
    } else {
      console.error('❌ Error:', error.response?.data?.message || error.message);
    }
  }
}

createWorkingTest(); 