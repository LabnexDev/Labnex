import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { apiClient } from '../api/client';
import { loadProjectConfig, saveProjectConfig } from '../utils/projectConfig';
import { TestCaseResult } from '@labnex/executor';
// LocalBrowserExecutor will be imported lazily so the CLI can build without the executor package built yet.
let LocalBrowserExecutor: any;

export const runCommand = new Command('run')
    .description('Execute tests for a specified project using local or cloud resources.')
    .option('-p, --project <codeOrId>', 'Project code or ID to run tests for')
    .option('--project-id <id>', 'DEPRECATED: use --project instead')
    .option('-t, --test-id <id>', 'Run a specific test case by ID')
    .option('--test-ids <ids>', 'Comma-separated list of test case IDs to run')
    .option('-e, --environment <env>', 'Environment to run tests against', 'staging')
    .option('-m, --mode <mode>', 'Execution mode: local or cloud', 'local')
    .option('--cloud', 'Shortcut for --mode cloud')
    .option('-b, --base-url <url>', 'Base URL of the application under test')
    .option('--optimize-ai', 'Enable AI optimization for element finding (deprecated – use --ai-optimize)')
    .option('--ai-optimize', 'Enable AI optimization for element finding')
    .option('--username <username>', 'Username to use when tests contain login placeholders')
    .option('--password <password>', 'Password to use when tests contain login placeholders')
    .option('--parallel <number>', 'Number of parallel workers (cloud mode)', '4')
    .option('--headless', 'Run in headless mode (local mode)', false)
    .option('--timeout <ms>', 'Test timeout in milliseconds', '300000')
    .option('--watch', 'Stream live updates until run completes')
    .action(async (options) => {
        try {
            let projectId: string | undefined;
            let projectCode: string | undefined;

            if (options.project) {
                if (/^[a-f0-9]{24}$/i.test(options.project)) {
                    projectId = options.project;
                } else {
                    projectCode = options.project.toUpperCase();
                }
            } else if (options.projectId) {
                projectId = options.projectId;
            }

            // Map --cloud flag to mode
            if (options.cloud) {
                options.mode = 'cloud';
            }

            // If we received a project *code*, look up its ID first.
            if (!projectId && projectCode) {
                const lookupSpinner = ora(`Resolving project code ${projectCode}...`).start();
                try {
                    const response = await apiClient.getProjects();
                    if (response.success) {
                        const match = response.data.find((p: any) => p.projectCode === projectCode);
                        if (match) {
                            projectId = match._id;
                            lookupSpinner.succeed(chalk.green(`Project resolved: ${match.projectCode} (${match.name})`));
                        } else {
                            lookupSpinner.fail(chalk.red(`Project code not found: ${projectCode}`));
                        }
                    } else {
                        lookupSpinner.fail(chalk.red(`Failed to fetch projects: ${response.error || 'unknown error'}`));
                    }
                } catch (err: any) {
                    lookupSpinner.fail(chalk.red(`Error fetching projects: ${err.message}`));
                }
            }

            if (!projectId) {
                const spinner = ora('Fetching your projects...').start();
                try {
                    const response = await apiClient.getProjects();
                    if (response.success && response.data && response.data.length > 0) {
                        spinner.stop();
                        const choices = response.data.map((p: any) => ({
                            name: `${p.name} (${p.projectCode})`,
                            value: p._id,
                        }));

                        const answer = await inquirer.prompt([
                            {
                                type: 'list',
                                name: 'selectedProject',
                                message: 'Which project would you like to run tests for?',
                                choices: choices,
                            },
                        ]);
                        projectId = answer.selectedProject;
                    } else if (response.success && response.data.length === 0) {
                        spinner.fail(chalk.yellow('You do not have any projects.'));
                        console.log(chalk.cyan('You can create one using: labnex projects create'));
                        process.exit(1);
                    } else {
                        spinner.fail(chalk.red(`Failed to fetch projects: ${response.message || 'Unknown error'}`));
                        return;
                    }
                } catch (error: any) {
                    spinner.fail(chalk.red(`Error fetching projects: ${error.message}`));
                    return;
                }
            }

            const runOptions = { ...options, projectId };
            if (options.testIds) {
                runOptions.testIds = options.testIds.split(',');
            }
            // Normalize AI optimize flag across both variants
            runOptions.optimizeAi = options.optimizeAi || options.aiOptimize;
            
            await runTests(runOptions);

        } catch (error: any) {
            console.error(chalk.red('❌ Test execution failed:'), error.message);
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });


export async function runTests(options: any) {
    const projectId = options.projectId;
    const testId = options.testId;
    const testIds = options.testIds;
    const environment = options.environment;
    const mode = options.mode;
    const aiOptimize = options.optimizeAi || options.aiOptimize;
    const verbose = process.env.LABNEX_VERBOSE === 'true';

    const pkg = require('../../package.json');
    console.log(chalk.bold(`🚀 Labnex CLI v${pkg.version}`));
    console.log(chalk.gray('─'.repeat(40)));
    // Project info will be printed after fetching project details.
    if (aiOptimize) {
        console.log(chalk.cyan('✓ AI optimization enabled'));
    }
    console.log(chalk.cyan(`✓ Environment: ${environment}`));
    if (options.parallel) {
        console.log(chalk.cyan(`✓ Parallel execution: ${options.parallel} workers`));
    }

    if (aiOptimize) {
        console.log(chalk.gray(`🤖 AI Optimization: enabled`));
    }
    if (verbose) {
        console.log(chalk.gray(`🔍 Detailed logging: enabled`));
    }
    console.log('');

    const projectsSpinner = ora('Fetching project details...').start();
    let project: any = null;
    try {
        const projectsResponse = await apiClient.getProjects();
        if (verbose) {
            console.log('\n[DEBUG] apiClient.getProjects() response:', JSON.stringify(projectsResponse, null, 2));
        }

        if (projectsResponse.success && projectsResponse.data) {
            project = projectsResponse.data.find((p: any) => p._id === projectId);
            if (project) {
                if (verbose) {
                    console.log('[DEBUG] Found project:', JSON.stringify(project, null, 2));
                }
                projectsSpinner.succeed(chalk.green(`✅ Project found: ${project.projectCode} (${project.name})`));
                console.log(chalk.cyan(`✓ Project: ${project.projectCode} (${project.name})`));
            } else {
                projectsSpinner.fail(chalk.red(`❌ Project not found: ${projectId}`));
                return;
            }
        } else {
            projectsSpinner.fail(chalk.red(`❌ Failed to fetch project details.`));
            return;
        }
    } catch (error: any) {
        projectsSpinner.fail(chalk.red(`❌ Error fetching project details: ${error.message}`));
        return;
    }

    const testCasesSpinner = ora('Fetching test cases...').start();
    let allTestCases: any[] = [];
    try {
        const testCasesResponse = await apiClient.getTestCases(projectId);
        if (testCasesResponse.success && testCasesResponse.data) {
            allTestCases = testCasesResponse.data;
            testCasesSpinner.succeed(chalk.green(`✅ Found ${allTestCases.length} test cases.`));
        } else {
            testCasesSpinner.fail(chalk.red(`❌ Failed to fetch test cases.`));
            return;
        }
    } catch (error: any) {
        testCasesSpinner.fail(chalk.red(`❌ Error fetching test cases: ${error.message}`));
        return;
    }

    let testCasesToRun = allTestCases;

    if (testId) {
        testCasesToRun = allTestCases.filter(tc => tc._id === testId);
        console.log(chalk.blue(`Running a single test: ${testCasesToRun[0]?.title || testId}`));
    } else if (testIds && testIds.length > 0) {
        testCasesToRun = allTestCases.filter(tc => testIds.includes(tc._id));
        console.log(chalk.blue(`Running ${testCasesToRun.length} specific tests from AI optimization.`));
    }

    if (testCasesToRun.length === 0) {
        console.log(chalk.yellow('No test cases to run.'));
        return;
    }

    if (mode === 'local') {
        await runTestsLocally(testCasesToRun, project, options);
    } else {
        await runTestsInCloud(testCasesToRun, project, options);
    }
}

async function runTestsLocally(testCases: any[], project: any, options: any) {
    const { headless, timeout, optimizeAi, baseUrl } = options;
    console.log(chalk.cyan('\n🔧 Starting local test execution...'));
    console.log(chalk.gray(`Browser mode: ${headless ? 'Headless' : 'Headed'}`));
    console.log(chalk.gray(`Timeout per test: ${timeout}ms`));

    if (!LocalBrowserExecutor) {
        const mod = await import('@labnex/executor');
        LocalBrowserExecutor = mod.LocalBrowserExecutor;
    }
    let executor = new LocalBrowserExecutor({
        headless,
        aiOptimizationEnabled: optimizeAi
    });

    // --- AI Analysis banner (informational) ---
    console.log(chalk.bold.cyan('\n🧠 AI Analysis:'));
    console.log(`• ${chalk.yellow(testCases.length)} test cases found`);
    if (optimizeAi) {
        console.log('• Prioritizing critical path tests');
    }
    // rough estimate: 4s per test
    const estSeconds = (testCases.length * 4).toFixed(0);
    console.log(`• Estimated time: ${estSeconds} seconds`);

    // helper for progress bar
    const makeBar = (current: number, total: number, barWidth = 20) => {
        const filled = Math.round((current / total) * barWidth);
        return '█'.repeat(filled).padEnd(barWidth, '░');
    };

    try {
        try {
            await executor.initialize();
        } catch (initErr) {
            if (!headless) {
                console.log(chalk.yellow('\n⚠️  Headed Chrome could not start – retrying in headless mode.'));
                executor.cleanup && await executor.cleanup();
                const HeadlessExecutorMod = await import('@labnex/executor');
                LocalBrowserExecutor = HeadlessExecutorMod.LocalBrowserExecutor;
                executor = new LocalBrowserExecutor({ headless: true, aiOptimizationEnabled: optimizeAi });
                await executor.initialize();
            } else {
                throw initErr;
            }
        }
        const results: TestCaseResult[] = [];
        const total = testCases.length;
        let index = 0;
        for (const testCase of testCases) {
            const result = await executor.executeTestCase(
                testCase._id,
                testCase.steps,
                testCase.expectedResult,
                testCase.baseUrl || baseUrl || '',
                testCase.title
            );
            results.push(result);

            // progress line (overwrite)
            index++;
            const bar = makeBar(index, total);
            const statusIcon = result.status === 'passed' ? chalk.green('✅') : chalk.red('❌');
            const line = `${testCase.title.substring(0, 20)} ${bar} ${Math.round((index/total)*100)}% (${index}/${total}) ${statusIcon} ${(result.duration/1000).toFixed(1)}s`;
            process.stdout.write(`\r${line}`);
        }
        process.stdout.write('\n');
        await executor.cleanup();

        console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
        console.log(chalk.bold.cyan('┃   Local Test Run Results ┃'));
        console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
        results.forEach((result: TestCaseResult) => {
            const testCase = testCases.find(tc => tc._id === result.testCaseId);
            const title = testCase ? testCase.title : result.testCaseId;
            const status = result.status === 'passed'
                ? chalk.green.bold('✔ PASSED')
                : chalk.red.bold('✖ FAILED');
            console.log(`\n${status} - ${title}`);
            console.log(chalk.gray(`  ID: ${result.testCaseId}`));
            console.log(chalk.gray(`  Duration: ${result.duration}ms`));
            if (result.status === 'failed') {
                const lastFailedStep = result.steps.find((s: any) => s.status === 'failed');
                if (lastFailedStep) {
                    console.log(chalk.red(`  Error: ${lastFailedStep.message}`));
                }
                // console.log(chalk.red.dim(`  Screenshot: ${result.screenshot || 'Not available'}`));
            }
        });

        // summary block
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.length - passed;
        const durationTotal = results.reduce((acc, r) => acc + (r.duration || 0), 0);
        console.log(chalk.bold.cyan('\n📊 Results Summary:'));
        console.log(`• Passed: ${passed}/${results.length} tests ${failed === 0 ? chalk.green('✅') : chalk.red('❌')}`);
        console.log(`• Duration: ${(durationTotal / 1000).toFixed(1)} seconds`);
        const successRate = ((passed / results.length) * 100).toFixed(0);
        console.log(`• Success Rate: ${successRate}%`);
    } catch (error: any) {
        console.error(chalk.red('\n❌ An error occurred during local test execution:'), error.message);
        await executor.cleanup();
    }
}

async function runTestsInCloud(testCases: any[], project: any, options: any) {
    let baseUrlOption = options.baseUrl as string | undefined;

    // Attempt to read from project config if not provided
    if (!baseUrlOption) {
        const projCfg = loadProjectConfig();
        if (projCfg?.baseUrl) {
            baseUrlOption = projCfg.baseUrl;
        }
    }

    if (!baseUrlOption) {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'baseUrl',
                message: 'Base URL of the application under test (e.g., https://example.com):',
                validate: (input: string) => /^https?:\/\//i.test(input) || 'Please enter a valid http(s) URL',
                when: () => options.mode === 'cloud'
            }
        ]);
        baseUrlOption = answer.baseUrl;

        // Offer to remember
        const { remember } = await inquirer.prompt([{ type: 'confirm', name: 'remember', message: 'Save this base URL to labnex.config.json?', default: true }]);
        if (remember) {
            saveProjectConfig({ baseUrl: baseUrlOption as string });
            console.log(chalk.green('Base URL saved to labnex.config.json'));
        }
    }

    // Detect if any placeholder credentials present in steps
    const needsUsername = testCases.some((tc: any)=> tc.steps.some((s: string)=> s.includes('__PROMPT_VALID_USERNAME__')));
    const needsPassword = testCases.some((tc: any)=> tc.steps.some((s: string)=> s.includes('__PROMPT_VALID_PASSWORD__')));

    let usernameOpt = options.username as string | undefined;
    let passwordOpt = options.password as string | undefined;

    const interactive = process.env.RUNNER_NON_INTERACTIVE !== 'true' && process.stdout.isTTY;

    if (interactive && needsUsername && !usernameOpt) {
       const ans = await inquirer.prompt([{ type:'input', name:'username', message:'Enter username for login placeholders:' }]);
       usernameOpt = ans.username;
    }
    if (interactive && needsPassword && !passwordOpt) {
       const ans = await inquirer.prompt([{ type:'password', name:'password', message:'Enter password for login placeholders:', mask:'*' }]);
       passwordOpt = ans.password;
    }

    const spinner = ora('Creating cloud test run...').start();
    try {
        const response = await apiClient.createTestRun(project._id, {
            testCases: testCases.map(tc => tc._id),
            parallel: parseInt(options.parallel, 10) || 2,
            environment: options.environment,
            aiOptimization: !!options.optimizeAi,
            baseUrl: baseUrlOption,
            useCloudRunner: true,
            credentials: { username: usernameOpt, password: passwordOpt }
        });

        if (!response.success) {
            spinner.fail(chalk.red(`Failed to create cloud run: ${response.error}`));
            return;
        }

        spinner.succeed(chalk.green('✅ Cloud test run created.'));

        const run = response.data;
        console.log(chalk.bold.cyan('\n📡 Cloud Run Details'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`${chalk.bold('Run ID:')} ${run._id}`);
        console.log(`${chalk.bold('Status:')} ${run.status}`);
        console.log(`${chalk.bold('Total Tests:')} ${run.results.total}`);
        console.log(`${chalk.bold('Parallel:')} ${run.config.parallel}`);
        console.log(`${chalk.bold('AI Optimization:')} ${run.config.aiOptimization ? 'Yes' : 'No'}`);
        console.log('\nYou can monitor progress with:');
        console.log(`  ${chalk.cyan(`labnex status --run-id ${run._id}`)}`);
        console.log(`  ${chalk.cyan(`labnex ai analyze ${run._id} <failedTestId>`)} after it completes.`);

        if (options.watch) {
            await streamRunProgress(run._id);
        }
    } catch (err: any) {
        spinner.fail(chalk.red(`Error triggering cloud run: ${err.message}`));
    }
}

async function streamRunProgress(runId: string) {
    const bar = (current: number, total: number, width = 20) => {
        const filled = Math.round((current/total)*width);
        return '█'.repeat(filled).padEnd(width, '░');
    };

    console.log(chalk.cyan('\n👀 Watching run progress (press Ctrl+C to exit)'));
    let completed = false;
    while (!completed) {
        try {
            const res = await apiClient.getTestRun(runId);
            if (res.success) {
                const { passed, failed, total } = res.data.results;
                const done = passed + failed;
                const statusLine = `${bar(done,total)} ${done}/${total} | ${chalk.green(`${passed}✓`)} ${failed>0 ? chalk.red(`${failed}✗`) : ''}`;
                process.stdout.write(`\r${statusLine}`);

                if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
                    completed = true;
                    process.stdout.write('\n');
                }
            }
        } catch {}
        await new Promise(r => setTimeout(r, 3000));
    }
}
