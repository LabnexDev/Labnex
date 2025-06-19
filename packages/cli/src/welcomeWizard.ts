import inquirer from 'inquirer';
import chalk from 'chalk';
import open from 'open';
import { saveConfig } from './utils/config';
import { apiClient } from './api/client';
import { join } from 'path';
import { homedir } from 'os';

export async function runWelcomeWizard() {
  console.log(chalk.bold.cyan('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
  console.log(chalk.bold.cyan('┃        Welcome to the Labnex CLI!          ┃'));
  console.log(chalk.bold.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
  console.log(chalk.gray('Let\'s get you set up in just a few steps.\n'));

  // Step 1: API Key Setup
  let apiKey = '';
  let validated = false;

  const { needsKey } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'needsKey',
      message: 'Do you have a Labnex API key?',
      default: false
    }
  ]);

  if (!needsKey) {
    console.log(chalk.cyan('\n🔑 Let\'s get you an API key first!'));
    
    const { openBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Open browser to get API key from Labnex?',
        default: true
      }
    ]);

    if (openBrowser) {
      await open('https://labnexdev.github.io/Labnex/settings/api-keys');
      console.log(chalk.cyan('Browser opened. Once you\'ve created a key, come back and paste it below.'));
    }
  }

  // Get and validate API key
  while (!validated) {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your API key:',
        mask: '*'
      }
    ]);

    apiKey = key;

         try {
       // Test the API key by temporarily setting it
       apiClient.setApiKey(apiKey);
       const testResponse = await apiClient.getProjects();
       if (testResponse.success) {
         validated = true;
       } else {
         console.log(chalk.red('Invalid or unauthorized API key, please try again.'));
       }
     } catch (error) {
       console.log(chalk.red('Invalid or unauthorized API key, please try again.'));
     }
  }

  // Step 2: API URL Setup (optional)
  const { customUrl } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customUrl',
      message: 'Are you using a custom Labnex server URL? (Skip if using default)',
      default: false
    }
  ]);

  let baseUrl = 'https://labnexdev.github.io/Labnex';
  if (customUrl) {
    const { url } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter your Labnex server URL:',
        default: 'https://labnexdev.github.io/Labnex'
      }
    ]);
    baseUrl = url;
  }

  // Step 3: Project Setup
  let projectCode = '';
  
  try {
    const projectsResponse = await apiClient.getProjects();
    
    if (projectsResponse.success && projectsResponse.data.length > 0) {
      const { selectedProject } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProject',
          message: 'Select a default project:',
          choices: [
            ...projectsResponse.data.map((p: any) => ({
              name: `${p.name} (${p.projectCode})`,
              value: p.projectCode
            })),
            { name: 'Create a new project', value: 'CREATE_NEW' }
          ]
        }
      ]);

      if (selectedProject === 'CREATE_NEW') {
        const { name, code } = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Project name:' },
          { type: 'input', name: 'code', message: 'Project code (e.g., MYAPP):' }
        ]);
        
        const createResp = await apiClient.createProject({ name, projectCode: code, description: `Created via CLI setup wizard` });
        if (createResp.success) {
          console.log(chalk.green(`Project created: ${createResp.data.projectCode}`));
          projectCode = createResp.data.projectCode;
        }
      } else {
        projectCode = selectedProject;
      }
    } else {
      console.log(chalk.yellow('No projects found. Let\'s create one.'));
      const { name, code } = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Project name:' },
        { type: 'input', name: 'code', message: 'Project code (e.g., MYAPP):' }
      ]);
      
      const createResp = await apiClient.createProject({ name, projectCode: code, description: `Created via CLI setup wizard` });
      if (createResp.success) {
        console.log(chalk.green(`Project created: ${createResp.data.projectCode}`));
        projectCode = createResp.data.projectCode;
      }
    }
  } catch (err: any) {
    console.log(chalk.red('Error fetching/creating project:'), err.message);
    projectCode = 'DEFAULT';
  }

     // Save configuration
   await saveConfig({
     token: apiKey,
     apiUrl: baseUrl,
     defaultProject: projectCode
   });

  // Optional: Create labnex.config.json
  const { createLocalConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createLocalConfig',
      message: 'Create labnex.config.json in current directory?',
      default: true
    }
  ]);

  if (createLocalConfig) {
    const fs = await import('fs/promises');
    const localConfigPath = './labnex.config.json';
         const localConfig = {
       baseUrl: baseUrl,
       projectCode: projectCode,
       testDirectory: './tests',
       outputDirectory: './test-results'
     };
    
    await fs.writeFile(localConfigPath, JSON.stringify(localConfig, null, 2));
    console.log(chalk.green('Saved base URL to labnex.config.json'));
  }

  // Final success message
  console.log(chalk.green('\nSetup complete! You\'re ready to use Labnex CLI.'));
  console.log(chalk.cyan('Tip: Run `labnex run --help` to see available options.'));

     // Save the final config to ensure everything is persisted
   const finalConfig = {
     token: apiKey,
     apiUrl: baseUrl,
     defaultProject: projectCode,
     setupCompleted: true,
     setupCompletedAt: new Date().toISOString()
   };

   await saveConfig(finalConfig);
}