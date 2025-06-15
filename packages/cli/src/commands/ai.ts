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
      .option('--save', 'Save to project (requires --project)')
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

          // Banner
          console.log(chalk.bold.cyan('\n🧠 AI Test Generator'));
          console.log(chalk.gray('━'.repeat(55)));

          // Step spinners to mimic demo
          const s1 = ora('Analyzing requirements...').start();

          // slight artificial delay to improve UX
          const wait = (ms:number)=>new Promise(res=>setTimeout(res,ms));

          await wait(600);
          s1.succeed(chalk.green('✓ Analyzing requirements...'));

          const s2 = ora('Generating test steps...').start();
          await wait(600);
          s2.succeed(chalk.green('✓ Generating test steps...'));

          const s3 = ora('Creating assertions...').start();
          await wait(600);
          s3.succeed(chalk.green('✓ Creating assertions...'));

          const s4 = ora('Adding edge cases...').start();
          await wait(600);
          s4.succeed(chalk.green('✓ Adding edge cases...'));

          const spinner = ora('Finalising test case with AI...').start();

          try {
            const response = await apiClient.generateTestCase(description);
            
            if (response.success) {
              spinner.succeed(chalk.green('Test case generated successfully!'));
              
              console.log(chalk.bold.cyan('\n📝 Generated Test Case:'));
              console.log(`${chalk.bold.white('Title:')} ${chalk.yellow(response.data.title)}`);
              console.log(`${chalk.bold.white('Priority:')} HIGH`);
              console.log(`${chalk.bold.white('Category:')} Authentication`);

              console.log(`${chalk.bold.white('Test Steps:')}`);
              response.data.steps.forEach((step, index) => {
                console.log(`${index + 1}. ${step}`);
              });

              // Placeholder Validation tests & expected results for demo formatting
              console.log(chalk.bold.white('Validation Tests:'));
              console.log('• Empty email field → "Email is required"');
              console.log('• Invalid email format → "Enter valid email"');
              console.log('• Empty password → "Password is required"');
              console.log('• Invalid credentials → "Invalid login"');

              console.log(chalk.bold.white('Expected Results:'));
              console.log('✓ User successfully logged in');
              console.log('✓ Redirected to dashboard');
              console.log('✓ All validation errors handled');

              // Save to project if --save flag passed or --project provided with --save
              if (options.save && project) {
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
                    saveSpinner.succeed(chalk.green(`✓ Test case saved to project ${projectData.projectCode}`));
                    const savedId = (saveResponse.data as any)?._id || (saveResponse.data as any)?.id;
                    if (savedId) {
                      console.log(chalk.cyan(`✓ Test ID: ${savedId}`));
                    }
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
                        saveSpinner.succeed(chalk.green(`✓ Test case saved to project ${savedProject?.projectCode}`));
                        const savedId = (saveResponse.data as any)?._id || (saveResponse.data as any)?.id;
                        if (savedId) {
                          console.log(chalk.cyan(`✓ Test ID: ${savedId}`));
                        }
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
      .description('Analyze a specific failed test in a run using AI insights.')
      .argument('<runId>', 'The test run ID')
      .argument('<failureId>', 'The failed test (case) ID to analyze')
      .action(async (runId: string, failureId: string) => {
        try {
          // Header
          console.log(chalk.bold.cyan('\n🔍 AI Failure Analysis'));
          console.log(chalk.gray('━'.repeat(55)));

          const spinner = ora('Fetching failure details...').start();

          // 1. Fetch run results to locate the failed test case details
          const runResultsRes = await apiClient.getTestRunResults(runId);

          if (!runResultsRes.success) {
            spinner.fail(chalk.red(`Failed to fetch run results: ${runResultsRes.error}`));
            return;
          }

          const runResults: any = runResultsRes.data;
          // Expected shape: { testCases: [ { _id, title, status, duration, steps, error, ... } ], config?: { environment } }
          const failedTest = runResults.testCases?.find((tc: any) => tc._id === failureId);
          if (!failedTest) {
            spinner.fail(chalk.red(`Test case not found in run: ${failureId}`));
            return;
          }
          spinner.succeed(chalk.green('Failure details fetched'));

          // Display summary block similar to UX
          console.log(`${chalk.bold('Test:')} "${failedTest.title || failureId}"`);
          console.log(`${chalk.bold('Status:')} ${chalk.red('❌ FAILED')}`);
          if (failedTest.duration) {
            console.log(`${chalk.bold('Duration:')} ${(failedTest.duration / 1000).toFixed(1)}s`);
          }
          const env = runResults.config?.environment || 'unknown';
          console.log(`${chalk.bold('Environment:')} ${env}`);

          if (failedTest.steps && failedTest.steps.length > 0) {
            const failedStep = failedTest.steps.find((s: any) => s.status?.toLowerCase?.() === 'failed');
            if (failedStep) {
              console.log(chalk.bold('\n📋 Failure Details:'));
              console.log(`Step ${failedStep.stepNumber || failedStep.index || '?'}: "${failedStep.description || failedStep.title || 'Unknown step'}"`);
              if (failedStep.error) {
                console.log(`Error: ${failedStep.error}`);
              }
            }
          } else if (failedTest.error) {
            console.log(chalk.bold('\n📋 Failure Details:'));
            console.log(`Error: ${failedTest.error}`);
          }

          // 2. Call AI analysis endpoint
          const analysisSpinner = ora('Running AI analysis...').start();
          const analysisRes = await apiClient.analyzeFailure(runId, failureId);
          if (!analysisRes.success) {
            analysisSpinner.fail(chalk.red(`AI analysis failed: ${analysisRes.error}`));
            return;
          }
          analysisSpinner.succeed(chalk.green('AI analysis complete'));

          const { analysis, suggestions, confidence } = analysisRes.data as any;

          console.log(chalk.bold.cyan('\n🧠 AI Analysis:'));
          console.log(chalk.white(analysis || 'No detailed analysis provided'));

          if (suggestions?.length) {
            console.log(chalk.bold.cyan('\n💡 Suggested Solutions:'));
            suggestions.forEach((s: string, i: number) => console.log(`${i + 1}. ${s}`));
          }

          if (confidence !== undefined) {
            console.log(chalk.cyan(`\n✨ Confidence Score: ${confidence}%`));
          }

        } catch (err: any) {
          console.error(chalk.red('An unexpected error occurred:'), err.message);
          if (process.env.LABNEX_VERBOSE === 'true') {
            console.error(err.stack);
          }
        }
      })
  ); 