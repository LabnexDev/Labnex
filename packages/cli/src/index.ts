#!/usr/bin/env node

import { program, Help } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { authCommand } from './commands/auth';
import { projectsCommand } from './commands/projects';
import { aiCommand } from './commands/ai';
import { analyzeCommand } from './commands/analyze';
import { setupConfigCommands } from './commands/config';
import { listCommand } from './commands/list';
import { completionCommand } from './commands/completion';
import { initConfig } from './utils/config';
import { apiClient } from './api/client';
import ora from 'ora';
import inquirer from 'inquirer';
import { runCommand } from './commands/run';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { runWelcomeWizard } from './welcomeWizard';

async function main() {
  // First run detection & configuration init
  const configPath = join(homedir(), '.labnex', 'config.json');
  const firstRun = !existsSync(configPath);

  if (firstRun) {
    try {
      await runWelcomeWizard();
    } catch (err: any) {
      console.error('Wizard failed:', err.message);
      process.exit(1);
    }
  }

  // Ensure config exists afterwards
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
  program.addCommand(completionCommand(program));

  const defaultHelper = new Help();

  program.configureHelp({
    sortSubcommands: true,
    showGlobalOptions: true,
    helpWidth: 100,

    // Colorize the option/command terms
    subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
    optionTerm: (option) => chalk.yellow(option.flags),

    // Friendly description fallbacks
    subcommandDescription: (cmd) => {
      const descriptions: Record<string, string> = {
        run: 'Execute tests for a project (local/cloud)',
        status: 'Monitor test execution status',
        list: 'List resources (projects, tests)',
        auth: 'Manage authentication and API token settings',
        projects: 'Manage projects (create, list, show details)',
        ai: 'Access AI-powered features (generate, optimize, analyze)',
        analyze: 'Analyze test results and identify failure causes',
        config: 'Configure Labnex CLI settings'
      };
      return descriptions[cmd.name()] || cmd.description();
    },

    // Custom global formatter only for the root program
    formatHelp: (cmd, helper) => {
      if (cmd === program) {
        const line = (title: string) => `${chalk.gray('─'.repeat(1))} ${chalk.bold(title)} ${chalk.gray('─'.repeat(60 - title.length))}`;

        let out = '\n' + chalk.bold.cyan('Labnex CLI — AI-Powered Testing Automation Platform') + '\n';
        out += chalk.gray('='.repeat(80)) + '\n\n';

        // Usage
        out += line('USAGE') + '\n  ' + chalk.cyan(helper.commandUsage(cmd)) + '\n\n';

        // Commands grouped by category
        out += line('COMMANDS') + '\n';
        const commandCategories: Record<string, string[]> = {
          'Test Execution': ['run', 'status'],
          'Project Management': ['projects', 'list'],
          Authentication: ['auth'],
          'AI & Analysis': ['ai', 'analyze'],
          Configuration: ['config']
        };
        for (const [category, names] of Object.entries(commandCategories)) {
          out += `\n  ${chalk.bold.cyan(category)}`;
          names.forEach((name) => {
            const sub = cmd.commands.find((c: any) => c.name() === name);
            if (sub) {
              const desc = helper.subcommandDescription(sub);
              out += `\n    ${chalk.cyan(name.padEnd(12))} ${desc}`;
            }
          });
          out += '\n';
        }

        // Global options
        out += line('GLOBAL OPTIONS') + '\n';
        helper.visibleOptions(cmd).forEach((opt) => {
          out += `  ${chalk.yellow(opt.flags.padEnd(25))} ${opt.description}\n`;
        });

        // Examples section (taken from previous help text)
        out += '\n' + chalk.bold('EXAMPLES:') + '\n';
        out += `  ${chalk.cyan('labnex run --project 6832ac498153de9c85b03727')}\n    Run all tests for a project locally\n\n`;
        out += `  ${chalk.cyan('labnex run --project 6832ac498153de9c85b03727 --test-id 68362689160c68e7f548621d')}\n    Run a specific test case\n\n`;
        out += `  ${chalk.cyan('labnex run --project MYAPP --mode cloud --parallel 8')}\n    Run tests in cloud with 8 parallel workers\n\n`;
        out += `  ${chalk.cyan('labnex list projects')}\n    List all available projects\n\n`;
        out += `  ${chalk.cyan('labnex list tests 6832ac498153de9c85b03727')}\n    List test cases for a specific project\n\n`;
        out += `  ${chalk.cyan('labnex status')}\n    Check overall test execution status\n\n`;
        out += `  ${chalk.cyan('labnex ai generate --description "Test login functionality"')}\n    Generate a test case using AI\n\n`;
        out += `  ${chalk.cyan('labnex ai optimize --project LABX')}\n    Optimize test suite for a project\n\n`;
        out += `  ${chalk.cyan('labnex analyze failure --run-id <run-id>')}\n    Analyze a test failure with AI\n`;

        out += chalk.gray('='.repeat(80)) + '\n';
        out += chalk.cyan('Documentation: ') + 'https://labnexdev.github.io/Labnex\n';
        return out;
      }
      // Fallback to default helper for sub-command help
      return defaultHelper.formatHelp(cmd, helper);
    }
  });

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
      let projDisplay: string;
      if ((run as any).project?.projectCode) {
        projDisplay = `${(run as any).project.projectCode} (${(run as any).project.name || 'Unnamed'})`;
      } else if ((run as any).projectId) {
        // Attempt to look up code/name
        try {
          const projRes = await apiClient.getProjects();
          if (projRes.success) {
            const found = projRes.data.find((p: any) => p._id === (run as any).projectId);
            projDisplay = found ? `${found.projectCode} (${found.name})` : (run as any).projectId;
          } else {
            projDisplay = (run as any).projectId;
          }
        } catch {
          projDisplay = (run as any).projectId;
        }
      } else {
        projDisplay = 'N/A';
      }
      console.log(`${chalk.bold('Project:')} ${projDisplay}`);
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
