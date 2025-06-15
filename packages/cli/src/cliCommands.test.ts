import { execSync } from 'child_process';
import path from 'path';

// Helper to build the Node command for running the CLI from source with ts-node.
// We run from the package root, so src/index.ts is resolved relative to cwd.
const CLI_CMD = `node -r ts-node/register ${path.join('src', 'index.ts')}`;

describe('Labnex CLI basic commands', () => {
  it('should display the version with --version flag', () => {
    const output = execSync(`${CLI_CMD} --version`, { encoding: 'utf8' });
    expect(output).toContain('1.3.0');
  });

  it('should display help information with --help flag', () => {
    const output = execSync(`${CLI_CMD} --help`, { encoding: 'utf8' });
    // Commander shows "Usage:" in its help output
    expect(output.toLowerCase()).toContain('usage');
    expect(output.toLowerCase()).toContain('labnex');
  });

  it('should display help for auth command', () => {
    const output = execSync(`${CLI_CMD} auth --help`, { encoding: 'utf8' });
    expect(output.toLowerCase()).toContain('auth');
  });
}); 