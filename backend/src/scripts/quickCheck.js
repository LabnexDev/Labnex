const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

async function checkLatestTestRun() {
  const testRunId = '68314af6f7edb01d9a07bbf4'; // Latest test run
  
  try {
    console.log(`🔍 Checking test run: ${testRunId}`);
    
    const response = await axios.get(`${API_BASE_URL}/test-runs/${testRunId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const testRun = response.data.data;
    
    console.log('\n📊 Current Status:');
    console.log(`  Status: ${testRun.status}`);
    console.log(`  Total Tests: ${testRun.results.total}`);
    console.log(`  Passed: ${testRun.results.passed}`);
    console.log(`  Failed: ${testRun.results.failed}`);
    console.log(`  Duration: ${testRun.results.duration}ms`);
    console.log(`  Started: ${new Date(testRun.startedAt).toLocaleString()}`);
    
    if (testRun.completedAt) {
      console.log(`  ✅ Completed: ${new Date(testRun.completedAt).toLocaleString()}`);
    } else {
      console.log(`  ⏳ Still running...`);
    }
    
    if (testRun.error) {
      console.log(`  ❌ Error: ${testRun.error}`);
    }
    
    // Show individual test progress
    if (testRun.testResults && testRun.testResults.length > 0) {
      console.log('\n📝 Test Progress:');
      testRun.testResults.forEach((result, index) => {
        const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏳';
        console.log(`  ${index + 1}. ${status} ${result.status} (${result.duration}ms)`);
        if (result.message && result.status !== 'pending') {
          console.log(`     💬 ${result.message}`);
        }
        if (result.error) {
          console.log(`     ⚠️ ${result.error.substring(0, 100)}...`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

checkLatestTestRun(); 