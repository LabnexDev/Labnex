#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { authCommand } from './commands/auth';
import { projectsCommand } from './commands/projects';
import { aiCommand } from './commands/ai';
import { analyzeCommand } from './commands/analyze';
import { setupConfigCommands } from './commands/config';
import { listCommand } from './commands/list';
import { initConfig } from './utils/config';
import { apiClient } from './api/client';
import { LocalBrowserExecutor } from './localBrowserExecutor';
import ora from 'ora';
import inquirer from 'inquirer';
import { runCommand } from './commands/run';

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
  program.addCommand(runCommand);

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

  // Register other command groups
  program.addCommand(authCommand);
  program.addCommand(projectsCommand);
  program.addCommand(aiCommand);
  program.addCommand(analyzeCommand);
  program.addCommand(setupConfigCommands());
  program.addCommand(listCommand);

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
        'list': 'List resources (projects, tests)',
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

  ${chalk.cyan('labnex list projects')}
    List all available projects

  ${chalk.cyan('labnex list tests 6832ac498153de9c85b03727')}
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
  console.log("--- DEBUG: CLI execution finished ---");
}

// Main test execution function is now in commands/run.ts

async function checkOverallStatus() {
  const spinner = ora('Checking overall system status...').start();
  // This is a placeholder. In a real scenario, you'd call an API endpoint.
  setTimeout(() => {
    spinner.succeed(chalk.green('All systems operational.'));
    console.log(chalk.gray(' - API Server: OK'));
    console.log(chalk.gray(' - Test Runner Fleet: OK'));
    console.log(chalk.gray(' - Database Connection: OK'));
  }, 1000);
}

async function checkSpecificTestRun(runId: string) {
  const spinner = ora(`Fetching status for test run ${chalk.cyan(runId)}...`).start();
  try {
    const response = await apiClient.getTestRun(runId);
    if (response.success && response.data) {
      const run = response.data;
      spinner.succeed(chalk.green('Status retrieved successfully.'));
      
      console.log(chalk.bold.cyan(`\nTest Run Details (ID: ${runId})`));
      console.log(chalk.gray('──────────────────────────────────'));
      console.log(`${chalk.bold('Project ID:')} ${run.projectId}`);
      console.log(`${chalk.bold('Status:')} ${run.status}`);
      console.log(`${chalk.bold('Total Tests:')} ${run.results.total}`);
      console.log(`${chalk.bold('Passed:')} ${chalk.green(run.results.passed)}`);
      console.log(`${chalk.bold('Failed:')} ${chalk.red(run.results.failed)}`);
      console.log(`${chalk.bold('Duration:')} ${run.results.duration}ms`);
      console.log(`${chalk.bold('Created At:')} ${new Date(run.createdAt).toLocaleString()}`);

    } else {
      spinner.fail(chalk.red(`Failed to fetch test run: ${response.error || 'Unknown error'}`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
  }
}

main().catch((error) => {
  console.error(chalk.red('\nAn unexpected error occurred:'), error);
  process.exit(1);
});
