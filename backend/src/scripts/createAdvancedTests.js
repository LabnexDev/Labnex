const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

// Advanced test cases for real websites
const advancedTests = [
  {
    title: 'Google Search Automation Test',
    description: 'Performs a search on Google and verifies results appear',
    steps: [
      'Navigate to https://www.google.com',
      'Wait for 3 seconds',
      'Type "browser automation testing" into search',
      'Wait for 2 seconds',
      'Click "Google Search" button',
      'Wait for 5 seconds',
      'Verify "automation" appears on page'
    ],
    expectedResult: 'automation',
    priority: 'HIGH'
  },
  {
    title: 'Wikipedia Search and Navigation',
    description: 'Searches for an article on Wikipedia and navigates to it',
    steps: [
      'Navigate to https://en.wikipedia.org',
      'Wait for 3 seconds',
      'Type "Puppeteer" into search',
      'Wait for 2 seconds',
      'Click "Search" button',
      'Wait for 5 seconds',
      'Verify "Puppeteer" appears on page'
    ],
    expectedResult: 'Puppeteer',
    priority: 'HIGH'
  },
  {
    title: 'GitHub Homepage Navigation',
    description: 'Navigates GitHub and checks key elements',
    steps: [
      'Navigate to https://github.com',
      'Wait for 4 seconds',
      'Verify "GitHub" appears on page',
      'Verify "Sign in" appears on page'
    ],
    expectedResult: 'GitHub',
    priority: 'MEDIUM'
  },
  {
    title: 'DuckDuckGo Search Test',
    description: 'Alternative search engine test with different UI elements',
    steps: [
      'Navigate to https://duckduckgo.com',
      'Wait for 3 seconds',
      'Type "web scraping best practices" into search',
      'Wait for 2 seconds',
      'Click "Search" button',
      'Wait for 5 seconds',
      'Verify "scraping" appears on page'
    ],
    expectedResult: 'scraping',
    priority: 'HIGH'
  },
  {
    title: 'Stack Overflow Browse Test',
    description: 'Navigates to Stack Overflow and browses content',
    steps: [
      'Navigate to https://stackoverflow.com',
      'Wait for 4 seconds',
      'Verify "Stack Overflow" appears on page',
      'Verify "Questions" appears on page'
    ],
    expectedResult: 'Stack Overflow',
    priority: 'MEDIUM'
  }
];

async function createAdvancedTests() {
  try {
    console.log('🚀 Creating advanced browser automation test cases...\n');
    
    // Get the existing project
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = projectsResponse.data;
    const cliProject = projects.find(p => p.name.includes('CLI Test Project'));
    
    if (!cliProject) {
      console.log('❌ Could not find CLI Test Project');
      return;
    }
    
    console.log(`✅ Found project: ${cliProject.name} (${cliProject.projectCode})\n`);
    
    // Add each advanced test case
    for (let i = 0; i < advancedTests.length; i++) {
      const testCase = advancedTests[i];
      
      try {
        await axios.post(
          `${API_BASE_URL}/projects/${cliProject._id}/test-cases`,
          testCase,
          {
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`✅ Added: ${testCase.title}`);
        console.log(`   Steps: ${testCase.steps.length}`);
        console.log(`   Target: ${testCase.steps[0].replace('Navigate to ', '')}`);
        console.log('');
        
      } catch (error) {
        if (error.response?.data?.message?.includes('duplicate')) {
          console.log(`ℹ️  ${testCase.title} already exists`);
        } else {
          console.log(`❌ Failed to add ${testCase.title}: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    
    console.log('🎯 Advanced test cases created!\n');
    
    console.log('🚀 Ready to test! Run these commands:');
    console.log(`   labnex run --project ${cliProject._id}`);
    console.log(`   labnex run --project ${cliProject.projectCode}`);
    console.log('');
    
    console.log('💡 What these tests demonstrate:');
    console.log('   🔍 Real website navigation (Google, Wikipedia, GitHub)');
    console.log('   ⌨️  Form input and typing automation');
    console.log('   🖱️  Button clicking and interaction');
    console.log('   ⏳ Dynamic waiting for page loads');
    console.log('   ✅ Content verification on real sites');
    console.log('   🌐 Different website structures and UIs');
    console.log('');
    
    console.log('⚠️  Note:');
    console.log('   • These tests interact with real websites');
    console.log('   • They may take 30s-2min each to complete');
    console.log('   • You\'ll see the browser performing each action');
    console.log('   • Some tests might occasionally fail due to site changes');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

createAdvancedTests(); 