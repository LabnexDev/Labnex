import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, updateConfig, clearConfig, getConfigPath } from '../utils/config';

export function setupConfigCommands(): Command {
  const config = new Command('config');
  config.description('Manage Labnex CLI configuration settings (API URL, verbosity, etc.).');

  // Set configuration value
  config
    .command('set <key> <value>')
    .description('Set a specific configuration key to a new value (e.g., apiUrl).')
    .action(async (key: string, value: string) => {
      try {
        const allowedKeys = ['apiUrl', 'verbose'];
        
        if (!allowedKeys.includes(key)) {
          console.error(chalk.red(`Invalid key: ${key}`));
          console.error(chalk.gray(`Allowed keys: ${allowedKeys.join(', ')}`));
          process.exit(1);
        }

        const updates: any = {};
        
        if (key === 'verbose') {
          updates.verbose = value.toLowerCase() === 'true';
        } else {
          updates[key] = value;
        }

        await updateConfig(updates);
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
      } catch (error: any) {
        console.error(chalk.red(`Failed to set config: ${error.message}`));
        process.exit(1);
      }
    });

  // Get configuration value
  config
    .command('get [key]')
    .description('Display the current value of a specific key or all configurations.')
    .action(async (key?: string) => {
      try {
        const currentConfig = await loadConfig();
        
        if (key) {
          console.log(chalk.blue(`${key}: ${(currentConfig as any)[key] || 'not set'}`));
        } else {
          console.log(chalk.blue('Current Configuration:'));
          console.log(chalk.gray('─'.repeat(30)));
          Object.entries(currentConfig).forEach(([k, v]) => {
            console.log(`${k}: ${v}`);
          });
          console.log(chalk.gray('─'.repeat(30)));
          console.log(chalk.gray(`Config file: ${getConfigPath()}`));
        }
      } catch (error: any) {
        console.error(chalk.red(`Failed to get config: ${error.message}`));
        process.exit(1);
      }
    });

  // Reset configuration
  config
    .command('reset')
    .description('Reset all Labnex CLI configurations to their default values.')
    .action(async () => {
      try {
        await clearConfig();
        console.log(chalk.green('✓ Configuration reset to defaults'));
      } catch (error: any) {
        console.error(chalk.red(`Failed to reset config: ${error.message}`));
        process.exit(1);
      }
    });

  // Setup production configuration
  config
    .command('setup-production')
    .description('Quickly configure the CLI to use the production Labnex API endpoint.')
    .action(async () => {
      try {
        await updateConfig({
          apiUrl: 'https://labnex-backend.onrender.com/api',
          verbose: false
        });
        console.log(chalk.green('✓ CLI configured for production'));
        console.log(chalk.blue('  API URL: https://labnex-backend.onrender.com/api'));
        console.log(chalk.gray('  You can now run: labnex auth login'));
      } catch (error: any) {
        console.error(chalk.red(`Failed to setup production config: ${error.message}`));
        process.exit(1);
      }
    });

  return config;
} 