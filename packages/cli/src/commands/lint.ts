import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { apiClient, TestCase } from '../api/client';
import { TestStepParser } from '../testStepParser';

interface LintProblem { error: string; suggestion?: string }

// Simple heuristic validation rules with fix suggestions
function lintTestCase(testCase: TestCase): LintProblem[] {
  const problems: LintProblem[] = [];

  if (!Array.isArray(testCase.steps) || testCase.steps.length === 0) {
    problems.push({ error: 'No steps defined', suggestion: 'Add at least one actionable step like "Navigate to https://example.com"' });
    return problems;
  }

  testCase.steps.forEach((step, idx) => {
    let parsed;
    try {
      parsed = TestStepParser.parseStep(step);
    } catch (err: any) {
      problems.push({
        error: `[Step ${idx + 1}] Parse error: ${err.message || err}`,
        suggestion: 'Rewrite the step in the standard imperative form, e.g. "Click (css: #login-button)"'
      });
      return;
    }

    if (!parsed || !parsed.action) {
      problems.push({
        error: `[Step ${idx + 1}] Unrecognised action`,
        suggestion: 'Supported actions: navigate, click, type, wait, assert, select, hover, scroll, upload, dragAndDrop'
      });
      return;
    }

    const needsTarget = [
      'click',
      'type',
      'select',
      'hover',
      'scroll',
      'upload',
      'dragAndDrop',
    ];
    if (needsTarget.includes(parsed.action) && !parsed.target) {
      problems.push({
        error: `[Step ${idx + 1}] Action "${parsed.action}" missing target selector`,
        suggestion: 'Add a selector hint, e.g. "Click (css: #submit)" or "Click (text: \"Submit\")"'
      });
    }

    if (parsed.action === 'type' && !parsed.value) {
      problems.push({
        error: `[Step ${idx + 1}] Type action missing value`,
        suggestion: 'Specify the value to type, e.g. "Type \"john@example.com\" into (css: #email)"'
      });
    }

    if (parsed.action === 'assert') {
      if (!parsed.assertion && !parsed.expectedText) {
        problems.push({
          error: `[Step ${idx + 1}] Assert step lacks expected text/assertion details`,
          suggestion: 'Provide an assertion object, e.g. "assert (type=url, expected=\"/dashboard\", condition=contains)"'
        });
      }
    }
  });

  if (!testCase.expectedResult || !testCase.expectedResult.trim()) {
    problems.push({ error: 'expectedResult field is empty', suggestion: 'Fill in a human-readable expected result for the whole case' });
  }

  return problems;
}

export const lintCommand = new Command('lint-tests')
  .description('Static analysis of test cases for a project.')
  .argument('<projectCode>', 'Project code (e.g., DEMO)')
  .option('--json', 'Output JSON instead of table')
  .option('--fix', 'Interactively fix issues')
  .action(async (projectCode, options) => {
    const spinner = ora(`Linting tests for project ${chalk.cyan(projectCode.toUpperCase())}...`).start();
    try {
      // Resolve project ID
      const projectsRes = await apiClient.getProjects();
      if (!projectsRes.success) {
        spinner.fail(chalk.red(`Failed to fetch projects: ${projectsRes.error}`));
        process.exit(1);
      }

      const project = projectsRes.data.find((p) => p.projectCode === projectCode.toUpperCase());
      if (!project) {
        spinner.fail(chalk.red(`Project ${projectCode} not found`));
        process.exit(1);
      }

      const tcRes = await apiClient.getTestCases(project._id);
      if (!tcRes.success) {
        spinner.fail(chalk.red(`Failed to fetch test cases: ${tcRes.error}`));
        process.exit(1);
      }

      const results: any[] = [];
      let totalErrors = 0;
      for (const tc of tcRes.data) {
        let modified = false;
        const probs = lintTestCase(tc as any);
        totalErrors += probs.length;
        // attempt fixes if --fix
        if (options.fix && probs.length > 0) {
          for (const p of probs) {
            if (/missing target selector/.test(p.error)) {
              spinner.stop();
              const ans = await inquirer.prompt([{ type: 'input', name: 'sel', message: `Provide selector for step issue: ${p.error}` }]);
              spinner.start();
              const stepIdx = parseInt(p.error.match(/Step (\d+)/)?.[1] || '0', 10) - 1;
              const stepStr = tc.steps[stepIdx];
              const newStep = stepStr.replace(/\)$/, `) || (css: ${ans.sel})`);
              tc.steps[stepIdx] = newStep;
              modified = true;
            } else if (/Type action missing value/.test(p.error)) {
              spinner.stop();
              const ans = await inquirer.prompt([{ type: 'input', name: 'val', message: `Provide value for step ${p.error}` }]);
              spinner.start();
              const stepIdx = parseInt(p.error.match(/Step (\d+)/)?.[1] || '0', 10) - 1;
              const stepStr = tc.steps[stepIdx];
              const newStep = stepStr.replace(/Type\s+"?"?/, `Type "${ans.val}" `);
              tc.steps[stepIdx] = newStep;
              modified = true;
            } else if (/expectedResult field is empty/.test(p.error)) {
              spinner.stop();
              const ans = await inquirer.prompt([{ type: 'input', name: 'exp', message: 'Enter expectedResult for test case' }]);
              spinner.start();
              tc.expectedResult = ans.exp;
              modified = true;
            }
          }
        }

        if (modified && options.fix) {
          const updateRes = await apiClient.updateTestCase(project._id, tc._id, { steps: tc.steps, expectedResult: tc.expectedResult });
          if (updateRes.success) {
            console.log(chalk.green(`✓ Updated test case ${tc.title}`));
          } else {
            console.log(chalk.red(`Failed to update ${tc.title}: ${updateRes.error}`));
          }
        }

        results.push({ id: tc._id, title: tc.title, errCount: probs.length, probs });
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        const tbl = new Table({ head: ['ID', 'Title', 'Errors'] });
        results.forEach((r) => {
          tbl.push([r.id, r.title.substring(0, 40), r.errCount === 0 ? chalk.green('0') : chalk.red(String(r.errCount))]);
        });
        console.log(tbl.toString());

        if (totalErrors > 0) {
          console.log(chalk.red(`❌ ${totalErrors} issues found.`));
          // Detailed list
          results.filter(r => r.errCount > 0).forEach(r => {
            console.log(`\n${chalk.bold(r.title)} (${r.id})`);
            r.probs.forEach((p: LintProblem) => {
              console.log(`  • ${chalk.red(p.error)}`);
              if (p.suggestion) {
                console.log(`    ${chalk.gray('Suggestion:')} ${p.suggestion}`);
              }
            });
          });
        } else {
          console.log(chalk.green('✅ All test cases passed lint checks.'));
        }
      }

      process.exit(totalErrors > 0 ? 1 : 0);
    } catch (err: any) {
      spinner.fail(chalk.red(err.message || 'Unknown error'));
      process.exit(1);
    }
  });
