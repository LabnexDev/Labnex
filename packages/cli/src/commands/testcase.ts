import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api/client';
import { parseRawSteps } from '../utils/parseRawSteps';

interface Options {
  title: string;
  description?: string;
  expected?: string;
  file?: string;
  stdin?: boolean;
}

export const createTestCaseCommand = new Command('create-test-case')
  .description('Create a new test case. Accepts raw step list via --file or --stdin.')
  .argument('<projectCode>', 'Project code or ID')
  .requiredOption('-t, --title <title>', 'Title of the test case')
  .option('-d, --description <desc>', 'Description')
  .option('-e, --expected <result>', 'Expected result / assertion')
  .option('-f, --file <path>', 'Path to text file containing raw steps')
  .option('--stdin', 'Read raw steps from STDIN')
  .action(async (projectCode: string, opts: Options) => {
    try {
      const spinner = ora('Reading steps…').start();
      let raw = '';

      if (opts.file) {
        raw = fs.readFileSync(opts.file, 'utf8');
      } else if (opts.stdin) {
        raw = await new Promise<string>((resolve) => {
          let data = '';
          process.stdin.setEncoding('utf8');
          process.stdin.on('data', (chunk) => (data += chunk));
          process.stdin.on('end', () => resolve(data));
        });
      } else {
        spinner.fail('You must supply --file or --stdin with the raw step list');
        process.exitCode = 1;
        return;
      }

      const steps = parseRawSteps(raw);
      spinner.text = `Parsed ${steps.length} steps`; spinner.succeed();

      const res = await apiClient.createTestCase(projectCode, {
        title: opts.title,
        description: opts.description ?? '',
        expectedResult: opts.expected ?? '',
        steps,
        priority: 'MEDIUM',
      });

      if (res.success) {
        console.log(chalk.green(`✓ Test case "${res.data.title}" created (id=${res.data._id})`));
      } else {
        console.error(chalk.red(`✗ Failed to create test case: ${res.error}`));
        process.exitCode = 1;
      }
    } catch (err: any) {
      console.error(chalk.red(`✗ ${err.message || err}`));
      process.exitCode = 1;
    }
  }); 