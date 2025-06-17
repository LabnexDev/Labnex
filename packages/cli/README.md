# Labnex CLI

AI-Powered Testing Automation Platform Command Line Interface

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://www.npmjs.com/package/@labnex/cli)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/LabnexDev/Labnex/blob/main/LICENSE)

## Installation

```bash
# Install globally
npm install -g @labnex/cli

# Or use npx
npx @labnex/cli --help
```

## Authentication

Before using the CLI, you need to authenticate:

```bash
# Configure your API settings
labnex config set

# Log in with your credentials
labnex auth login
```

## Commands

### Running Tests

```bash
# Run all tests for a project
labnex run --project-id <PROJECT_ID>

# Run a specific test case
labnex run --project-id <PROJECT_ID> --test-id <TEST_ID>

# Run with AI optimization (recommended)
labnex run --project-id <PROJECT_ID> --optimize-ai

# Run in headless mode
labnex run --project-id <PROJECT_ID> --headless

# Run with verbose logging
labnex run --project-id <PROJECT_ID> --verbose
```

### Managing Projects

```bash
# List all projects
labnex list --projects

# List test cases for a project
labnex list --tests <PROJECT_ID>

# Create a new project
labnex projects create --name "My Project" --code PROJECT1 --description "Description"

# List all projects with details
labnex projects list
```

### Linting & Importing

```bash
# Static-analysis of raw step files
labnex lint-tests ./tests --json

# Convert raw steps into a Test Case
labnex create-test-case --project-id <PROJECT_ID> --file checkout.txt
```

### AI Features

```bash
# Generate a test case with AI
labnex ai generate --description "Test the login functionality with valid credentials"

# Optimize test selection with AI
labnex ai optimize --project <PROJECT_CODE>
```

### Analysis

```bash
# Analyze test failure
labnex analyze failure --run-id <RUN_ID>

# Check overall status
labnex status

# Check specific test run
labnex status --run-id <RUN_ID>
```

## Options

### Global Options

| Option | Description |
|--------|-------------|
| `--verbose` | Enable detailed logging |
| `--api-url <url>` | Override API URL |

### Run Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --project-id <id>` | Project ID (required) | - |
| `-t, --test-id <id>` | Run specific test case by ID | - |
| `-e, --environment <env>` | Environment (staging/production) | `staging` |
| `-m, --mode <mode>` | Execution mode (local/cloud) | `cloud` |
| `--optimize-ai` | Enable AI optimization for element finding | `false` |
| `--parallel <number>` | Number of parallel workers (cloud mode) | `4` |
| `--headless` | Run in headless mode (local mode) | `false` |
| `--timeout <ms>` | Test timeout in milliseconds | `300000` |
| `--base-url <url>` | Base URL for relative navigation | - |
| `--username <user>` | Supply login username | - |
| `--password <pass>` | Supply login password | - |

## Performance Features

- **AI Element Optimization**: Enables intelligent element finding and reduces flakiness
- **Iframe Handling**: Optimized iframe switching for complex web applications
- **Smart Waits**: Dynamic wait times based on element visibility
- **Detailed Reporting**: Step-by-step execution reports with timing

## Changelog

### Version 1.4.0 (Current)
- Cloud execution mode enabled by default (`--mode cloud`)
- Added `lint-tests` and `create-test-case` commands
- New flags: `--base-url`, `--username`, `--password`
- Updated docs & examples across website and npm package

### Status of Features

#### Working Features
- Core CLI commands and help system
- Project and test case listing
- Test execution with AI optimization
- Basic login flow testing on standard websites
- Status reporting and detailed logging

#### Recently Added
- Cloud execution mode (default) with live progress streaming
- Static test linter (`lint-tests`) and interactive `--fix` flow
- Raw step importer (`create-test-case`) for quick Test Case creation

#### Known Issues
- Some complex UI interactions (like modals on certain websites) may require specific selectors
- File upload operations require test files to be present in the expected location

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

```bash
# Reset API configuration
labnex config set --reset

# Login again
labnex auth login
```

### Connection Problems

If you cannot connect to the Labnex API:

```bash
# Check status
labnex status

# Configure custom API URL
labnex config set --api-url https://custom-api.labnex.com
```

### Browser Execution Errors

If tests fail with browser-related errors:

```bash
# Update dependencies
npm update -g @labnex/cli

# Run with verbose logging
labnex run --project-id <ID> --verbose
```

## Examples

### Example 1: Complete Test Workflow

```bash
# Create a new project
labnex projects create --name "E-commerce Site" --code ECOM --description "Testing for our e-commerce platform"

# Generate tests with AI
labnex ai generate --description "Test checkout process with credit card payment"

# Run all tests with optimization
labnex run --project-id <PROJECT_ID> --optimize-ai --headless
```

### Example 2: Debugging Failed Tests

```bash
# Run specific test with detailed logging
labnex run --project-id <PROJECT_ID> --test-id <TEST_ID> --verbose

# Analyze failure reasons
labnex analyze failure --run-id <LATEST_RUN_ID>
```

## Documentation

For complete documentation, visit [https://labnexdev.github.io/Labnex](https://labnexdev.github.io/Labnex)

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](https://github.com/LabnexDev/Labnex/blob/main/CONTRIBUTING.md) file for details.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/LabnexDev/Labnex/blob/main/LICENSE) file for details. 