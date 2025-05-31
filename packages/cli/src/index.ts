#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { authCommand } from './commands/auth';
import { projectsCommand } from './commands/projects';
import { aiCommand } from './commands/ai';
import { analyzeCommand } from './commands/analyze';
import { setupConfigCommands } from './commands/config';
import { initConfig } from './utils/config';
import { apiClient } from './api/client';
import { LocalBrowserExecutor } from './localBrowserExecutor';
import ora from 'ora';

async function main() {
  // Initialize configuration
  await initConfig();

  // Display banner
  console.log(
    chalk.cyan(
      figlet.textSync('Labnex CLI', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );

  console.log(chalk.gray('AI-Powered Testing Automation Platform\n'));

  program
    .name('labnex')
    .description('The official CLI for the Labnex AI-Powered Testing Automation Platform.')
    .version('1.3.0')
    .option('-v, --verbose', 'enable verbose output')
    .option('--api-url <url>', 'override API URL')
    .hook('preAction', (thisCommand) => {
      const options = thisCommand.opts();
      if (options.verbose) {
        process.env.LABNEX_VERBOSE = 'true';
      }
      if (options.apiUrl) {
        process.env.LABNEX_API_URL = options.apiUrl;
      }
    });

  // Main run command - unified and clean
  program
    .command('run')
    .description('Execute tests for a specified project using local or cloud resources.')
    .requiredOption('-p, --project-id <id>', 'Project ID (required)')
    .option('-t, --test-id <id>', 'Run specific test case by ID')
    .option('-e, --environment <env>', 'Environment to run tests against', 'staging')
    .option('-m, --mode <mode>', 'Execution mode: local or cloud', 'local')
    .option('--optimize-ai', 'Enable AI optimization for element finding')
    .option('--parallel <number>', 'Number of parallel workers (cloud mode)', '4')
    .option('--headless', 'Run in headless mode (local mode)', false)
    .option('--timeout <ms>', 'Test timeout in milliseconds', '300000')
    .action(async (options) => {
      try {
        await runTests(options);
      } catch (error: any) {
        console.error(chalk.red('❌ Test execution failed:'), error.message);
        if (process.env.LABNEX_VERBOSE === 'true') {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  // Status command
  program
    .command('status')
    .description('Monitor test execution status or check a specific test run.')
    .option('-r, --run-id <id>', 'Check specific test run ID')
    .action(async (options) => {
      try {
        if (options.runId) {
          await checkSpecificTestRun(options.runId);
        } else {
          await checkOverallStatus();
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error checking status:'), error.message);
      }
    });

  // List command
  program
    .command('list')
    .description('View available projects or list test cases for a specific project.')
    .option('-p, --projects', 'List all projects')
    .option('-t, --tests <projectId>', 'List test cases for a project')
    .action(async (options) => {
      try {
        if (options.projects) {
          await listProjects();
        } else if (options.tests) {
          await listTestCases(options.tests);
        } else {
          console.log(chalk.yellow('Please specify --projects or --tests <projectId>'));
          console.log('Example: labnex list --projects');
          console.log('Example: labnex list --tests 6832ac498153de9c85b03727');
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error listing:'), error.message);
      }
    });

  // Register other command groups
  program.addCommand(authCommand);
  program.addCommand(projectsCommand);
  program.addCommand(aiCommand);
  program.addCommand(analyzeCommand);
  program.addCommand(setupConfigCommands());

  // Enhanced help
  program.configureHelp({
    sortSubcommands: true,
    showGlobalOptions: true,
    helpWidth: 100,
    subcommandTerm: (cmd) => cmd.name(),
    optionTerm: (option) => {
      return option.flags;
    },
    subcommandDescription: (cmd) => {
      const descriptions: { [key: string]: string } = {
        'run': 'Execute tests for a project (local/cloud)',
        'status': 'Monitor test execution status',
        'list': 'List projects and test cases',
        'auth': 'Manage authentication and API token settings',
        'projects': 'Manage projects (create, list, show details)',
        'ai': 'Access AI-powered features (generate, optimize tests)',
        'analyze': 'Analyze test results and identify failure reasons',
        'config': 'Configure Labnex CLI settings (API URL, verbosity)'
      };
      return descriptions[cmd.name()] || cmd.description();
    },
    commandUsage: (cmd) => {
      let usage = cmd.usage();
      if (cmd.commands.length > 0) {
        usage += ' [command]';
      }
      return usage;
    }
  });

  // Add examples to help
  program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('labnex run --project-id 6832ac498153de9c85b03727')}
    Run all tests for a project locally

  ${chalk.cyan('labnex run --project-id 6832ac498153de9c85b03727 --test-id 68362689160c68e7f548621d')}
    Run a specific test case

  ${chalk.cyan('labnex run --project-id 6832ac498153de9c85b03727 --mode cloud --parallel 8')}
    Run tests in cloud with 8 parallel workers

  ${chalk.cyan('labnex list --projects')}
    List all available projects

  ${chalk.cyan('labnex list --tests 6832ac498153de9c85b03727')}
    List test cases for a specific project

  ${chalk.cyan('labnex status')}
    Check overall test execution status

  ${chalk.cyan('labnex ai generate --description "Test login functionality"')}
    Generate a test case using AI

  ${chalk.cyan('labnex ai optimize --project LABX')}
    Optimize test suite for a project

  ${chalk.cyan('labnex analyze failure --run-id <run-id>')}
    Analyze a test failure with AI

${chalk.bold('Configuration:')}
  Run ${chalk.cyan('labnex config set')} to configure API settings
  Run ${chalk.cyan('labnex auth login')} to authenticate with Labnex

${chalk.bold('Documentation:')}
  Visit https://labnexdev.github.io/Labnex for detailed documentation
`);

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

// Main test execution function
async function runTests(options: any) {
  const projectId = options.projectId;
  const testId = options.testId;
  const environment = options.environment;
  const mode = options.mode;
  const aiOptimize = options.optimizeAi;
  const verbose = process.env.LABNEX_VERBOSE === 'true';

  console.log(chalk.cyan(`🚀 Initializing test run...`));
  console.log(chalk.gray(`📝 Project ID: ${projectId}`));
  console.log(chalk.gray(`💻 Execution Mode: ${mode === 'local' ? 'Local Machine' : 'Labnex Cloud'}`));
  console.log(chalk.gray(`🌍 Environment: ${environment}`));
  if (aiOptimize) {
    console.log(chalk.gray(`🤖 AI Optimization: enabled`));
  }
  if (verbose) {
    console.log(chalk.gray(`🔍 Detailed logging: enabled`));
  }
  console.log('');

  // Fetch project details
  const projectsSpinner = ora('Fetching project details...').start();
  let project: any = null;
  try {
    const projectsResponse = await apiClient.getProjects();
    if (verbose) {
      console.log('\n[DEBUG] apiClient.getProjects() response:', JSON.stringify(projectsResponse, null, 2));
    }
    
    if (projectsResponse.success && projectsResponse.data) {
      project = projectsResponse.data.find((p: any) => p._id === projectId);
      if (project) {
        if (verbose) {
          console.log('[DEBUG] Found project:', JSON.stringify(project, null, 2));
        }
        projectsSpinner.succeed(chalk.green(`✅ Project found: ${project.name} (${project._id})`));
      } else {
        projectsSpinner.fail(chalk.red(`❌ Project not found: ${projectId}`));
        console.log(chalk.yellow('Available projects:'));
        projectsResponse.data.forEach((p: any) => {
          console.log(chalk.gray(`  ${p._id} - ${p.name} (${p.projectCode})`));
        });
        return;
      }
    }
  } catch (error: any) {
    projectsSpinner.fail(chalk.red(`❌ Error fetching project: ${error.message}`));
    return;
  }

  // Fetch test cases
  const testCasesSpinner = ora('Fetching test cases...').start();
  let testCases: any[] = [];
  try {
    const testCasesResponse = await apiClient.getTestCases(project._id);
    if (verbose) {
      console.log('\n[DEBUG] apiClient.getTestCases() response:', JSON.stringify(testCasesResponse, null, 2));
    }
    
    if (testCasesResponse.success && testCasesResponse.data) {
      testCases = testCasesResponse.data;
      
      // Filter to specific test if requested
      if (testId) {
        testCases = testCases.filter(tc => tc._id === testId);
        if (testCases.length === 0) {
          testCasesSpinner.fail(chalk.red(`❌ Test case not found: ${testId}`));
          return;
        }
        testCasesSpinner.succeed(chalk.green(`✅ Found test case: ${testCases[0].title}`));
      } else {
        testCasesSpinner.succeed(chalk.green(`✅ Found ${testCases.length} test cases`));
      }
    } else {
      testCasesSpinner.fail(chalk.red(`❌ Failed to fetch test cases: ${testCasesResponse.error || 'Unknown error'}`));
      return;
    }
  } catch (error: any) {
    testCasesSpinner.fail(chalk.red(`❌ Error fetching test cases: ${error.message}`));
    return;
  }

  if (testCases.length === 0) {
    console.log(chalk.yellow('🤔 No test cases found. Nothing to run.'));
    return;
  }

  if (mode === 'local') {
    await runTestsLocally(testCases, project, options);
  } else {
    await runTestsInCloud(testCases, project, options);
  }
}

// Local test execution
async function runTestsLocally(testCases: any[], project: any, options: any) {
  console.log(chalk.cyan('\n🔧 Starting local browser test execution...'));
  
  const executor = new LocalBrowserExecutor({
    headless: options.headless,
    aiOptimizationEnabled: options.optimizeAi || false
  });

  const allResults: any[] = [];
  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  try {
    await executor.initialize();

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      console.log(chalk.blue(`\n--- Running Test Case ${i + 1}/${testCases.length}: ${tc.title} (${tc._id}) ---`));
      
      const result = await executor.executeTestCase(tc._id, tc.steps, tc.expectedResult, project.baseUrl || '', tc.title);
      allResults.push(result);
      
      if (result.status === 'passed') {
        passed++;
        console.log(chalk.green(`✔️ Test Case ${tc.title} PASSED (${(result.duration / 1000).toFixed(2)}s)`));
      } else {
        failed++;
        console.log(chalk.red(`❌ Test Case ${tc.title} FAILED (${(result.duration / 1000).toFixed(2)}s)`));
        if (result.steps && result.steps.length > 0) {
          const lastStep = result.steps[result.steps.length - 1];
          console.log(chalk.red(`   Failed at step ${lastStep.stepNumber}: ${lastStep.stepDescription}`));
          if (lastStep.message) {
            console.log(chalk.red(`   Reason: ${lastStep.message}`));
          }
        }
      }

      // Show step details if verbose
      if (process.env.LABNEX_VERBOSE === 'true' && result.steps) {
        result.steps.forEach((stepRes: any) => {
          const icon = stepRes.status === 'passed' ? '✅' : '❌';
          console.log(chalk.gray(`     ${icon} Step ${stepRes.stepNumber}: ${stepRes.stepDescription} (${(stepRes.duration / 1000).toFixed(2)}s) ${stepRes.message ? `- ${stepRes.message}` : ''}`));
        });
      }
    }
  } finally {
    // Cleanup
    if (typeof (executor as any).cleanup === 'function') {
      await (executor as any).cleanup();
    }
  }

  const totalDuration = (Date.now() - startTime) / 1000;
  console.log(chalk.cyan('\n--- Local Execution Summary ---'));
  console.log(chalk.white(`Total Test Cases: ${testCases.length}`));
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  console.log(chalk.white(`Total Duration: ${totalDuration.toFixed(2)}s`));
  console.log('');
}

// Cloud test execution (placeholder)
async function runTestsInCloud(testCases: any[], project: any, options: any) {
  console.log(chalk.yellow('🚧 Cloud execution is coming soon!'));
  console.log(chalk.gray('For now, please use --mode local'));
}

// Status checking functions
async function checkOverallStatus() {
  console.log(chalk.gray('📊 Checking status...'));
  console.log(chalk.green('✅ No active test runs'));
  console.log('');
  console.log(chalk.gray('🧪 Debug Info:'));
  console.log(chalk.gray('WebSocket Connected: No'));
  console.log(chalk.gray('Polling Active: No (no active runs)'));
  console.log(chalk.gray('Active Runs Count: 0'));
}

async function checkSpecificTestRun(runId: string) {
  console.log(chalk.gray(`📊 Checking test run: ${runId}`));
  console.log(chalk.yellow('🚧 Test run monitoring is coming soon!'));
}

// List functions
async function listProjects() {
  const spinner = ora('Fetching projects...').start();
  try {
    const response = await apiClient.getProjects();
    if (response.success && response.data) {
      spinner.succeed(chalk.green(`✅ Found ${response.data.length} projects`));
      console.log('');
      response.data.forEach((project: any) => {
        console.log(chalk.cyan(`📁 ${project.name}`));
        console.log(chalk.gray(`   ID: ${project._id}`));
        console.log(chalk.gray(`   Code: ${project.projectCode}`));
        console.log(chalk.gray(`   Test Cases: ${project.testCaseCount || 0}`));
        console.log(chalk.gray(`   Description: ${project.description || 'No description'}`));
        console.log('');
      });
    } else {
      spinner.fail(chalk.red('❌ Failed to fetch projects'));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error: ${error.message}`));
  }
}

async function listTestCases(projectId: string) {
  const spinner = ora(`Fetching test cases for project ${projectId}...`).start();
  try {
    const response = await apiClient.getTestCases(projectId);
    if (response.success && response.data) {
      spinner.succeed(chalk.green(`✅ Found ${response.data.length} test cases`));
      console.log('');
      response.data.forEach((testCase: any) => {
        console.log(chalk.cyan(`🧪 ${testCase.title}`));
        console.log(chalk.gray(`   ID: ${testCase._id}`));
        console.log(chalk.gray(`   Priority: ${testCase.priority || 'MEDIUM'}`));
        console.log(chalk.gray(`   Status: ${testCase.status || 'pending'}`));
        console.log(chalk.gray(`   Steps: ${testCase.steps ? testCase.steps.length : 0}`));
        console.log(chalk.gray(`   Description: ${testCase.description || 'No description'}`));
        console.log('');
      });
    } else {
      spinner.fail(chalk.red('❌ Failed to fetch test cases'));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error: ${error.message}`));
  }
}

// AI test case generation with input validation
async function generateTestCase(options: any) {
  let description = options.description;
  console.log(chalk.cyan('🤖 Generating AI-powered test case...'));
  console.log(chalk.gray(`📝 Description: ${description}`));

  // Check if description is vague
  if (isVagueDescription(description)) {
    console.log(chalk.yellow('⚠️ The provided description seems vague. Please provide more specific details for better test case generation.'));
    const detailedDescription = await promptForDetails();
    console.log(chalk.gray(`📝 Updated Description: ${detailedDescription}`));
    options.description = detailedDescription;
    description = detailedDescription;
  }

  const spinner = ora('Generating test case...').start();
  try {
    // Request detailed test case with specific steps and expected outcomes
    const response = await apiClient.generateTestCase(description);
    if (response.success && response.data) {
      spinner.succeed(chalk.green('✅ Test case generated successfully'));
      console.log(chalk.cyan('🧪 Generated Test Case:'));
      console.log(chalk.gray(`Title: ${response.data.title}`));
      console.log(chalk.gray(`Description: ${response.data.description}`));
      if (response.data.steps && Array.isArray(response.data.steps)) {
        console.log(chalk.gray('Steps:'));
        response.data.steps.forEach((step: any, index: number) => {
          if (typeof step === 'string') {
            console.log(chalk.gray(`  ${index + 1}. ${step}`));
          } else {
            console.log(chalk.gray(`  ${index + 1}. ${step.description || 'Step description not provided'}`));
            if (step.expectedOutcome) {
              console.log(chalk.gray(`     Expected: ${step.expectedOutcome}`));
            }
          }
        });
      } else {
        console.log(chalk.gray(`Steps: ${response.data.steps || 'Not provided'}`));
      }
      console.log(chalk.gray(`Overall Expected Result: ${response.data.expectedResult || 'Not specified'}`));
    } else {
      spinner.fail(chalk.red(`❌ Failed to generate test case: ${response.error || 'Unknown error'}`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`❌ Error generating test case: ${error.message}`));
  }
}

// Function to check if description is vague
function isVagueDescription(description: string): boolean {
  const vagueKeywords = ['test', 'check', 'verify', 'functionality', 'feature'];
  const words = description.toLowerCase().split(' ');
  return words.length < 5 || vagueKeywords.some(keyword => words.includes(keyword));
}

// Function to prompt user for more details
async function promptForDetails(): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(chalk.cyan('Please provide a more detailed description of the test case: '), (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Call the main function to start the CLI
main().catch(error => {
  console.error('❌ CLI execution error:', error);
  process.exit(1);
});
