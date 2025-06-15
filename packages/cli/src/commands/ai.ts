import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api/client';
import { runTests } from './run';

export const aiCommand = new Command('ai')
  .description('Access AI-powered features like test generation and optimization.')
  .addCommand(
    new Command('generate')
      .description('Generate a new test case using AI based on a description.')
      .option('-d, --description <description>', 'Test description')
      .option('-p, --project <code>', 'Project code to add test case to')
      .option('-f, --files <paths>', 'Comma-separated list of source files this test covers')
      .action(async (options) => {
        try {
          let { description, project } = options;
          let files: string[] = [];
          if (options.files) {
            files = options.files.split(',').map((p: string) => p.trim()).filter(Boolean);
          }

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

          if (files.length === 0) {
            const fileAns = await inquirer.prompt({ type: 'input', name: 'paths', message: 'File(s) this test covers (comma-separated paths):' });
            files = fileAns.paths.split(',').map((p: string) => p.trim()).filter(Boolean);
          }

          const spinner = ora('Generating test case with AI...').start();

          try {
            const response = await apiClient.generateTestCase(description);
            
            if (response.success) {
              spinner.succeed(chalk.green('Test case generated successfully!'));
              
              console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
              console.log(chalk.bold.cyan('┃   🤖 AI Generated Test Case      ┃'));
              console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

              console.log(`\n${chalk.bold.white('Title:')} ${chalk.yellow(response.data.title)}`);
              console.log(`${chalk.bold.white('Description:')} ${response.data.description}`);
              console.log(`${chalk.bold.white('Expected Result:')} ${response.data.expectedResult}`);
              
              console.log(`\n${chalk.bold.white('Steps:')}`);
              console.log(chalk.gray('┌──────────────────────────────────'));
              response.data.steps.forEach((step, index) => {
                console.log(`${chalk.gray('│')} ${chalk.magenta(index + 1)}. ${step}`);
              });
              console.log(chalk.gray('└──────────────────────────────────'));

              // Save to project if provided
              if (project) {
                const saveSpinner = ora('Saving test case to specified project...').start();
                try {
                  const projects = await apiClient.getProjects();
                  const projectData = projects.data.find(p => p.projectCode === project);
                  if (!projectData) {
                    saveSpinner.fail(chalk.red('Project not found: ' + project));
                    return;
                  }
                  const saveResponse = await apiClient.createTestCase(projectData._id, {
                    title: response.data.title,
                    description: response.data.description,
                    steps: response.data.steps,
                    expectedResult: response.data.expectedResult,
                    priority: 'MEDIUM',
                    relatedFiles: files
                  } as any);
                  
                  if (saveResponse.success) {
                    saveSpinner.succeed(chalk.green('Test case saved to project ') + chalk.yellow.bold(projectData.name));
                  } else {
                    saveSpinner.fail(chalk.red('Failed to save test case: ' + (saveResponse.error || 'Unknown error')));
                  }
                } catch (error: any) {
                  saveSpinner.fail(chalk.red('Save failed: ' + (error.response?.data?.message || error.message || 'Unknown error')));
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
                  const projectsSpinner = ora('Fetching projects...').start();
                  let projects;
                  try {
                    projects = await apiClient.getProjects();
                    projectsSpinner.succeed();
                  } catch (e) {
                    projectsSpinner.fail('Could not fetch projects');
                    return;
                  }
                  
                  if (projects.success && projects.data.length > 0) {
                    const projectPrompt = await inquirer.prompt([
                      {
                        type: 'list',
                        name: 'project',
                        message: 'Select a project to save the test case to:',
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
                        priority: 'MEDIUM',
                        relatedFiles: files
                      } as any);
                      
                      if (saveResponse.success) {
                        const savedProject = projects.data.find(p => p._id === projectPrompt.project)
                        saveSpinner.succeed(chalk.green('Test case saved to project ') + chalk.yellow.bold(savedProject?.name));
                      } else {
                        saveSpinner.fail(chalk.red('Failed to save test case: ' + (saveResponse.error || 'Unknown error')));
                      }
                    } catch (error: any) {
                      saveSpinner.fail(chalk.red('Save failed: ' + (error.response?.data?.message || error.message || 'Unknown error')));
                    }
                  }
                }
              }
            } else {
              spinner.fail(chalk.red('Failed to generate test case: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Generation failed: ' + (error.response?.data?.message || error.message || 'Unknown error')));
          }
        } catch (error: any) {
          console.error(chalk.red('An unexpected error occurred:'), error.message);
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

          if (process.env.LABNEX_VERBOSE === 'true') {
            apiClient.setVerbose(true);
          }

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
              // ---------- CLIENT-SIDE FALLBACK (before any printing) ----------
              if (response.data.selectedTests.length === 0) {
                const allCases = await apiClient.getTestCases(project._id);
                if (allCases.success) {
                  const norm = (s:string)=>s.toLowerCase();
                  const matches = allCases.data.filter(tc =>
                    codeChanges?.some((ch:string) =>
                      norm(tc.title).includes(norm(ch)) ||
                      norm((tc.description||'')).includes(norm(ch)) ||
                      (tc.steps||[]).some((st:string)=>norm(st).includes(norm(ch)))
                    )
                  ).map(tc=>tc._id);
                  if (matches.length){
                    response.data.selectedTests = matches;
                    response.data.reasoning += ' | Client text-match fallback selected tests';
                  }
                }
              }
              // ---------- END FALLBACK ----------

              spinner.succeed(chalk.green('Test suite optimization completed!'));
              
              console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
              console.log(chalk.bold.cyan('┃   🤖 AI Optimization Results     ┃'));
              console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

              console.log(`\n${chalk.bold.white('Reasoning:')} ${chalk.italic(response.data.reasoning)}`);
              console.log(`${chalk.bold.white('Selected Test Count:')} ${chalk.yellow(response.data.selectedTests.length)}`);
              
              if (response.data.selectedTests.length > 0) {
                const testCasesSpinner = ora('Fetching details for recommended tests...').start();
                try {
                  const testCasesResponse = await apiClient.getTestCases(project._id);
                  testCasesSpinner.succeed();

                  console.log(`\n${chalk.bold.white('Recommended Tests to Run:')}`);
                  console.log(chalk.gray('┌──────────────────────────────────'));
                  response.data.selectedTests.forEach((testId: string, index: number) => {
                    const testCase = testCasesResponse.data.find(tc => tc._id === testId);
                    const testTitle = testCase ? testCase.title : 'Unknown Test';
                    console.log(`${chalk.gray('│')} ${chalk.magenta(index + 1)}. ${testTitle} ${chalk.gray(`(${testId})`)}`);
                  });
                  console.log(chalk.gray('└──────────────────────────────────'));

                } catch (error) {
                  testCasesSpinner.fail('Could not fetch test case details.');
                  // Fallback to showing IDs
                  console.log(`\n${chalk.bold.white('Recommended Tests to Run (by ID):')}`);
                  console.log(chalk.gray('┌──────────────────────────────────'));
                  response.data.selectedTests.forEach((testId: string, index: number) => {
                    console.log(`${chalk.gray('│')} ${chalk.magenta(index + 1)}. ${testId}`);
                  });
                  console.log(chalk.gray('└──────────────────────────────────'));
                }

                const runPrompt = await inquirer.prompt([
                  {
                    type: 'confirm',
                    name: 'run',
                    message: 'Do you want to run this optimized test suite now?',
                    default: false
                  }
                ]);

                if (runPrompt.run) {
                  console.log(chalk.cyan('\n🚀 Running optimized tests...'));
                  await runTests({
                    projectId: project._id,
                    testIds: response.data.selectedTests,
                    mode: 'local', // Or detect from user config
                    headless: true, // Default to headless for automated runs
                    baseUrl: process.env.FRONTEND_URL || ''
                  });
                }
              } else {
                // ---------- CLIENT-SIDE FALLBACK ----------
                const allCases = await apiClient.getTestCases(project._id);
                if (allCases.success) {
                  const norm = (s:string)=>s.toLowerCase();
                  const matches = allCases.data.filter(tc =>
                    codeChanges?.some((ch: string) =>
                      norm(tc.title).includes(norm(ch)) ||
                      norm(tc.description||'').includes(norm(ch)) ||
                      tc.steps.some((st:string)=>norm(st).includes(norm(ch)))
                    )
                  ).map(tc=>tc._id);
                  if (matches.length) {
                    response.data.selectedTests = matches;
                    response.data.reasoning +=
                      ' | Client text-match fallback selected tests';
                  }
                }
                // ---------- END FALLBACK ----------

                if (response.data.selectedTests.length === 0) {
                  const fallbackAns = await inquirer.prompt({ type: 'list', name: 'choice', message: 'No tests matched – choose fallback', choices: [{ name: 'Run ALL tests', value: 'all' }, { name: 'Run only HIGH priority', value: 'high' }, { name: 'Cancel', value: 'none' }] });
                  if (fallbackAns.choice === 'all') {
                    const all = await apiClient.getTestCases(project._id);
                    if (all.success) { response.data.selectedTests = all.data.map((t: any) => t._id); }
                  } else if (fallbackAns.choice === 'high') {
                    const all = await apiClient.getTestCases(project._id);
                    if (all.success) { response.data.selectedTests = all.data.filter((t: any) => t.priority === 'HIGH').map((t: any) => t._id); }
                  }
                  if (response.data.selectedTests.length === 0 && fallbackAns.choice === 'none') {
                    spinner.fail(chalk.yellow('User cancelled run.'));
                    return;
                  }
                }
              }
            } else {
              spinner.fail(chalk.red('Optimization failed: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Optimization failed: ' + (error.response?.data?.message || error.message || 'Unknown error')));
          }
        } catch (error: any) {
          console.error(chalk.red('An unexpected error occurred:'), error.message);
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
              spinner.succeed(chalk.green('Failure analysis completed!'));
              
              console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
              console.log(chalk.bold.cyan('┃   🤖 AI Failure Analysis         ┃'));
              console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

              console.log(`\n${chalk.bold.white('Analysis:')}`);
              console.log(chalk.italic(response.data.analysis));
              
              if (response.data.suggestions.length > 0) {
                console.log(`\n${chalk.bold.white('Suggestions:')}`);
                console.log(chalk.gray('┌──────────────────────────────────'));
                response.data.suggestions.forEach((suggestion: string, index: number) => {
                  console.log(`${chalk.gray('│')} ${chalk.magenta(index + 1)}. ${suggestion}`);
                });
                console.log(chalk.gray('└──────────────────────────────────'));
              }
            } else {
              spinner.fail(chalk.red('Analysis failed: ' + response.error));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Analysis failed: ' + (error.response?.data?.message || error.message || 'Unknown error')));
          }
        } catch (error: any) {
          console.error(chalk.red('An unexpected error occurred:'), error.message);
        }
      })
  ); 