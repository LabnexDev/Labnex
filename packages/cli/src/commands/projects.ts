import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiClient } from '../api/client';

export const projectsCommand = new Command('projects')
  .description('Project management commands')
  .alias('project')
  .addCommand(
    new Command('list')
      .description('List all projects')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          const spinner = ora('Fetching projects...').start();

          const response = await apiClient.getProjects();
          
          if (response.success) {
            spinner.succeed(`Found ${response.data.length} projects`);
            
            if (options.format === 'json') {
              console.log(JSON.stringify(response.data, null, 2));
            } else {
              displayProjectsTable(response.data);
            }
          } else {
            spinner.fail(chalk.red('Failed to fetch projects'));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('create')
      .description('Create a new project')
      .option('-n, --name <name>', 'Project name')
      .option('-c, --code <code>', 'Project code (3-5 chars)')
      .option('-d, --description <description>', 'Project description')
      .action(async (options) => {
        try {
          let { name, code, description } = options;

          // Interactive prompts if options not provided
          if (!name || !code) {
            const prompts = [];
            
            if (!name) {
              prompts.push({
                type: 'input',
                name: 'name',
                message: 'Project name:',
                validate: (input: string) => input.length > 0 || 'Name is required'
              });
            }
            
            if (!code) {
              prompts.push({
                type: 'input',
                name: 'code',
                message: 'Project code (3-5 chars):',
                validate: (input: string) => {
                  if (input.length < 3 || input.length > 5) {
                    return 'Code must be 3-5 characters';
                  }
                  if (!/^[A-Z0-9]+$/i.test(input)) {
                    return 'Code must be alphanumeric';
                  }
                  return true;
                },
                filter: (input: string) => input.toUpperCase()
              });
            }

            if (!description) {
              prompts.push({
                type: 'input',
                name: 'description',
                message: 'Description (optional):'
              });
            }

            if (prompts.length > 0) {
              const answers = await inquirer.prompt(prompts);
              name = name || answers.name;
              code = code || answers.code;
              description = description || answers.description;
            }
          }

          const spinner = ora('Creating project...').start();

          try {
            const response = await apiClient.createProject({
              name,
              projectCode: code.toUpperCase(),
              description
            });
            
            if (response.success) {
              spinner.succeed(chalk.green('Project created successfully'));
              console.log(chalk.gray(`ID: ${response.data._id}`));
              console.log(chalk.gray(`Code: ${response.data.projectCode}`));
            } else {
              spinner.fail(chalk.red('Failed to create project: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Creation failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show project details')
      .argument('<code>', 'Project code')
      .action(async (code) => {
        try {
          const spinner = ora('Fetching project details...').start();

          try {
            // Get all projects and find by code
            const response = await apiClient.getProjects();
            const project = response.data.find(p => p.projectCode === code.toUpperCase());
            
            if (!project) {
              spinner.fail(chalk.red(`Project not found: ${code}`));
              return;
            }

            const detailResponse = await apiClient.getProject(project._id);
            
            if (detailResponse.success) {
              spinner.succeed('Project details retrieved');
              displayProjectDetails(detailResponse.data);
            } else {
              spinner.fail(chalk.red('Failed to get project details'));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Failed to fetch project: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  );

function displayProjectsTable(projects: any[]) {
  if (projects.length === 0) {
    console.log(chalk.yellow('No projects found'));
    return;
  }

  const table = new Table({
    head: ['Code', 'Name', 'Status', 'Tests', 'Tasks', 'Members', 'Owner'],
    colWidths: [8, 25, 10, 8, 8, 10, 20]
  });

  projects.forEach(project => {
    table.push([
      chalk.cyan(project.projectCode),
      project.name,
      project.isActive ? chalk.green('Active') : chalk.gray('Inactive'),
      project.testCaseCount.toString(),
      project.taskCount.toString(),
      project.members.length.toString(),
      project.owner.name
    ]);
  });

  console.log(table.toString());
}

function displayProjectDetails(project: any) {
  console.log(chalk.cyan(`\n📁 ${project.name} (${project.projectCode})`));
  console.log(chalk.gray('─'.repeat(50)));
  
  console.log(`${chalk.bold('Description:')} ${project.description || 'No description'}`);
  console.log(`${chalk.bold('Status:')} ${project.isActive ? chalk.green('Active') : chalk.gray('Inactive')}`);
  console.log(`${chalk.bold('Owner:')} ${project.owner.name} (${project.owner.email})`);
  console.log(`${chalk.bold('Created:')} ${new Date(project.createdAt).toLocaleDateString()}`);
  console.log(`${chalk.bold('Updated:')} ${new Date(project.updatedAt).toLocaleDateString()}`);
  
  console.log(`\n${chalk.bold('Statistics:')}`);
  console.log(`  Test Cases: ${chalk.cyan(project.testCaseCount)}`);
  console.log(`  Tasks: ${chalk.cyan(project.taskCount)}`);
  console.log(`  Team Members: ${chalk.cyan(project.members.length)}`);

  if (project.members.length > 0) {
    console.log(`\n${chalk.bold('Team Members:')}`);
    const membersTable = new Table({
      head: ['Name', 'Email', 'Role'],
      colWidths: [20, 30, 15]
    });

    project.members.forEach((member: any) => {
      membersTable.push([
        member.name,
        member.email,
        member.role
      ]);
    });

    console.log(membersTable.toString());
  }
} 