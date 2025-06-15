import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { apiClient } from '../api/client';
import { updateConfig, clearConfig, loadConfig } from '../utils/config';

export const authCommand = new Command('auth')
  .description('Manage Labnex authentication, API tokens, and session status.')
  .addCommand(
    new Command('login')
      .description('Authenticate with the Labnex platform to obtain an API token.')
      .option('-e, --email <email>', 'Email address')
      .option('-p, --password <password>', 'Password (not recommended for security)')
      .action(async (options) => {
        try {
          let { email, password } = options;

          // Prompt for email if not provided
          if (!email) {
            const emailPrompt = await inquirer.prompt([
              {
                type: 'input',
                name: 'email',
                message: 'Email:',
                validate: (input) => {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  return emailRegex.test(input) || 'Please enter a valid email address';
                }
              }
            ]);
            email = emailPrompt.email;
          }

          // Prompt for password if not provided
          if (!password) {
            const passwordPrompt = await inquirer.prompt([
              {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*',
                validate: (input) => input.length > 0 || 'Password is required'
              }
            ]);
            password = passwordPrompt.password;
          }

          const spinner = ora('Authenticating...').start();

          try {
            const response = await apiClient.login(email, password);
            
            if (response.success && response.data.token) {
              // Save auth data to config
              await updateConfig({
                token: response.data.token,
                email: email,
                userId: (response.data.user as { id: string }).id
              });

              spinner.succeed(chalk.green(`Successfully logged in as ${email}`));
              console.log(chalk.gray(`Token saved to config file`));
            } else {
              spinner.fail(chalk.red('Login failed: ' + (response.error || 'Unknown error')));
            }
          } catch (error: unknown) {
            spinner.fail(chalk.red('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error')));
          }
        } catch (error: unknown) {
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        }
      })
  )
  .addCommand(
    new Command('logout')
      .description('Clear local authentication data and log out from Labnex.')
      .action(async () => {
        try {
          const spinner = ora('Logging out...').start();
          
          await clearConfig();
          
          spinner.succeed(chalk.green('Successfully logged out'));
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Check your current Labnex authentication status and API configuration.')
      .action(async () => {
        try {
          const config = await loadConfig();
          
          if (!config.token) {
            console.log(chalk.yellow('Not authenticated. Run: labnex auth login'));
            return;
          }

          const spinner = ora('Checking authentication...').start();

          try {
            const response = await apiClient.me();
            
            if (response.success) {
              spinner.succeed(chalk.green('Authenticated'));
              console.log(chalk.gray(`Email: ${config.email}`));
              console.log(chalk.gray(`API URL: ${config.apiUrl}`));
            } else {
              spinner.fail(chalk.red('Authentication invalid'));
            }
          } catch (error: any) {
            spinner.fail(chalk.red('Authentication check failed'));
            if (error.response?.status === 401) {
              console.log(chalk.yellow('Please login again: labnex auth login'));
            }
          }
        } catch (error: any) {
          console.error(chalk.red('Error:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('use-key')
      .description('Save an API key issued from the Labnex dashboard (no email/password login required).')
      .argument('<token>', 'API key that starts with lab_')
      .action(async (token: string) => {
        try {
          if (!token || token.length < 10) {
            console.error(chalk.red('Invalid token.'));
            return;
          }

          await updateConfig({ token });
          console.log(chalk.green('✓ API key saved. You can now run Labnex commands.'));
        } catch (error: any) {
          console.error(chalk.red('Failed to save key:'), error.message);
        }
      })
  ); 