import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface ProjectConfig {
  baseUrl: string;
}

const CONFIG_FILE = 'labnex.config.json';

export function loadProjectConfig(cwd: string = process.cwd()): ProjectConfig | null {
  const path = join(cwd, CONFIG_FILE);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as ProjectConfig;
    return data;
  } catch {
    return null;
  }
}

export function saveProjectConfig(config: ProjectConfig, cwd: string = process.cwd()): void {
  const path = join(cwd, CONFIG_FILE);
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
} 