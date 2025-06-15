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
      .action(async () => {
        try {
          const spinner = ora('Fetching projects...').start();
          const response = await apiClient.getProjects();

          if (response.success) {
            spinner.succeed('✅ Projects retrieved successfully!');
            
            console.log('\nAvailable Projects:\n');
            response.data.forEach((project: any) => {
              console.log(`  ${chalk.bold(project.name)} (Code: ${chalk.cyan(project.projectCode)}, ID: ${project._id})`);
              if (project.description) {
                console.log(`    ${chalk.gray(project.description)}`);
              }
            });
          } else {
            spinner.fail(chalk.red(`Failed to fetch projects: ${response.error}`));
          }
        } catch (error: any) {
          console.error(chalk.red(`Error: ${error.message}`));
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
  ); 