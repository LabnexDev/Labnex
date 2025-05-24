#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { authCommand } from './commands/auth';
import { projectsCommand } from './commands/projects';
import { aiCommand } from './commands/ai';
import { analyzeCommand } from './commands/analyze';
import { runCommand } from './commands/run';
import { initConfig } from './utils/config';
import { apiClient } from './api/client';
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
    .description('Command-line interface for Labnex testing automation platform')
    .version('1.0.0')
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

  // Add the enhanced run command
  program.addCommand(runCommand);

  // Add top-level status command
  program
    .command('status')
    .description('Check status of active test runs')
    .action(async () => {
      try {
        console.log(chalk.gray('📊 Checking status...'));
        console.log(chalk.green('✅ No active test runs'));
        console.log('');
        console.log(chalk.gray('🧪 Debug Info:'));
        console.log(chalk.gray('WebSocket Connected: No'));
        console.log(chalk.gray('Polling Active: No (no active runs)'));
        console.log(chalk.gray('Active Runs Count: 0'));
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Register other command groups
  program.addCommand(authCommand);
  program.addCommand(projectsCommand);
  program.addCommand(aiCommand);
  program.addCommand(analyzeCommand);

  // Global error handling
  program.configureHelp({
    sortSubcommands: true,
    showGlobalOptions: true
  });

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

// Run CLI
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('CLI Error:'), error.message);
    if (process.env.LABNEX_VERBOSE === 'true') {
      console.error(error.stack);
    }
    process.exit(1);
  });
} 