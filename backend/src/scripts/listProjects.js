const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MmE0OGJlMmU2ZmE0OWM1NTNhMDQ3NSIsImlhdCI6MTc0ODA1ODY1NSwiZXhwIjoxNzQ4NjYzNDU1fQ.OR9gK0OUJHclXpRy8flvP94gNu1X05fbYsYXkubh7ok';

async function listProjects() {
  try {
    console.log('📋 Fetching all projects...');
    
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = response.data;
    console.log(`\n✅ Found ${projects.length} projects:\n`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Code: ${project.code || 'N/A'}`);
      console.log(`   Description: ${project.description || 'No description'}`);
      console.log(`   Created: ${new Date(project.createdAt).toLocaleDateString()}`);
      console.log('');
    });
    
    if (projects.length > 0) {
      console.log('🎯 To run tests on any project:');
      projects.forEach(project => {
        console.log(`  labnex run --project ${project._id}`);
        if (project.code) {
          console.log(`  labnex run --project ${project.code}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching projects:', error.response?.data?.message || error.message);
  }
}

listProjects(); 