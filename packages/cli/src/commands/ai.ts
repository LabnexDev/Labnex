import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api/client';

export const aiCommand = new Command('ai')
  .description('Access AI-powered features like test generation and optimization.')
  .addCommand(
    new Command('generate')
      .description('Generate a new test case using AI based on a description.')
      .option('-d, --description <description>', 'Test description')
      .option('-p, --project <code>', 'Project code to add test case to')
      .action(async (options) => {
        try {
          let { description, project } = options;

          // Prompt for description if not provided
          if (!description) {
            const descPrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'description',
                message: 'Describe what you want to test:',
                validate: (input) => input.length > 0 || 'Description is required'
              }
            ]);
            description = descPrompt.description;
          }

          const spinner = ora('Generating test case with AI...').start();

          try {
            const response = await apiClient.generateTestCase(description);
            
            if (response.success) {
              spinner.succeed(chalk.green('Test case generated successfully'));
              
              console.log(chalk.cyan('\n📝 Generated Test Case:'));
              console.log(chalk.gray('─'.repeat(50)));
              console.log(`${chalk.bold('Title:')} ${response.data.title}`);
              console.log(`${chalk.bold('Description:')} ${response.data.description}`);
              console.log(`${chalk.bold('Expected Result:')} ${response.data.expectedResult}`);
              
              console.log(`\n${chalk.bold('Steps:')}`);
              response.data.steps.forEach((step, index) => {
                console.log(`  ${index + 1}. ${step}`);
              });

              // Save to project if provided
              if (project) {
                const saveSpinner = ora('Saving test case to specified project...').start();
                try {
                  const saveResponse = await apiClient.createTestCase(project, {
                    title: response.data.title,
                    description: response.data.description,
                    steps: response.data.steps,
                    expectedResult: response.data.expectedResult,
                    priority: 'MEDIUM'
                  });
                  
                  if (saveResponse.success) {
                    saveSpinner.succeed(chalk.green('Test case saved to project'));
                  } else {
                    saveSpinner.fail(chalk.red('Failed to save test case'));
                  }
                } catch (error: any) {
                  saveSpinner.fail(chalk.red('Save failed: ' + error.message));
                }
              } else {
                // Ask if user wants to save to project
                const savePrompt = await inquirer.prompt([
                  {
                    type: 'confirm',
                    name: 'save',
                    message: 'Save this test case to a project?',
                    default: false
                  }
                ]);

                if (savePrompt.save) {
                  const projects = await apiClient.getProjects();
                  if (projects.success && projects.data.length > 0) {
                    const projectPrompt = await inquirer.prompt([
                      {
                        type: 'list',
                        name: 'project',
                        message: 'Select project:',
                        choices: projects.data.map(p => ({
                          name: `${p.name} (${p.projectCode})`,
                          value: p._id
                        }))
                      }
                    ]);
                    
                    const saveSpinner = ora('Saving test case...').start();
                    
                    try {
                      const saveResponse = await apiClient.createTestCase(projectPrompt.project, {
                        title: response.data.title,
                        description: response.data.description,
                        steps: response.data.steps,
                        expectedResult: response.data.expectedResult,
                        priority: 'MEDIUM'
                      });
                      
                      if (saveResponse.success) {
                        saveSpinner.succeed(chalk.green('Test case saved to project'));
                      } else {
                        saveSpinner.fail(chalk.red('Failed to save test case'));
                      }
                    } catch (error: any) {
                      saveSpinner.fail(chalk.red('Save failed: ' + error.message));
                    }
                  }
                }
              }
            } else {
              spinner.fail(chalk.red('Failed to generate test case: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Generation failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('optimize')
      .description('Optimize a project\'s test suite using AI to select relevant tests.')
      .option('-p, --project <code>', 'Project code')
      .option('--changes <files>', 'Comma-separated list of changed files')
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

          const codeChanges = options.changes ? options.changes.split(',').map((f: string) => f.trim()) : undefined;

          const spinner = ora('Analyzing test suite with AI...').start();

          try {
            const projects = await apiClient.getProjects();
            const project = projects.data.find(p => p.projectCode === projectCode);
            
            if (!project) {
              spinner.fail(chalk.red(`Project not found: ${projectCode}`));
              return;
            }

            const response = await apiClient.optimizeTestSuite(project._id, codeChanges);
            
            if (response.success) {
              spinner.succeed(chalk.green('Test suite optimization completed'));
              
              console.log(chalk.cyan('\n🧠 AI Optimization Results:'));
              console.log(chalk.gray('─'.repeat(50)));
              console.log(`${chalk.bold('Selected Tests:')} ${response.data.selectedTests.length}`);
              console.log(`${chalk.bold('Reasoning:')} ${response.data.reasoning}`);
              
              if (response.data.selectedTests.length > 0) {
                console.log(`\n${chalk.bold('Recommended Tests:')}`);
                response.data.selectedTests.forEach((testId: string, index: number) => {
                  console.log(`  ${index + 1}. ${testId}`);
                });

                const runPrompt = await inquirer.prompt([
                  {
                    type: 'confirm',
                    name: 'run',
                    message: 'Run the optimized test suite now?',
                    default: false
                  }
                ]);

                if (runPrompt.run) {
                  console.log(chalk.cyan('\n🚀 Running optimized tests...'));
                  // This would integrate with the test run command
                  console.log(chalk.gray('Use: labnex test run --project ' + projectCode + ' --ai'));
                }
              }
            } else {
              spinner.fail(chalk.red('Optimization failed: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Optimization failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('analyze')
      .description('Analyze a specific test failure using AI to get insights and suggestions.')
      .argument('<runId>', 'Test run ID containing the failure')
      .argument('<failureId>', 'Specific ID of the failure to analyze')
      .action(async (runId, failureId) => {
        try {
          const spinner = ora('Analyzing failure with AI...').start();

          try {
            const response = await apiClient.analyzeFailure(runId, failureId);
            
            if (response.success) {
              spinner.succeed(chalk.green('Failure analysis completed'));
              
              console.log(chalk.cyan('\n🔍 AI Failure Analysis:'));
              console.log(chalk.gray('─'.repeat(50)));
              console.log(`${chalk.bold('Analysis:')}`);
              console.log(response.data.analysis);
              
              if (response.data.suggestions.length > 0) {
                console.log(`\n${chalk.bold('Suggestions:')}`);
                response.data.suggestions.forEach((suggestion: string, index: number) => {
                  console.log(`  ${index + 1}. ${suggestion}`);
                });
              }
            } else {
              spinner.fail(chalk.red('Analysis failed: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Analysis failed: ' + error.message));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  ); 