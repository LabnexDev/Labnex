import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

export interface LabnexConfig {
  apiUrl: string;
  token?: string;
  userId?: string;
  email?: string;
  verbose?: boolean;
}

const CONFIG_DIR = join(homedir(), '.labnex');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: LabnexConfig = {  apiUrl: process.env.LABNEX_API_URL || 'http://localhost:5000/api',  verbose: false};

export async function initConfig(): Promise<void> {
  try {
    // Ensure config directory exists
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Create default config if it doesn't exist
    if (!existsSync(CONFIG_FILE)) {
      await saveConfig(DEFAULT_CONFIG);
      console.log(chalk.gray(`Initialized config at ${CONFIG_FILE}`));
    }
  } catch (error) {
    console.error(chalk.red('Failed to initialize config:'), error);
  }
}

export async function loadConfig(): Promise<LabnexConfig> {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return DEFAULT_CONFIG;
    }

    const configData = readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error(chalk.yellow('Warning: Failed to load config, using defaults'));
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: LabnexConfig): Promise<void> {
  try {
    const configJson = JSON.stringify(config, null, 2);
    writeFileSync(CONFIG_FILE, configJson, 'utf8');
  } catch (error) {
    console.error(chalk.red('Failed to save config:'), error);
    throw error;
  }
}

export async function updateConfig(updates: Partial<LabnexConfig>): Promise<LabnexConfig> {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}

export async function clearConfig(): Promise<void> {
  await saveConfig(DEFAULT_CONFIG);
  console.log(chalk.green('Configuration cleared'));
}

export function getConfigPath(): string {
  return CONFIG_FILE;
} 