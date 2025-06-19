import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { apiClient } from '../api/client';

export const projectsCommand = new Command('projects')
  .description('Manage projects (create, list, show details)')
  .addCommand(
    new Command('list')
      .description('List all projects you have access to.')
      .option('-j, --json', 'Output as JSON')
      .action(async (options) => {
        try {
          const response = await apiClient.getProjects();
          
          if (response.success && response.data) {
            if (options.json) {
              if (process.env.NODE_ENV === 'development') {
                console.log(JSON.stringify(response.data, null, 2));
              } else {
                console.log(JSON.stringify(response.data));
              }
              return;
            }
            
            if (response.data.length === 0) {
              console.log(chalk.yellow('No projects found.'));
              return;
            }
            
            console.log(chalk.bold.cyan(`\n📁 Projects (${response.data.length})`));
            console.log(chalk.gray('─'.repeat(60)));
            
            response.data.forEach((project: any) => {
              console.log(`\n${chalk.cyan(project.name)} (${chalk.yellow(project.projectCode)})`);
              console.log(chalk.gray(`  ID: ${project._id}`));
              console.log(chalk.gray(`  Description: ${project.description || 'No description'}`));
              console.log(chalk.gray(`  Status: ${project.isActive ? 'Active' : 'Inactive'}`));
              console.log(chalk.gray(`  Test Cases: ${project.testCaseCount || 0}`));
              console.log(chalk.gray(`  Created: ${new Date(project.createdAt).toLocaleDateString()}`));
            });
          } else {
            console.error(chalk.red(`Failed to fetch projects: ${response.error || 'Unknown error'}`));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show detailed information about a specific project.')
      .argument('<projectId>', 'Project ID or project code')
      .action(async (projectId) => {
        try {
          // First try to get all projects to find by code
          const projectsResponse = await apiClient.getProjects();
          
          if (!projectsResponse.success) {
            console.error(chalk.red(`Failed to fetch projects: ${projectsResponse.error}`));
            return;
          }
          
          let project = projectsResponse.data.find((p: any) => p._id === projectId || p.projectCode === projectId);
          
          if (!project) {
            console.error(chalk.red(`Project not found: ${projectId}`));
            return;
          }
          
          await apiClient.displayProjectDetails(project);
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('create')
      .description('Create a new project.')
      .option('-n, --name <name>', 'Project name')
      .option('-c, --code <code>', 'Project code (unique identifier)')
      .option('-d, --description <description>', 'Project description')
      .action(async (options) => {
        try {
          let { name, code, description } = options;
          
          // Prompt for missing information
          if (!name) {
            const namePrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Project name:',
                validate: (input) => input.length > 0 || 'Name is required'
              }
            ]);
            name = namePrompt.name;
          }
          
          if (!code) {
            const codePrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'code',
                message: 'Project code (e.g., MYAPP):',
                validate: (input) => /^[A-Z0-9_-]+$/i.test(input) || 'Code must contain only letters, numbers, underscores, and hyphens'
              }
            ]);
            code = codePrompt.code;
          }
          
          if (!description) {
            const descPrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'description',
                message: 'Project description (optional):',
                default: ''
              }
            ]);
            description = descPrompt.description;
          }
          
          const response = await apiClient.createProject({
            name,
            projectCode: code,
            description: description || undefined
          });
          
          if (response.success) {
            console.log(chalk.green(`✓ Project created successfully!`));
            console.log(chalk.gray(`ID: ${response.data._id}`));
            console.log(chalk.gray(`Code: ${response.data.projectCode}`));
            
            const { showDetails } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'showDetails',
                message: 'Show project details?',
                default: true
              }
            ]);
            
            if (showDetails) {
              await apiClient.displayProjectDetails(response.data);
            }
          } else {
            console.error(chalk.red(`Failed to create project: ${response.error}`));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('info')
      .alias('details')
      .description('Show detailed information about a project and its resources.')
      .argument('<projectId>', 'Project ID or project code')
      .action(async (projectId) => {
        try {
          // Get project basic info
          const projectsResponse = await apiClient.getProjects();
          
          if (!projectsResponse.success) {
            console.error(chalk.red(`Failed to fetch projects: ${projectsResponse.error}`));
            return;
          }
          
          const project = projectsResponse.data.find((p: any) => p._id === projectId || p.projectCode === projectId);
          
          if (!project) {
            console.error(chalk.red(`Project not found: ${projectId}`));
            return;
          }
          
          console.log(chalk.cyan(`\n📁 ${project.name} (${project.projectCode})`));
          console.log(chalk.gray('─'.repeat(50)));
          
          // Basic project info
          console.log(`${chalk.bold('Description:')} ${project.description || 'No description'}`);
          console.log(`${chalk.bold('Status:')} ${project.isActive ? chalk.green('Active') : chalk.gray('Inactive')}`);
          console.log(`${chalk.bold('Created:')} ${new Date(project.createdAt).toLocaleDateString()}`);
          console.log(`${chalk.bold('Updated:')} ${new Date(project.updatedAt).toLocaleDateString()}`);
          
          // Resource counts
          console.log(`\n${chalk.bold('Resources:')}`);
          console.log(`  Test Cases: ${chalk.cyan(project.testCaseCount || 0)}`);
          console.log(`  Tasks: ${chalk.cyan(project.taskCount || 0)}`);
          console.log(`  Team Members: ${chalk.cyan(project.members?.length || 0)}`);
          
          // Get test cases
          try {
            const testCasesResponse = await apiClient.getTestCases(project._id);
            if (testCasesResponse.success && testCasesResponse.data.length > 0) {
              console.log(`\n${chalk.bold('Recent Test Cases:')}`);
              testCasesResponse.data.slice(0, 5).forEach((testCase: any) => {
                const statusColor = testCase.status === 'PASSED' ? chalk.green : 
                                  testCase.status === 'FAILED' ? chalk.red : chalk.yellow;
                console.log(`  • ${testCase.title} ${statusColor(`(${testCase.status})`)}`);
              });
              
              if (testCasesResponse.data.length > 5) {
                console.log(chalk.gray(`  ... and ${testCasesResponse.data.length - 5} more`));
              }
            }
          } catch (error) {
            // Silently continue if test cases can't be fetched
            if (process.env.NODE_ENV === 'development') {
              console.log(chalk.gray('Could not fetch test cases'));
            }
          }
          
          // Get recent test runs
          try {
            const testRunsResponse = await apiClient.getTestRuns(project._id);
            if (testRunsResponse.success && testRunsResponse.data.length > 0) {
              console.log(`\n${chalk.bold('Recent Test Runs:')}`);
              testRunsResponse.data.slice(0, 3).forEach((run: any) => {
                const statusColor = run.status === 'COMPLETED' ? chalk.green : 
                                  run.status === 'FAILED' ? chalk.red : chalk.yellow;
                console.log(`  • ${run._id} ${statusColor(`(${run.status})`)} - ${new Date(run.createdAt).toLocaleDateString()}`);
              });
            }
          } catch (error) {
            // Silently continue if test runs can't be fetched
            if (process.env.NODE_ENV === 'development') {
              console.log(chalk.gray('Could not fetch test runs'));
            }
          }
          
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  );

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