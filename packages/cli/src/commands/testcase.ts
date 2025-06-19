import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { apiClient } from '../api/client';

export const createTestCaseCommand = new Command('create-test')
  .alias('ct')
  .description('Create a test case interactively.')
  .option('-p, --project <code>', 'Project code to add test case to')
  .option('-t, --title <title>', 'Test case title')
  .option('-d, --description <description>', 'Test case description')
  .option('--priority <priority>', 'Priority (LOW, MEDIUM, HIGH)', 'MEDIUM')
  .action(async (options) => {
    try {
      let { project, title, description, priority } = options;

      // Get project if not specified
      if (!project) {
        const projectsResponse = await apiClient.getProjects();
        if (!projectsResponse.success || projectsResponse.data.length === 0) {
          console.log(chalk.red('No projects available. Create a project first.'));
          return;
        }

        const projectPrompt = await inquirer.prompt([
          {
            type: 'list',
            name: 'project',
            message: 'Select a project:',
            choices: projectsResponse.data.map((p: any) => ({
              name: `${p.name} (${p.projectCode})`,
              value: p.projectCode
            }))
          }
        ]);
        project = projectPrompt.project;
      }

      // Get test case details
      if (!title) {
        const titlePrompt = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Test case title:',
            validate: (input) => input.length > 0 || 'Title is required'
          }
        ]);
        title = titlePrompt.title;
      }

      if (!description) {
        const descPrompt = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: 'Test case description:'
          }
        ]);
        description = descPrompt.description;
      }

      // Collect test steps
      const steps: string[] = [];
      let addingSteps = true;

      console.log(chalk.cyan('\nAdd test steps (enter empty step to finish):'));
      
      while (addingSteps) {
        const stepPrompt = await inquirer.prompt([
          {
            type: 'input',
            name: 'step',
            message: `Step ${steps.length + 1}:`
          }
        ]);

        if (stepPrompt.step.trim() === '') {
          addingSteps = false;
        } else {
          steps.push(stepPrompt.step.trim());
        }
      }

      if (steps.length === 0) {
        console.log(chalk.red('At least one test step is required.'));
        return;
      }

      // Get expected result
      const expectedPrompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'expectedResult',
          message: 'Expected result:',
          validate: (input) => input.length > 0 || 'Expected result is required'
        }
      ]);

      // Find project by code
      const projectsResponse = await apiClient.getProjects();
      const projectData = projectsResponse.data.find((p: any) => p.projectCode === project);
      
      if (!projectData) {
        console.error(chalk.red(`Project not found: ${project}`));
        return;
      }

      // Create test case
      const testCase = {
        title,
        description,
        steps,
        expectedResult: expectedPrompt.expectedResult,
        priority: priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'
      };

      const res = await apiClient.createTestCase(projectData._id, testCase);
      
      if (res.success) {
        console.log(chalk.green(`✓ Test case "${res.data.title}" created (id=${res.data._id})`));
      } else {
        console.error(chalk.red(`✗ Failed to create test case: ${res.error}`));
      }

    } catch (err: any) {
      console.error(chalk.red(`✗ ${err.message || err}`));
    }
  }); 