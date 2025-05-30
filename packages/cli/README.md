# Labnex CLI

AI-Powered Testing Automation Platform - Command Line Interface

## 🚀 Quick Start

### Installation
```bash
cd packages/cli
npm install
npm run build
```

### Basic Usage

**Important:** Always run commands from the `packages/cli` directory!

```bash
# Navigate to CLI directory first
cd packages/cli

# Then run commands
node dist/index.js --help
```

## 📋 Commands

### 🧪 Run Tests
```bash
# Run all tests for a project
node dist/index.js run --project-id <PROJECT_ID>

# Run specific test case
node dist/index.js run --project-id <PROJECT_ID> --test-id <TEST_ID>

# Run with AI optimization (recommended)
node dist/index.js run --project-id <PROJECT_ID> --optimize-ai --verbose
```

### 📂 List Projects & Tests
```bash
# List all projects
node dist/index.js list --projects

# List test cases for a project
node dist/index.js list --tests <PROJECT_ID>
```

### 📊 Check Status
```bash
# Check overall status
node dist/index.js status

# Check specific test run
node dist/index.js status --run-id <RUN_ID>
```

## 🎯 Examples

### Example 1: Run W3Schools Modal Test
```bash
cd packages/cli
node dist/index.js run --project-id 6832ac498153de9c85b03727 --test-id 68362689160c68e7f548621d --optimize-ai --verbose
```

### Example 2: List All Projects
```bash
cd packages/cli
node dist/index.js list --projects
```

### Example 3: Run All Tests with AI Optimization
```bash
cd packages/cli
node dist/index.js run --project-id 6832ac498153de9c85b03727 --optimize-ai
```

## ⚡ Performance Features

- **AI-Optimized Element Finding**: Use `--optimize-ai` for intelligent element detection
- **Fast Iframe Switching**: Optimized from 5+ minutes to seconds
- **Smart Timeouts**: Reduced from 30s to 10s with faster failure detection
- **Verbose Logging**: Use `--verbose` for detailed step-by-step execution

## 🔧 Configuration Options

### Run Command Options
- `-p, --project-id <id>` - Project ID (required)
- `-t, --test-id <id>` - Specific test case ID
- `-e, --environment <env>` - Environment (staging/production)
- `-m, --mode <mode>` - Execution mode (local/cloud)
- `--optimize-ai` - Enable AI optimization (recommended)
- `--verbose` - Detailed logging
- `--headless` - Run in headless mode
- `--timeout <ms>` - Test timeout in milliseconds

### List Command Options
- `-p, --projects` - List all projects
- `-t, --tests <projectId>` - List test cases for project

## 🏗️ Directory Structure

```
packages/cli/
├── dist/              # Built files (run commands from here)
├── src/               # Source code
├── quick-test.bat     # Quick test script
├── help-test.bat      # Help system test
└── README.md          # This file
```

## 🚨 Troubleshooting

### "Cannot find module" Error
This happens when running from the wrong directory.

**❌ Wrong:**
```bash
# From root directory
PS F:\VSC Projects\Labnex> node dist/index.js run --project-id ...
# Error: Cannot find module 'F:\VSC Projects\Labnex\dist\index.js'
```

**✅ Correct:**
```bash
# Navigate to CLI directory first
PS F:\VSC Projects\Labnex> cd packages/cli
PS F:\VSC Projects\Labnex\packages\cli> node dist/index.js run --project-id ...
```

### Build Issues
If you encounter TypeScript errors:
```bash
cd packages/cli
npm run build
```

### Performance Issues
Always use AI optimization for best performance:
```bash
node dist/index.js run --project-id <ID> --optimize-ai
```

## 📚 Documentation

For detailed documentation, visit: https://labnexdev.github.io/Labnex

## 🆘 Getting Help

```bash
# Main help
node dist/index.js --help

# Command-specific help
node dist/index.js run --help
node dist/index.js list --help
node dist/index.js status --help
``` 