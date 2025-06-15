import axios from 'axios';
import chalk from 'chalk';

interface TestRun {
  id: string;
  projectId: string;
  status: string;
  specFiles: string[];
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
      if (!data || !data.run) {
        // No pending work, wait and retry.
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }

      const run: TestRun = data.run;
      // eslint-disable-next-line no-console
      console.log(chalk.cyan(`▶️  Claimed test run ${run.id} (project ${run.projectId})`));
      await executeRun(run);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(chalk.red('Error while polling for runs'), err);
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }
}

async function executeRun(run: TestRun) {
  // Simulate running tests by iterating over spec files.
  const total = run.specFiles.length;
  let passed = 0;

  for (let i = 0; i < total; i += 1) {
    const spec = run.specFiles[i];
    // Pretend each test takes ~2s.
    await new Promise((r) => setTimeout(r, 2_000));

    passed += 1; // mark as passed for demo purposes

    await api.patch(`/test-runs/${run.id}/progress`, {
      passed,
      completed: i + 1,
      total,
      currentSpec: spec,
    });

    // eslint-disable-next-line no-console
    console.log(chalk.green(`✓ Finished ${spec} (${i + 1}/${total})`));
  }

  // Complete the run.
  await api.patch(`/test-runs/${run.id}/complete`, {
    passed,
    failed: 0,
    status: 'passed',
  });

  // eslint-disable-next-line no-console
  console.log(chalk.greenBright(`✅ Completed run ${run.id}`));
}

pollAndRun(); 