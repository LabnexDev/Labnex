#!/usr/bin/env node

/**
 * Labnex CLI Verification Script
 * 
 * This script runs various commands to verify that the CLI is working correctly.
 * Usage: node verify-cli.js
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const CLI_COMMAND = 'node dist/index.js';
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || '6832ac498153de9c85b03727'; // Example ID - replace with real one

console.log(chalk.cyan('Labnex CLI Verification Script'));
console.log(chalk.gray('This script will verify that your CLI is working correctly.\n'));

// Helper function to run a command and log the results
function runCommand(command, description) {
  console.log(chalk.blue(`\n🔍 Testing: ${description}`));
  console.log(chalk.gray(`> ${command}`));
  
  try {
    const output = execSync(`${CLI_COMMAND} ${command}`, { encoding: 'utf8' });
    console.log(chalk.green('✅ Success!'));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Failed: ${error.message}`));
    return false;
  }
}

// Run verification tests
async function runVerification() {
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Version command
  totalTests++;
  if (runCommand('--version', 'CLI Version')) passedTests++;
  
  // Test 2: Help command
  totalTests++;
  if (runCommand('--help', 'Help System')) passedTests++;
  
  // Test 3: Projects command help
  totalTests++;
  if (runCommand('projects --help', 'Projects Command Help')) passedTests++;
  
  // Test 4: Auth command help
  totalTests++;
  if (runCommand('auth --help', 'Auth Command Help')) passedTests++;
  
  // Test 5: List command (this might fail if not authenticated)
  totalTests++;
  if (runCommand('list --projects', 'Project Listing (may require authentication)')) passedTests++;
  
  // Test 6: Status command
  totalTests++;
  if (runCommand('status', 'Status Command')) passedTests++;
  
  // Print summary
  console.log('\n' + chalk.cyan('===== Verification Summary ====='));
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log(chalk.green('\n✅ All verification tests passed!'));
    console.log(chalk.gray('Your CLI is working correctly.'));
  } else {
    console.log(chalk.yellow(`\n⚠️ ${totalTests - passedTests} tests failed.`));
    console.log(chalk.gray('Some functionality may not be working correctly.'));
    console.log(chalk.gray('See the VERIFY.md file for troubleshooting help.'));
  }
}

// Run the verification
runVerification().catch(error => {
  console.error(chalk.red('❌ Verification failed with error:'), error);
  process.exit(1);
}); 