const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

const sampleTestCases = [
  {
    title: 'Google Search Test',
    description: 'Test Google search functionality',
    steps: [
      'Navigate to https://www.google.com',
      'Type "puppeteer browser automation" into search',
      'Click "Google Search" button',
      'Wait for 3 seconds',
      'Verify "puppeteer" appears on page'
    ],
    expectedResult: 'Search results should contain puppeteer information',
    priority: 'HIGH'
  },
  {
    title: 'GitHub Homepage Test',
    description: 'Test GitHub homepage navigation',
    steps: [
      'Navigate to https://github.com',
      'Wait for 2 seconds',
      'Click "Sign in" button',
      'Wait for 3 seconds',
      'Verify "Sign in to GitHub" appears on page'
    ],
    expectedResult: 'Should navigate to GitHub sign in page',
    priority: 'MEDIUM'
  }
];

async function addTestCasesToProject(projectId) {
  console.log(`Adding test cases to project: ${projectId}`);
  
  for (const testCase of sampleTestCases) {
    try {
      await axios.post(
        `${API_BASE_URL}/projects/${projectId}/test-cases`,
        testCase,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`  ✅ Added: ${testCase.title}`);
    } catch (error) {
      console.log(`  ⚠️ Error adding "${testCase.title}":`, error.response?.data?.message || error.message);
    }
  }
}

async function main() {
  // Add to google test automation project
  await addTestCasesToProject('68312c3207b507e8f9e1ee2b');
  console.log('\n✅ Done!');
}

main().catch(console.error); 