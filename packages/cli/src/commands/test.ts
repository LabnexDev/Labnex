import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import WebSocket from 'ws';
import { apiClient, TestRun } from '../api/client';
import { loadConfig } from '../utils/config';

export const testCommand = new Command('test')
  .description('Test automation commands')
  .addCommand(
    new Command('run')
      .description('Run tests for a project')
      .option('-p, --project <code>', 'Project code')
      .option('--parallel <number>', 'Number of parallel workers', '4')
      .option('--env <environment>', 'Environment to run tests against', 'staging')
      .option('--ai', 'Enable AI optimization')
      .option('--suite <suite>', 'Test suite to run')
      .option('--watch', 'Watch mode for continuous testing')
      .option('--verbose', 'Show detailed action logs')
      .action(async (options) => {
        try {
          let projectCode = options.project;

          // Prompt for project if not provided
          if (!projectCode) {
            const projects = await apiClient.getProjects();
            if (projects.success && projects.data.length > 0) {
              const projectPrompt = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'project',
                  message: 'Select project:',
                  choices: projects.data.map(p => ({
                    name: `${p.name} (${p.projectCode})`,
                    value: p.projectCode
                  }))
                }
              ]);
              projectCode = projectPrompt.project;
            } else {
              console.log(chalk.red('No projects found. Create a project first.'));
              return;
            }
          }

          const config = {
            parallel: parseInt(options.parallel),
            environment: options.env,
            aiOptimization: !!options.ai,
            suite: options.suite,
            verbose: !!options.verbose
          };

          console.log(chalk.cyan(`\n🚀 Labnex CLI Test Runner v1.0.0`));
          console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
          
          console.log(chalk.white(`✓ Project: ${chalk.bold(projectCode)}`));
          console.log(chalk.white(`✓ Environment: ${chalk.bold(config.environment)}`));
          console.log(chalk.white(`✓ Parallel workers: ${chalk.bold(config.parallel)}`));
          if (config.aiOptimization) {
            console.log(chalk.magenta(`✓ AI optimization enabled`));
          }
          if (config.verbose) {
            console.log(chalk.gray(`✓ Verbose logging enabled`));
          }

          const spinner = ora('Initializing test automation...').start();

          try {
            // Find project by code
            const projects = await apiClient.getProjects();
            const project = projects.data.find(p => p.projectCode === projectCode);
            
            if (!project) {
              spinner.fail(chalk.red(`Project not found: ${projectCode}`));
              return;
            }

            // Create test run
            const testRunResponse = await apiClient.createTestRun(project._id, config);
            
            if (!testRunResponse.success) {
              spinner.fail(chalk.red('Failed to create test run: ' + testRunResponse.error));
              return;
            }

            const testRun = testRunResponse.data;
            spinner.succeed(chalk.green(`Test run initialized: ${testRun._id}`));

            // Start real-time monitoring with enhanced logging
            await monitorTestRunWithDetails(testRun._id, options.watch, options.verbose);

          } catch (error: any) {
            spinner.fail(chalk.red('Test run failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Check status of a test run')
      .argument('<runId>', 'Test run ID')
      .action(async (runId) => {
        try {
          const spinner = ora('Fetching test run status...').start();

          const response = await apiClient.getTestRun(runId);
          
          if (response.success) {
            spinner.succeed('Test run status retrieved');
            displayTestRunStatus(response.data);
          } else {
            spinner.fail(chalk.red('Failed to get test run status'));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('results')
      .description('View test results')
      .argument('<runId>', 'Test run ID')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (runId, options) => {
        try {
          const spinner = ora('Fetching test results...').start();

          const response = await apiClient.getTestRunResults(runId);
          
          if (response.success) {
            spinner.succeed('Test results retrieved');
            
            if (options.format === 'json') {
              console.log(JSON.stringify(response.data, null, 2));
            } else {
              displayTestResults(response.data);
            }
          } else {
            spinner.fail(chalk.red('Failed to get test results'));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('create')
      .description('Create a new test case')
      .option('-p, --project <code>', 'Project code')
      .option('--interactive', 'Interactive mode')
      .action(async (options) => {
        try {
          let projectCode = options.project;

          // Get project
          if (!projectCode) {
            const projects = await apiClient.getProjects();
            if (projects.success && projects.data.length > 0) {
              const projectPrompt = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'project',
                  message: 'Select project:',
                  choices: projects.data.map(p => ({
                    name: `${p.name} (${p.projectCode})`,
                    value: p.projectCode
                  }))
                }
              ]);
              projectCode = projectPrompt.project;
            }
          }

          // Interactive test case creation
          const testCaseData = await inquirer.prompt([
            {
              type: 'input',
              name: 'title',
              message: 'Test case title:',
              validate: input => input.length > 0 || 'Title is required'
            },
            {
              type: 'input',
              name: 'description',
              message: 'Description (optional):'
            },
            {
              type: 'list',
              name: 'priority',
              message: 'Priority:',
              choices: ['LOW', 'MEDIUM', 'HIGH'],
              default: 'MEDIUM'
            },
            {
              type: 'input',
              name: 'steps',
              message: 'Test steps (comma-separated):',
              validate: input => input.length > 0 || 'At least one step is required',
              filter: input => input.split(',').map((s: string) => s.trim())
            },
            {
              type: 'input',
              name: 'expectedResult',
              message: 'Expected result:',
              validate: input => input.length > 0 || 'Expected result is required'
            }
          ]);

          const spinner = ora('Creating test case...').start();

          try {
            const projects = await apiClient.getProjects();
            const project = projects.data.find(p => p.projectCode === projectCode);
            
            const response = await apiClient.createTestCase(project!._id, testCaseData);
            
            if (response.success) {
              spinner.succeed(chalk.green('Test case created successfully'));
              console.log(chalk.gray(`ID: ${response.data._id}`));
            } else {
              spinner.fail(chalk.red('Failed to create test case'));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Creation failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  );

async function monitorTestRunWithDetails(runId: string, watchMode: boolean = false, verbose: boolean = false) {
  const config = await loadConfig();
  const wsUrl = config.apiUrl.replace('http', 'ws') + `/test-runs/${runId}/stream`;
  
  console.log(chalk.cyan('\n🏃 Starting test execution...\n'));
  
  const ws = new WebSocket(wsUrl, {
    headers: { Authorization: `Bearer ${config.token}` }
  });

  let testStartTime = Date.now();

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log(chalk.gray('🔗 Connected to test automation stream\n'));
    });

    ws.on('message', (data) => {
      try {
        const update = JSON.parse(data.toString());
        handleEnhancedTestUpdate(update, verbose, testStartTime);
        
        if (update.type === 'completed' && !watchMode) {
          ws.close();
          resolve(update);
        }
      } catch (error) {
        console.error(chalk.red('Failed to parse update:'), error);
      }
    });

    ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error);
      reject(error);
    });

    ws.on('close', () => {
      if (!watchMode) {
        console.log(chalk.gray('\n📊 Test monitoring completed'));
      }
    });
  });
}

function handleEnhancedTestUpdate(update: any, verbose: boolean, startTime: number) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  switch (update.type) {
    case 'ai_analysis':
      console.log(chalk.magenta('🧠 AI Analysis:'));
      console.log(chalk.gray(`   • Analyzing test suite and optimizing execution order`));
      console.log(chalk.gray(`   • Code changes detected: ${update.changesDetected || 'None'}`));
      console.log(chalk.gray(`   • Estimated time: ${update.estimatedTime || '2.5 minutes'}\n`));
      break;

    case 'browser_launch':
      console.log(chalk.blue('🌐 Browser Environment:'));
      console.log(chalk.gray(`   • Launching ${update.browser || 'Chrome'} browser`));
      console.log(chalk.gray(`   • Window size: ${update.viewport || '1920x1080'}`));
      console.log(chalk.gray(`   • User agent: ${update.userAgent || 'Labnex/1.0'}\n`));
      break;

    case 'navigation':
      console.log(chalk.cyan(`🔗 [${elapsed}s] Navigating to: ${chalk.underline(update.url)}`));
      if (update.loadTime) {
        console.log(chalk.gray(`   • Page load time: ${update.loadTime}ms`));
      }
      if (update.responseCode) {
        const statusColor = update.responseCode < 400 ? chalk.green : chalk.red;
        console.log(chalk.gray(`   • HTTP response: ${statusColor(update.responseCode)}`));
      }
      break;

    case 'action':
      const actionIcon = getActionIcon(update.action);
      console.log(chalk.white(`${actionIcon} [${elapsed}s] ${update.description}`));
      
      if (verbose) {
        if (update.selector) {
          console.log(chalk.gray(`   • Element: ${update.selector}`));
        }
        if (update.value !== undefined) {
          console.log(chalk.gray(`   • Value: "${update.value}"`));
        }
        if (update.timing) {
          console.log(chalk.gray(`   • Execution time: ${update.timing}ms`));
        }
      }
      break;

    case 'assertion':
      const assertIcon = update.passed ? chalk.green('✓') : chalk.red('✗');
      console.log(`${assertIcon} [${elapsed}s] ${update.description}`);
      
      if (verbose) {
        if (update.expected !== undefined) {
          console.log(chalk.gray(`   • Expected: ${update.expected}`));
        }
        if (update.actual !== undefined) {
          console.log(chalk.gray(`   • Actual: ${update.actual}`));
        }
      }
      break;

    case 'performance':
      console.log(chalk.yellow('⚡ Performance Metrics:'));
      console.log(chalk.gray(`   • Page load: ${update.pageLoad || 'N/A'}ms`));
      console.log(chalk.gray(`   • First paint: ${update.firstPaint || 'N/A'}ms`));
      console.log(chalk.gray(`   • Interactive: ${update.timeToInteractive || 'N/A'}ms`));
      console.log(chalk.gray(`   • Network requests: ${update.networkRequests || 0}`));
      break;

    case 'screenshot':
      console.log(chalk.blue(`📸 [${elapsed}s] Screenshot captured: ${update.filename}`));
      break;

    case 'test_started':
      console.log(chalk.cyan(`\n🧪 Starting: ${chalk.bold(update.testName)}`));
      if (update.description) {
        console.log(chalk.gray(`   ${update.description}`));
      }
      console.log(chalk.gray('   ───────────────────────────────────────'));
      break;

    case 'test_completed':
      const duration = update.result.duration || 0;
      const status = update.result.status === 'PASSED' ? 
        chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
      
      console.log(chalk.gray('   ───────────────────────────────────────'));
      console.log(`${status} ${chalk.bold(update.result.title)} (${duration}ms)`);
      
      if (update.result.metrics) {
        console.log(chalk.gray(`   • Actions performed: ${update.result.metrics.actions || 0}`));
        console.log(chalk.gray(`   • Assertions checked: ${update.result.metrics.assertions || 0}`));
        console.log(chalk.gray(`   • Average response time: ${update.result.metrics.avgResponseTime || 0}ms`));
      }
      
      if (update.result.status === 'FAILED' && update.result.error) {
        console.log(chalk.red(`   • Error: ${update.result.error}`));
      }
      console.log('');
      break;

    case 'progress':
      const progress = Math.round((update.completed / update.total) * 100);
      const progressBar = generateProgressBar(progress);
      console.log(chalk.blue(`📊 Progress: ${update.completed}/${update.total} ${progressBar} ${progress}%`));
      break;

    case 'network_request':
      if (verbose) {
        const method = update.method || 'GET';
        const statusColor = update.status < 400 ? chalk.green : chalk.red;
        console.log(chalk.gray(`🌐 ${method} ${update.url} → ${statusColor(update.status)} (${update.responseTime}ms)`));
      }
      break;

    case 'completed':
      console.log(chalk.green('\n🎉 Test Run Completed!\n'));
      displayEnhancedTestResults(update.testRun);
      break;

    case 'error':
      console.log(chalk.red(`❌ [${elapsed}s] Error: ${update.message}`));
      if (update.stack && verbose) {
        console.log(chalk.gray(update.stack));
      }
      break;

    case 'warning':
      console.log(chalk.yellow(`⚠️  [${elapsed}s] Warning: ${update.message}`));
      break;
  }
}

function getActionIcon(action: string): string {
  const icons: { [key: string]: string } = {
    'click': '🖱️ ',
    'type': '⌨️ ',
    'scroll': '📜',
    'hover': '👆',
    'select': '📋',
    'upload': '📤',
    'download': '📥',
    'drag': '🫴',
    'wait': '⏱️ ',
    'refresh': '🔄',
    'back': '⬅️ ',
    'forward': '➡️ ',
    'clear': '🧹'
  };
  return icons[action.toLowerCase()] || '⚡';
}

function generateProgressBar(percentage: number, length: number = 20): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function displayEnhancedTestResults(testRun: TestRun) {
  // Summary table
  const summaryTable = new Table({
    head: [chalk.bold('Metric'), chalk.bold('Value')],
    colWidths: [25, 30],
    style: { head: [], border: [] }
  });

  const duration = ((testRun.results.duration || 0) / 1000).toFixed(1);
  const successRate = testRun.results.total > 0 ? 
    Math.round((testRun.results.passed / testRun.results.total) * 100) : 0;

  summaryTable.push(
    ['📊 Total Tests', chalk.white(testRun.results.total.toString())],
    ['✅ Passed', chalk.green(testRun.results.passed.toString())],
    ['❌ Failed', testRun.results.failed > 0 ? chalk.red(testRun.results.failed.toString()) : chalk.gray('0')],
    ['⏱️  Duration', chalk.white(`${duration}s`)],
    ['📈 Success Rate', `${chalk.cyan(successRate.toString())}%`],
    ['🏁 Status', getStatusColor(testRun.status)]
  );

  console.log(summaryTable.toString());

  // Performance summary (will be available once backend implements performance tracking)
  // if ((testRun.results as any).performance) {
  //   console.log(chalk.yellow('\n⚡ Performance Summary:'));
  //   console.log(chalk.gray(`   • Average page load: ${(testRun.results as any).performance.avgPageLoad || 'N/A'}ms`));
  //   console.log(chalk.gray(`   • Total network requests: ${(testRun.results as any).performance.totalRequests || 0}`));
  //   console.log(chalk.gray(`   • Average response time: ${(testRun.results as any).performance.avgResponseTime || 'N/A'}ms`));
  // }

  console.log(chalk.cyan(`\n🔗 View detailed report: ${chalk.underline(`https://labnexdev.github.io/Labnex/reports/${testRun._id}`)}`));
}

function displayTestRunStatus(testRun: TestRun) {
  const table = new Table({
    head: ['Property', 'Value'],
    colWidths: [20, 40]
  });

  table.push(
    ['ID', testRun._id],
    ['Status', getStatusColor(testRun.status)],
    ['Total Tests', testRun.results.total.toString()],
    ['Passed', chalk.green(testRun.results.passed.toString())],
    ['Failed', chalk.red(testRun.results.failed.toString())],
    ['Duration', `${testRun.results.duration}ms`],
    ['Created', new Date(testRun.createdAt).toLocaleString()]
  );

  console.log(table.toString());
}

function displayTestResults(results: any) {
  const table = new Table({
    head: ['Test Case', 'Status', 'Duration', 'Actions', 'Message'],
    colWidths: [25, 10, 10, 10, 35]
  });

  results.testCases.forEach((test: any) => {
    table.push([
      test.title,
      test.status === 'PASSED' ? chalk.green('PASS') : chalk.red('FAIL'),
      `${test.duration}ms`,
      test.actionCount || 0,
      test.message || ''
    ]);
  });

  console.log(table.toString());
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return chalk.green(status);
    case 'RUNNING': return chalk.blue(status);
    case 'FAILED': return chalk.red(status);
    case 'PENDING': return chalk.yellow(status);
    default: return status;
  }
} 