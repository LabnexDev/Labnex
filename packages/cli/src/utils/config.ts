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
  defaultProject?: string;
  setupCompleted?: boolean;
  setupCompletedAt?: string;
}

const CONFIG_DIR = join(homedir(), '.labnex');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_API_URL = 'https://labnex-backend.onrender.com/api';

// Allow override via env if power-user sets LABNEX_API_URL
const DEFAULT_CONFIG: LabnexConfig = {
  apiUrl: process.env.LABNEX_API_URL || DEFAULT_API_URL,
  verbose: false,
};

export async function initConfig(): Promise<void> {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (!existsSync(CONFIG_FILE)) {
      await saveConfig(DEFAULT_CONFIG);
      if (process.env.NODE_ENV === 'development') {
        console.log(chalk.gray(`Initialized config at ${CONFIG_FILE}`));
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(chalk.red('Failed to initialize config:'), error);
    }
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
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(chalk.yellow('Warning: Failed to load config, using defaults'));
    }
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Partial<LabnexConfig>): Promise<void> {
  try {
    const currentConfig = await loadConfig();
    const newConfig = { ...currentConfig, ...config };
    const configJson = JSON.stringify(newConfig, null, 2);
    writeFileSync(CONFIG_FILE, configJson, 'utf8');
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(chalk.red('Failed to save config:'), error);
    }
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