import axios from 'axios';
import chalk from 'chalk';

interface TestRun {
  _id: string;
  project: string; // project ID
  status: string;
  testCases: string[]; // array of test case IDs
  results?: { total: number; passed: number; failed: number; pending: number; duration: number };
}

const DEFAULT_API_URL = 'https://labnex-backend.onrender.com/api';
const API_URL = process.env.API_URL || DEFAULT_API_URL;
const RUNNER_TOKEN = process.env.RUNNER_TOKEN;

if (!RUNNER_TOKEN) {
  // eslint-disable-next-line no-console
  console.error(chalk.red('❌ RUNNER_TOKEN environment variable not set. Exiting.'));
  process.exit(1);
}

// Helper that adds auth header for runner endpoints
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${RUNNER_TOKEN}`,
  },
  timeout: 20_000,
});

// Lazy import for executor so runner starts even if build order differs
let LocalBrowserExecutor: any;

async function pollAndRun() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const { data } = await api.patch('/test-runs/claim-next');
      const run = (data && (data.run || data.data)) as TestRun | null;
      if (!run) {
        // No pending work, wait and retry.
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(chalk.cyan(`▶️  Claimed test run ${run._id} (project ${run.project})`));
      await executeRun(run);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(chalk.red('Error while polling for runs'), err);
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }
}

async function executeRun(run: TestRun) {
  try {
    // Lazy-load executor
    if (!LocalBrowserExecutor) {
      const mod = await import('@labnex/executor');
      LocalBrowserExecutor = mod.LocalBrowserExecutor || mod.default || mod;
    }

    // Fetch full test case details for the project
    const tcRes = await api.get(`/projects/${run.project}/test-cases`);
    const allTestCases: any[] = tcRes.data || [];
    const casesToRun = allTestCases.filter((tc) => run.testCases.includes(tc._id));

    const executor = new LocalBrowserExecutor({ headless: true, aiOptimizationEnabled: false });
    await executor.initialize();

    const results: any[] = [];
    for (const tc of casesToRun) {
      // eslint-disable-next-line no-console
      console.log(chalk.blue(`▶ Executing ${tc.title}`));
      const result = await executor.executeTestCase(
        tc._id,
        tc.steps,
        tc.expectedResult,
        tc.baseUrl || '',
        tc.title
      );
      results.push(result);

      await api.patch(`/test-runs/${run._id}/progress`, {
        testResults: [result],
      });
    }

    await executor.cleanup();

    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.length - passed;
    const duration = results.reduce((acc, r) => acc + (r.duration || 0), 0);

    await api.patch(`/test-runs/${run._id}/complete`, {
      status: 'completed',
      results: {
        total: results.length,
        passed,
        failed,
        pending: 0,
        duration,
      },
    });

    // eslint-disable-next-line no-console
    console.log(chalk.greenBright(`✅ Completed run ${run._id}`));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(chalk.red('Run execution failed:'), err);
    await api.patch(`/test-runs/${run._id}/complete`, {
      status: 'failed',
    });
  }
}

pollAndRun(); 