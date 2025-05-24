const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

const quickTest = {
  title: 'Simple Example.com Test',
  description: 'Quick test to verify browser automation is working',
  steps: [
    'Navigate to https://example.com',
    'Wait for 2 seconds',
    'Verify "Example Domain" appears on page'
  ],
  expectedResult: 'Example Domain',
  priority: 'HIGH'
};

async function addQuickTest() {
  const projectId = '683142fee637a782cd9c3862'; // CLI project1
  
  try {
    console.log('Adding quick test...');
    
    await axios.post(
      `${API_BASE_URL}/projects/${projectId}/test-cases`,
      quickTest,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Quick test added!');
    console.log('🚀 Now run: labnex run --project 683142fee637a782cd9c3862');
    console.log('   This should complete in ~30 seconds and pass!');
    
  } catch (error) {
    console.log('⚠️ Error:', error.response?.data?.message || error.message);
  }
}

addQuickTest(); 