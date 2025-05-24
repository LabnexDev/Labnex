const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

// SUPER SIMPLE test case that WILL work reliably
const simpleWorkingTest = {
  title: 'Simple Example.com Test - CLI Automation',
  description: 'A very basic test case that uses a simple, stable website',
  steps: [
    'Navigate to https://example.com',
    'Wait for 3 seconds',
    'Verify "Example Domain" appears on page'
  ],
  expectedResult: 'Example Domain',
  priority: 'HIGH'
};

// More complex but still reliable test
const httpbinTest = {
  title: 'HTTPBin Basic Test - CLI Automation', 
  description: 'Test using HTTPBin which is designed for testing HTTP requests',
  steps: [
    'Navigate to https://httpbin.org',
    'Wait for 3 seconds',
    'Click "GET"',
    'Wait for 2 seconds',
    'Verify "httpbin" appears on page'
  ],
  expectedResult: 'httpbin',
  priority: 'HIGH'
};

async function createSimpleTests() {
  try {
    console.log('🔧 Creating SIMPLE, reliable test cases...');
    
    // Get projects
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = projectsResponse.data;
    console.log(`Found ${projects.length} projects`);
    
    // Find your project
    const googleProject = projects.find(p => 
      p.name.toLowerCase().includes('google') && 
      p.name.toLowerCase().includes('test')
    );
    
    if (!googleProject) {
      console.log('❌ Could not find your project');
      return;
    }
    
    console.log(`✅ Found project: ${googleProject.name} (${googleProject._id})`);
    
    // Add the simple test
    try {
      await axios.post(
        `${API_BASE_URL}/projects/${googleProject._id}/test-cases`,
        simpleWorkingTest,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Simple Example.com test added!');
    } catch (error) {
      if (error.response?.data?.message?.includes('duplicate')) {
        console.log('ℹ️  Example.com test already exists');
      }
    }
    
    // Add the HTTPBin test
    try {
      await axios.post(
        `${API_BASE_URL}/projects/${googleProject._id}/test-cases`,
        httpbinTest,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ HTTPBin test added!');
    } catch (error) {
      if (error.response?.data?.message?.includes('duplicate')) {
        console.log('ℹ️  HTTPBin test already exists');
      }
    }
    
    console.log('');
    console.log('🚀 Why these tests will work:');
    console.log('  ✅ example.com = Super simple, no redirects, fast loading');
    console.log('  ✅ httpbin.org = Designed for testing, very reliable');
    console.log('  ✅ No complex JavaScript or dynamic content');
    console.log('  ✅ Clear, findable text elements');
    console.log('');
    console.log('🎯 Test them:');
    console.log(`  labnex run --project ${googleProject._id}`);
    console.log('');
    console.log('💡 The Google issue:');
    console.log('  ❌ google.com redirects to workspace.google.com/gmail');
    console.log('  ❌ That page is complex and causes timeouts');
    console.log('  ✅ These simple sites will work much better!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

createSimpleTests(); 