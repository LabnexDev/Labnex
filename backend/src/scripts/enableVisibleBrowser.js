const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../services/testAutomation/browserTestExecutor.ts');

console.log('🔧 Enabling visible browser mode...');

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace headless: true with headless: false
  content = content.replace(/headless:\s*true/g, 'headless: false');
  
  // Write back to file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Browser is now set to visible mode!');
  console.log('🚀 Next time you run tests, you\'ll see the browser window pop up!');
  console.log('');
  console.log('To test it:');
  console.log('  cd ../packages/cli');
  console.log('  labnex run --project 683142fee637a782cd9c3862');
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 