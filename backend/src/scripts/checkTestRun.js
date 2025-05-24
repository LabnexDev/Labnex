const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

async function checkTestRun(runId) {
  try {
    console.log(`🔍 Checking test run: ${runId}`);
    
    const response = await axios.get(`${API_BASE_URL}/test-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const testRun = response.data.data;
    
    console.log('\n📊 Test Run Status:');
    console.log(`  Status: ${testRun.status}`);
    console.log(`  Total Tests: ${testRun.results.total}`);
    console.log(`  Passed: ${testRun.results.passed}`);
    console.log(`  Failed: ${testRun.results.failed}`);
    console.log(`  Pending: ${testRun.results.pending || (testRun.results.total - testRun.results.passed - testRun.results.failed)}`);
    console.log(`  Duration: ${testRun.results.duration}ms`);
    console.log(`  Started: ${new Date(testRun.startedAt).toLocaleTimeString()}`);
    if (testRun.completedAt) {
      console.log(`  Completed: ${new Date(testRun.completedAt).toLocaleTimeString()}`);
    }
    
    if (testRun.error) {
      console.log(`  Error: ${testRun.error}`);
    }
    
    // Check individual test results if available
    if (testRun.testResults && testRun.testResults.length > 0) {
      console.log('\n📝 Individual Test Results:');
      testRun.testResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.testCaseId}: ${result.status} (${result.duration}ms)`);
        if (result.message) console.log(`     Message: ${result.message}`);
        if (result.error) console.log(`     Error: ${result.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching test run:', error.response?.data?.message || error.message);
  }
}

// Check the latest test runsconst testRunIds = [  '68314af6f7edb01d9a07bbf4', // Latest test run (after Chrome install)  '68314a5cf7edb01d9a07bb46', // Previous with AI optimization];

async function main() {
  for (const runId of testRunIds) {
    await checkTestRun(runId);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

main().catch(console.error); 