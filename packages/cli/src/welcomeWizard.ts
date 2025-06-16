import inquirer from 'inquirer';
import chalk from 'chalk';
// Note: 'open' is ESM-only; we'll load it dynamically when needed to avoid CommonJS require issues
import { apiClient } from './api/client';
import { saveProjectConfig } from './utils/projectConfig';
import axios from 'axios';

export async function runWelcomeWizard() {
  console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
  console.log(chalk.bold.cyan('┃        Welcome to the Labnex CLI!          ┃'));
  console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
  console.log(chalk.gray('Let\'s get you set up in just a few steps.\n'));

  // Step 1: API Key
  let apiKey: string = '';
  while (!apiKey) {
    const { method } = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'How would you like to authenticate?',
        choices: [
          { name: 'Paste existing API key', value: 'paste' },
          { name: 'Open dashboard to create key', value: 'open' },
        ],
      },
    ]);

    if (method === 'open') {
      const { default: open } = await import('open');
      await open('https://app.labnex.ai/settings/api-keys');
      console.log(chalk.cyan('Browser opened. Once you\'ve created a key, come back and paste it below.'));
    }

    const { key } = await inquirer.prompt([
      {
        type: 'password',
        mask: '*',
        name: 'key',
        message: 'Paste your Labnex API key:',
        validate: (val: string) => val.trim() !== '' || 'API key cannot be empty',
      },
    ]);
    apiKey = key.trim();

    // Validate key by hitting /auth/me directly
    try {
      const base = process.env.LABNEX_API_URL || 'https://labnex-backend.onrender.com/api';
      await axios.get(base + '/auth/me', { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 });
    } catch {
      console.log(chalk.red('Invalid or unauthorized API key, please try again.'));
      apiKey = '';
    }
  }

  // Update token in config
  const baseCfg = { token: apiKey };

  // Step 2: Select or create project
  let projectId: string = '';
  try {
    // Temporarily inject token into global apiClient for subsequent calls during wizard
    process.env.LABNEX_API_TOKEN_TEMP = apiKey;

    // Monkey patch loadConfig to return the token during wizard
    const cfgUtils = require('./utils/config');
    const originalLoadConfig = cfgUtils.loadConfig;
    cfgUtils.loadConfig = async () => ({ apiUrl: process.env.LABNEX_API_URL || 'https://labnex-backend.onrender.com/api', token: apiKey });

    const projectsResp = await apiClient.getProjects();
    if (projectsResp.success && projectsResp.data.length > 0) {
      const choices = projectsResp.data.map((p: any) => ({
        name: `${p.name} (${p.projectCode})`,
        value: p._id,
      }));
      choices.push({ name: chalk.yellow('<Create new project>'), value: '__create__' });

      const { chosen } = await inquirer.prompt([
        {
          type: 'list',
          name: 'chosen',
          message: 'Select a project to work with:',
          choices,
        },
      ]);

      if (chosen === '__create__') {
        const { name } = await inquirer.prompt({ type: 'input', name: 'name', message: 'Project name:' });
        const { code } = await inquirer.prompt({ type: 'input', name: 'code', message: 'Project code (optional):' });
        const createResp = await apiClient.createProject({ name, projectCode: code || undefined });
        if (createResp.success) {
          projectId = createResp.data._id;
          console.log(chalk.green(`Project created: ${createResp.data.projectCode}`));
        }
      } else {
        projectId = chosen;
      }
    } else {
      console.log(chalk.yellow('No projects found. Let\'s create one.'));
      const { name } = await inquirer.prompt({ type: 'input', name: 'name', message: 'Project name:' });
      const { code } = await inquirer.prompt({ type: 'input', name: 'code', message: 'Project code (optional):' });
      const createResp = await apiClient.createProject({ name, projectCode: code || undefined });
      if (createResp.success) {
        projectId = createResp.data._id;
        console.log(chalk.green(`Project created: ${createResp.data.projectCode}`));
      }
    }

    // Restore original loadConfig after project selection
    cfgUtils.loadConfig = originalLoadConfig;
  } catch (err: any) {
    console.log(chalk.red('Error fetching/creating project:'), err.message);
  }

  // Step 3: Default baseUrl
  const { baseUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter a default base URL for this project (e.g., https://example.com):',
      validate: (val: string) => /^https?:\/\//i.test(val) || 'Please enter a valid http(s) URL',
    },
  ]);

  const { rememberBase } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'rememberBase',
      message: 'Save this base URL in labnex.config.json inside this directory?',
      default: true,
    },
  ]);

  if (rememberBase) {
    saveProjectConfig({ baseUrl });
    console.log(chalk.green('Saved base URL to labnex.config.json'));
  }

  // Step 4: Offer example test
  const { runExample } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runExample',
      message: 'Would you like to run an example test now?',
      default: false,
    },
  ]);

  // Persist global config now
  const { updateConfig } = require('./utils/config');
  await updateConfig(baseCfg);

  console.log(chalk.green('\nSetup complete! You\'re ready to use Labnex CLI.'));
  console.log(chalk.cyan('Tip: Run `labnex run --help` to see available options.'));

  if (runExample) {
    const { runCommand } = await import('./commands/run');
    await runCommand.parseAsync(['node', 'labnex', 'run', '--project', projectId, '--base-url', baseUrl]);
  }
}