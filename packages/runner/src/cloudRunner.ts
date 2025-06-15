import axios from 'axios';
import chalk from 'chalk';

interface TestRun {
  _id: string;
  project: string; // project ID
  status: string;
  testCases: string[]; // array of test case IDs
  results?: { total: number; passed: number; failed: number; pending: number; duration: number };
}

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
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
  // Simulate running tests by iterating over test cases.
  const total = run.testCases.length;
  let passed = 0;

  for (let i = 0; i < total; i += 1) {
    const tcId = run.testCases[i];
    // Pretend each test takes ~2s.
    await new Promise((r) => setTimeout(r, 2_000));

    passed += 1; // mark as passed for demo purposes

    // Send lightweight progress (backend may ignore if format differs)
    try {
      await api.patch(`/test-runs/${run._id}/progress`, {
        testResults: [], // placeholder – real implementation would send per-test details
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(chalk.yellow('Progress update failed (ignored):'), (err as any).message);
    }

    // eslint-disable-next-line no-console
    console.log(chalk.green(`✓ Finished ${tcId} (${i + 1}/${total})`));
  }

  // Complete the run.
  await api.patch(`/test-runs/${run._id}/complete`, {
    status: 'completed',
    results: {
      total,
      passed,
      failed: 0,
      pending: 0,
      duration: total * 2000,
    },
  });

  // eslint-disable-next-line no-console
  console.log(chalk.greenBright(`✅ Completed run ${run._id}`));
}

pollAndRun(); 