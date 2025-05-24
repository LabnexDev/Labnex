const axios = require('axios');

// Configuration - update these based on your CLI config
const API_BASE_URL = 'http://localhost:5000/api'; // Update if different
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok'; // Your actual token

// Sample test cases for browser automation
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
  },
  {
    title: 'DuckDuckGo Search Test',
    description: 'Test DuckDuckGo search engine',
    steps: [
      'Navigate to https://duckduckgo.com',
      'Type "browser automation testing" into search',
      'Click search button',
      'Wait for 5 seconds',
      'Verify "automation" appears on page'
    ],
    expectedResult: 'Search results should contain automation-related content',
    priority: 'MEDIUM'
  },
  {
    title: 'Example Website Test',
    description: 'Test basic website functionality',
    steps: [
      'Navigate to https://example.com',
      'Wait for 3 seconds',
      'Verify "Example Domain" appears on page',
      'Scroll down',
      'Wait for 2 seconds'
    ],
    expectedResult: 'Should successfully load example.com and display content',
    priority: 'LOW'
  }
];

async function addTestCasesToProject(projectId, authToken) {
  console.log(`\nAdding test cases to project: ${projectId}`);
  
  for (const testCase of sampleTestCases) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/test-cases`,
        testCase,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`  ✅ Added: ${testCase.title}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('duplicate')) {
        console.log(`  ⚠️  Skipped (already exists): ${testCase.title}`);
      } else {
        console.error(`  ❌ Error adding "${testCase.title}":`, error.response?.data?.message || error.message);
      }
    }
  }
}

async function main() {
  try {
    // First, get all projects
    console.log('Fetching projects...');
    
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = projectsResponse.data;
        console.log(`Found ${projects.length} projects`);        // Target the specific projects that were failing in the user's logs    const targetProjectIds = [      '683142fee637a782cd9c3862', // CLI project1 (was returning 400)      '68312c3207b507e8f9e1ee2b', // google test automation (quick failures)    ];
    
    for (const projectId of targetProjectIds) {
      const project = projects.find(p => p._id === projectId);
      if (project) {
        console.log(`\nProcessing project: ${project.name} (${project._id})`);
        
        // Check if project already has test cases
        try {
          const testCasesResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}/test-cases`, {
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          const existingTestCases = testCasesResponse.data;
          
          if (existingTestCases.length === 0) {
            console.log('  No test cases found. Adding sample test cases...');
            await addTestCasesToProject(projectId, AUTH_TOKEN);
          } else {
            console.log(`  Already has ${existingTestCases.length} test cases. Skipping.`);
          }
        } catch (error) {
          console.error(`  ❌ Error checking test cases for project ${projectId}:`, error.response?.data?.message || error.message);
        }
      } else {
        console.log(`⚠️  Project ${projectId} not found in your projects list`);
      }
    }
    
    console.log('\n✅ Process completed!');
    console.log('\nNow try running your CLI commands again:');
    console.log('labnex run --project 683142fee637a782cd9c3862');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication failed. Please update the AUTH_TOKEN in this script.');
      console.log('You can get your token from: ~/.labnex/config.json');
    }
  }
}

// Instructions for the user
console.log('🚀 Test Case Addition Script');
console.log('=============================');
console.log('');
console.log('BEFORE RUNNING THIS SCRIPT:');
console.log('1. Make sure your backend is running');
console.log('2. Update AUTH_TOKEN with your JWT token from ~/.labnex/config.json');
console.log('3. Update API_BASE_URL if your backend is not on localhost:5000');
console.log('');

if (AUTH_TOKEN === 'your-jwt-token-here') {
  console.log('❌ Please update the AUTH_TOKEN in this script first!');
  console.log('You can find your token in: ~/.labnex/config.json');
  process.exit(1);
}

main().catch(console.error); 