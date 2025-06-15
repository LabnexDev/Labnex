import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiClient } from '../api/client';

export const listCommand = new Command('list')
  .description('List resources like projects and test cases.')
  .addCommand(
    new Command('projects')
      .description('List all available projects.')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          const spinner = ora('Fetching projects...').start();

          const response = await apiClient.getProjects();
          
          if (response.success) {
            spinner.succeed(`Found ${response.data.length} projects`);

            if (options.format === 'json') {
              console.log(JSON.stringify(response.data, null, 2));
              return;
            }

            // Table output
            const table = new Table({
              head: ['Project', 'Name', 'Tests', 'Status'],
              colWidths: [12, 24, 12, 12]
            });

            response.data.forEach((proj: any) => {
              table.push([
                proj.projectCode,
                proj.name,
                `${proj.testCaseCount} tests`,
                proj.isActive ? chalk.green('✅ Active') : chalk.gray('Inactive')
              ]);
            });

            console.log(table.toString());

          } else {
            spinner.fail(chalk.red('Failed to fetch projects'));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('tests')
      .description('List test cases for a specific project.')
      .argument('<projectCode>', 'The code of the project')
      .option('--format <fmt>', 'table or json', 'table')
      .action(async (projectCode, options) => {
        const spinner = ora(`Fetching test cases for project ${chalk.cyan(projectCode)}...`).start();
        try {
          // First, get the project ID from the code
          const projectsResponse = await apiClient.getProjects();
          if (!projectsResponse.success) {
            spinner.fail(chalk.red(`Failed to fetch projects: ${projectsResponse.error}`));
            return;
          }

          const project = projectsResponse.data.find(p => p.projectCode === projectCode.toUpperCase());
          if (!project) {
            spinner.fail(chalk.red(`Project with code "${projectCode}" not found.`));
            return;
          }

          const response = await apiClient.getTestCases(project._id);

          if (response.success) {
            spinner.succeed(`✅ Found ${response.data.length} test cases.`);
            
            if (options.format === 'json') {
              console.log(JSON.stringify(response.data, null, 2));
              return;
            }

            if (response.data.length === 0) {
              console.log(chalk.yellow('No test cases found for this project.'));
              return;
            }

            const table = new Table({
              head: ['ID', 'Title', 'Priority', 'Status'],
              colWidths: [30, 50, 10, 10],
            });

            response.data.forEach((test: any) => {
              table.push([test._id, test.title, test.priority, test.status]);
            });

            console.log(table.toString());
          } else {
            spinner.fail(chalk.red(`Failed to fetch test cases: ${response.error}`));
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Error: ${error.message}`));
          console.error(chalk.red(`Error details: ${error.stack}`));
        }
      })
  )
  .addCommand(
    new Command('runs')
      .description('List test runs for a specific project.')
      .argument('<projectCode>', 'The code of the project')
      .option('--format <fmt>', 'table or json', 'table')
      .action(async (projectCode, options) => {
        const spinner = ora(`Fetching test runs for project ${chalk.cyan(projectCode)}...`).start();
        try {
          const projectsResponse = await apiClient.getProjects();
          if (!projectsResponse.success) {
            spinner.fail(chalk.red(`Failed to fetch projects: ${projectsResponse.error}`));
            return;
          }

          const project = projectsResponse.data.find(p => p.projectCode === projectCode.toUpperCase());
          if (!project) {
            spinner.fail(chalk.red(`Project with code "${projectCode}" not found.`));
            return;
          }

          const runsResponse = await apiClient.getTestRuns(project._id);
          if (runsResponse.success) {
            spinner.succeed(`✅ Found ${runsResponse.data.length} runs.`);

            if (options.format === 'json') {
              console.log(JSON.stringify(runsResponse.data, null, 2));
              return;
            }

            if (runsResponse.data.length === 0) {
              console.log(chalk.yellow('No runs found for this project.'));
              return;
            }

            const table = new Table({
              head: ['Run ID', 'Status', 'Tests', 'Passed', 'Failed', 'Duration', 'Started'],
              colWidths: [26, 10, 8, 8, 8, 10, 22]
            });

            runsResponse.data.forEach((run: any) => {
              table.push([
                run._id,
                run.status,
                run.results?.total ?? '-',
                run.results?.passed ?? '-',
                run.results?.failed ?? '-',
                ((run.results?.duration || 0) / 1000).toFixed(1) + 's',
                new Date(run.createdAt).toLocaleString()
              ]);
            });

            console.log(table.toString());
          } else {
            spinner.fail(chalk.red(`Failed to fetch test runs: ${runsResponse.error}`));
          }
        } catch (error: any) {
          spinner.fail(chalk.red(`Error: ${error.message}`));
        }
      })
  ); 