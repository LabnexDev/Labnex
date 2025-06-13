import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../api/client';
import ora from 'ora';

export const listCommand = new Command('list')
  .description('List resources like projects and test cases.')
  .action(() => {
    // This is the action for the base 'list' command.
    // It will now show help by default because subcommands are required.
    console.log(chalk.yellow('Please specify what you want to list.'));
    console.log(`Example: ${chalk.cyan('labnex list projects')}`);
    listCommand.outputHelp();
  });

// Subcommand for listing projects
listCommand
  .command('projects')
  .description('List all available projects.')
  .action(async () => {
    const spinner = ora('Fetching projects...').start();
    try {
      const response = await apiClient.getProjects();
      if (response.success && response.data) {
        spinner.succeed(chalk.green('✅ Projects retrieved successfully!\n'));
        console.log(chalk.bold.underline('Available Projects:\n'));
        response.data.forEach((project: any) => {
          console.log(`  ${chalk.cyan(project.name)} (${chalk.gray(`ID: ${project._id}`)})`);
          console.log(`    ${chalk.gray(project.description || 'No description')}\n`);
        });
      } else {
        spinner.fail(chalk.red(`Failed to fetch projects: ${response.message}`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`❌ Error fetching projects: ${error.message}`));
    }
  });

// Subcommand for listing test cases
listCommand
  .command('tests <projectId>')
  .description('List all test cases for a specific project.')
  .action(async (projectId: string) => {
    const spinner = ora(`Fetching test cases for project ${projectId}...`).start();
    try {
      const response = await apiClient.getTestCases(projectId);
      if (response.success && response.data) {
        spinner.succeed(chalk.green('✅ Test cases retrieved successfully!\n'));
        console.log(chalk.bold.underline(`Test Cases for Project ${projectId}:\n`));
        if (response.data.length === 0) {
          console.log(chalk.yellow('  No test cases found for this project.'));
        } else {
          response.data.forEach((testCase: any) => {
            console.log(`  ${chalk.cyan(testCase.name)} (${chalk.gray(`ID: ${testCase._id}`)})`);
            console.log(`    ${chalk.gray(`Description: ${testCase.description || 'N/A'}`)}`);
            console.log(`    ${chalk.gray(`Priority: ${testCase.priority}`)}`);
            console.log(`    ${chalk.gray(`Last Run: ${testCase.lastRunStatus || 'Never'}`)}\n`);
          });
        }
      } else {
        spinner.fail(chalk.red(`Failed to fetch test cases: ${response.message}`));
      }
    } catch (error: any) {
      spinner.fail(chalk.red(`❌ Error fetching test cases: ${error.message}`));
    }
  }); 