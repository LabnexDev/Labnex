import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api/client';

export const analyzeCommand = new Command('analyze')
  .description('Analyze test execution results and pinpoint failure causes.')
  .addCommand(
    new Command('failure')
      .description('Analyze a specific test failure from a run ID using AI for insights.')
      .option('--run-id <runId>', 'Test run ID to analyze failures from')
      .action(async (options) => {
        try {
          let { runId } = options;

          // Prompt for run ID if not provided
          if (!runId) {
            const runIdPrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'runId',
                message: 'Enter test run ID:',
                validate: (input) => input.length > 0 || 'Test run ID is required'
              }
            ]);
            runId = runIdPrompt.runId;
          }

          console.log(chalk.cyan('🔍 Analyzing test failure...'));
          console.log(chalk.gray(`🆔 Test Run ID: ${runId}`));

          const spinner = ora('Fetching failure details...').start();

          try {
            // Get test run results to find failures
            const resultsResponse = await apiClient.getTestRunResults(runId);
            
            if (!resultsResponse.success) {
              spinner.fail(chalk.red('Failed to fetch test run results: ' + resultsResponse.error));
              return;
            }

            const results = resultsResponse.data;
            
            // Find failed test cases
            const failedTests = results.testCases.filter((testCase: any) => 
              testCase.status === 'FAIL' || testCase.status === 'FAILED' || testCase.status === 'fail'
            );

            if (failedTests.length === 0) {
              spinner.succeed(chalk.green('No failed tests found in this test run'));
              console.log(chalk.gray('✨ All tests passed successfully!'));
              return;
            }

            spinner.succeed(`Found ${failedTests.length} failed test(s)`);

            let selectedFailure;

            if (failedTests.length === 1) {
              // Auto-select the single failure
              selectedFailure = failedTests[0];
              console.log(chalk.gray(`📋 Analyzing: ${selectedFailure.title}`));
            } else {
              // Let user choose which failure to analyze
              console.log(chalk.yellow(`\nFound ${failedTests.length} failed tests:`));
              failedTests.forEach((test: any, index: number) => {
                console.log(`  ${index + 1}. ${test.title} - ${test.error || 'Unknown error'}`);
              });

              const selectionPrompt = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'failure',
                  message: 'Select which failure to analyze:',
                  choices: failedTests.map((test: any, index: number) => ({
                    name: `${test.title} - ${test.error || 'Unknown error'}`,
                    value: test
                  }))
                }
              ]);
              selectedFailure = selectionPrompt.failure;
            }

            const analysisSpinner = ora('Analyzing failure with AI...').start();

            try {
              // Use the test case ID as the failure ID for the AI analysis
              const response = await apiClient.analyzeFailure(runId, selectedFailure._id);
              
              if (response.success) {
                analysisSpinner.succeed(chalk.green('Failure analysis completed'));
                
                console.log(chalk.cyan('\n🤖 AI Failure Analysis:'));
                console.log(chalk.gray('─'.repeat(60)));
                console.log(`${chalk.bold('Test Case:')} ${selectedFailure.title}`);
                console.log(`${chalk.bold('Status:')} ${chalk.red(selectedFailure.status)}`);
                console.log(`${chalk.bold('Duration:')} ${selectedFailure.duration}ms`);
                
                if (selectedFailure.error) {
                  console.log(`${chalk.bold('Error:')} ${chalk.red(selectedFailure.error)}`);
                }
                
                console.log(`\n${chalk.bold('🔍 Analysis:')}`);
                console.log(chalk.white(response.data.analysis));
                
                if (response.data.suggestions.length > 0) {
                  console.log(`\n${chalk.bold('💡 Suggestions:')}`);
                  response.data.suggestions.forEach((suggestion: string, index: number) => {
                    console.log(`  ${chalk.green(index + 1)}. ${suggestion}`);
                  });
                }

                console.log(chalk.gray('\n─'.repeat(60)));
                console.log(chalk.gray('💡 Tip: Fix the issues above and re-run your tests!'));
                
              } else {
                analysisSpinner.fail(chalk.red('Analysis failed: ' + response.error));
              }
            } catch (error: any) {
              analysisSpinner.fail(chalk.red('Analysis failed: ' + error.message));
            }

          } catch (error: any) {
            spinner.fail(chalk.red('Failed to analyze failure: ' + error.message));
            console.log(chalk.gray('Please check the test run ID and try again.'));
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  ); 