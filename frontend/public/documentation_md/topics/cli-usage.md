# Labnex CLI Usage Guide 🖥️

The Labnex CLI is a powerful command-line interface that provides professional-grade testing automation tools with enhanced logging, real-time monitoring, and AI-powered features.

## 🚀 Installation

### Global Installation
```bash
# Install globally via npm
npm install -g @labnex/cli

# Verify installation
labnex --version  # Should show v1.3.0
labnex help
```

### One-time Usage
```bash
# Use npx for one-time execution
npx @labnex/cli --help
npx @labnex/cli run --project MYAPP
```

### Local Development
```bash
# Clone and build from source
git clone https://github.com/LabnexDev/Labnex.git
cd Labnex/packages/cli
npm install
npm run build

# Run locally
node dist/index.js --help
```

## 🎯 First-Time Setup

### Welcome Wizard
On first run, the CLI will automatically launch a welcome wizard that guides you through:

```bash
# First run automatically triggers setup
labnex --help

# The wizard will:
# 1. Collect your API key or help you create one
# 2. Configure your preferred API base URL
# 3. Set up your default project
# 4. Create local configuration files
```

### Configuration Files
The CLI uses two configuration files:

1. **Global Config** (`~/.labnex/config.json`):
   ```json
   {
     "token": "your-api-key",
     "apiUrl": "https://labnex-backend.onrender.com/api",
     "defaultProject": "MYAPP",
     "setupCompleted": true
   }
   ```

2. **Local Project Config** (`./labnex.config.json`):
   ```json
   {
     "baseUrl": "https://staging.myapp.com",
     "projectCode": "MYAPP", 
     "testDirectory": "./tests",
     "outputDirectory": "./test-results"
   }
   ```

## 🎯 Core Commands

### `labnex run` - Execute Tests

The primary command for running test suites with various options and configurations.

#### Basic Usage
```bash
# Run all tests for a project
labnex run --project <project-id>

# Run with AI optimization
labnex run --project <project-id> --ai-optimize

# Run with detailed logging (recommended)
labnex run --project <project-id> --ai-optimize --detailed
```

#### Advanced Options
```bash
# Custom environment
labnex run --project MYAPP --env production

# Parallel execution
labnex run --project MYAPP --parallel 8

# Specific test case
labnex run --project MYAPP --test-id 68362689160c68e7f548621d

# Multiple test cases
labnex run --project MYAPP --test-ids "test1,test2,test3"

# Watch mode for continuous testing
labnex run --project MYAPP --watch

# Combined advanced usage
labnex run --project MYAPP --env staging --parallel 4 --ai-optimize --detailed

# Cloud runner (default)
labnex run --project MYAPP --mode cloud

# Local browser execution
labnex run --project MYAPP --mode local

# Provide base URL for relative navigation
labnex run --project MYAPP --base-url https://staging.myapp.com

# Auth credentials for login flows
labnex run --project MYAPP --username john --password secret123
```

### `labnex status` - Monitor Execution

Check the status of active test runs and system health.

```bash
# Check overall status and active runs
labnex status

# Check specific test run
labnex status --run-id <test-run-id>

# System health check
labnex health
```

### `labnex list` - List Resources

Explore and list various resources in your Labnex workspace.

```bash
# List all projects
labnex list projects

# List test cases for a project
labnex list tests <project-id>

# List recent test runs
labnex list runs

# List with detailed information
labnex list projects --detailed
```

### `labnex projects` - Project Management

Manage projects from the command line.

```bash
# List all projects
labnex projects

# Show project details
labnex projects show <project-id>

# Create new project (interactive)
labnex projects create
```

### `labnex ai` - AI-Powered Features

Access advanced AI capabilities for test generation and optimization.

```bash
# Generate test case with AI
labnex ai generate --description "Test login functionality"

# Generate for specific project
labnex ai generate --description "Shopping cart checkout" --project ECOM

# Optimize test suite for better performance
labnex ai optimize --project MYAPP

# Get AI insights on test patterns
labnex ai analyze --project MYAPP
```

### `labnex analyze` - Failure Analysis

Get AI-powered analysis of test failures and performance issues.

```bash
# Analyze specific failure
labnex analyze failure --run-id <test-run-id> --failure-id <failure-id>

# Analyze entire test run
labnex analyze run --run-id <test-run-id>

# Get optimization suggestions
labnex analyze performance --project MYAPP
```

### `labnex lint-tests` - Static Analysis

Automatically lint raw step files and receive AI-powered suggestions for improvements.

```bash
# Lint the tests directory and output results
labnex lint-tests ./tests

# Output results in JSON format
labnex lint-tests ./tests --json

# Interactive auto-fix with AI suggestions
labnex lint-tests ./tests --fix

# Lint specific files
labnex lint-tests ./tests/login-test.txt ./tests/checkout-test.txt
```

### `labnex create-test-case` - Import Test Cases

Convert plain-text test steps into structured test cases and upload them to projects.

```bash
# Import from a file
labnex create-test-case --project MYAPP --file checkout-steps.txt

# Import from multiple files
labnex create-test-case --project MYAPP --file "tests/*.txt"

# Pipe from stdin
cat steps.md | labnex create-test-case --project MYAPP --stdin

# Pipe with custom title
echo "Navigate to login page
Enter credentials
Click submit" | labnex create-test-case --project MYAPP --stdin --title "Login Test"
```

### `labnex auth` - Authentication Management

Manage your authentication credentials and API keys.

```bash
# Login with credentials
labnex auth login

# Set API key
labnex auth token <your-api-key>

# Check current authentication status
labnex auth status

# Logout (clear stored credentials)
labnex auth logout
```

### `labnex config` - Configuration Management

Manage CLI configuration settings.

```bash
# Show current configuration
labnex config show

# Set configuration values
labnex config set apiUrl https://api.labnex.dev
labnex config set defaultProject MYAPP

# Reset configuration
labnex config reset
```

### `labnex completion` - Shell Completion

Set up shell completion for faster command usage.

```bash
# Generate completion script for bash
labnex completion bash

# Generate completion script for zsh
labnex completion zsh

# Generate completion script for PowerShell
labnex completion powershell

# Install completion (bash example)
labnex completion bash >> ~/.bashrc
source ~/.bashrc
```

## 🔍 Enhanced Logging with `--detailed`

The `--detailed` flag transforms the CLI from basic progress updates to comprehensive real-time test execution monitoring.

### Standard Output
```bash
🚀 Initializing test run...
📊 Progress: 0/6 tests completed
📊 Progress: 1/6 tests completed
✅ Passed: 1
```

### Enhanced Output with `--detailed`
```bash
🚀 Labnex CLI v1.3.0
────────────────────────────────────────
📝 Project: MYAPP (Web Application)
🌍 Environment: staging
⚡ Parallel workers: 4
🖱 AI Optimization: enabled
🔍 Detailed logging: enabled

🧠 AI Analysis Phase:
   • Analyzing test suite and optimizing execution order
   • Code changes detected: Reviewing project files
   • Estimated completion time: 2-3 minutes

🌐 Browser Environment Setup:
   • Launching Chrome browser in headless mode
   • Window size: 1920x1080
   • User agent: Labnex-Bot/1.0

🧪 Starting: User Authentication Test
   ───────────────────────────────────────
🔗 [2.1s] Navigating to login page: https://staging.myapp.com/login
   • Page load time: 647ms
   • HTTP response: 200
   • DOM ready: 523ms

🖱️ [2.8s] Clicking email input field
   • Element: #email-input
   • Execution time: 43ms
   • Element found: ✓

⌨️ [3.2s] Typing user credentials
   • Value: "user@example.com"
   • Typing speed: 127ms
   • Characters: 16

🖱️ [3.9s] Clicking password field
   • Element: #password-input
   • Execution time: 38ms
   • Element found: ✓

⌨️ [4.1s] Entering password
   • Value: "••••••••"
   • Typing speed: 89ms
   • Security: masked

🖱️ [4.7s] Clicking login button
   • Element: button[type="submit"]
   • Execution time: 51ms
   • Button state: enabled

🔗 [5.2s] Redirected to dashboard: https://staging.myapp.com/dashboard
   • Page load time: 523ms
   • HTTP response: 200
   • Redirect successful: ✓

✓ [5.8s] Verifying successful login
   • Expected: Dashboard loaded
   • Actual: Dashboard loaded
   • Verification time: 21ms
   • Status: ✅ PASSED

📸 [6.1s] Capturing success screenshot: login-success.png

   ───────────────────────────────────────
✅ PASSED User Authentication Test (4,234ms)
   • Actions performed: 9
   • Assertions verified: 1
   • Average response time: 585ms
   • Screenshots: 1

📊 Progress: 1/6 ████░░░░░░░░░░░░░░░░ 17%

⚡ Performance Snapshot:
   • Current page load: 623ms
   • Network requests: 8
   • Memory usage: 42MB
   • CPU usage: 12%

🎉 Test Run Completed Successfully!

┌─────────────────────────────────────────────┐
│                 Final Results                │
├─────────────────────────────────────────────┤
│ 📊 Total Tests:                           6 │
│ ✅ Passed:                                5 │
│ ❌ Failed:                                1 │
│ ⏭️ Skipped:                               0 │
│ ⏱️ Total Time:                      14.2s │
│ 🚀 Average Test Time:               2.37s │
│ 📈 Success Rate:                     83.3% │
└─────────────────────────────────────────────┘

🔍 Detailed Performance Metrics:
   • Fastest Test: 1.2s (Simple Navigation)
   • Slowest Test: 4.8s (Complex Form Submission)
   • Network Latency: 45ms avg
   • Browser Memory: 156MB peak

📋 Next Steps:
   • Review failed test: "Form Validation Test"
   • Check logs at: ./test-results/run-2024-01-15-14-30-25/
   • AI Analysis: Available via 'labnex analyze run <run-id>'
```

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Override API URL
export LABNEX_API_URL=https://api.labnex.dev

# Enable verbose logging
export LABNEX_VERBOSE=true

# Set custom config directory
export LABNEX_CONFIG_DIR=~/.config/labnex
```

### Project-Specific Configuration
Create a `labnex.config.json` in your project root:

```json
{
  "baseUrl": "https://staging.myapp.com",
  "projectCode": "MYAPP",
  "testDirectory": "./tests",
  "outputDirectory": "./test-results",
  "defaultEnvironment": "staging",
  "parallelWorkers": 4,
  "aiOptimization": true,
  "screenshotOnFailure": true,
  "retryFailedTests": 2
}
```

## 📋 Common Usage Examples

```bash
# Complete workflow for a new project
labnex projects create
labnex run --project NEWAPP --ai-optimize --detailed

# Daily testing routine
labnex run --project MYAPP --env staging --parallel 8 --detailed

# Continuous integration
labnex run --project MYAPP --mode cloud --parallel 16 --json > results.json

# Debug specific test failure
labnex run --project MYAPP --test-id 68362689160c68e7f548621d --detailed
labnex analyze failure --run-id <run-id>

# Generate and run new tests
labnex ai generate --description "Test password reset flow" --project MYAPP
labnex run --project MYAPP --ai-optimize

# Lint and fix test files
labnex lint-tests ./tests --fix
labnex create-test-case --project MYAPP --file tests/cleaned-test.txt
```

## 🆘 Troubleshooting

### Common Issues

**Authentication Problems:**
```bash
# Check auth status
labnex auth status

# Re-authenticate
labnex auth login
```

**Configuration Issues:**
```bash
# Check current config
labnex config show

# Reset to defaults
labnex config reset
```

**Network/Connection Issues:**
```bash
# Test connectivity
labnex status

# Use different API URL
labnex --api-url https://api.labnex.dev status
```

### Getting Help

```bash
# General help
labnex --help

# Command-specific help
labnex run --help
labnex ai --help

# Version information
labnex --version
```

---

## 📚 Related Documentation

- **[API Reference](./api-reference.md)** - REST API for custom integrations
- **[Project Management](./project-management.md)** - Web interface project management
- **[Test Case Management](./test-case-management.md)** - Creating and managing test cases
- **[AI Features](./ai-features.md)** - Advanced AI capabilities

---

**💡 Pro Tips:**
- Use `--detailed` flag for comprehensive test execution logs
- Enable AI optimization for better test performance and insights
- Set up shell completion for faster command usage
- Use project-specific configuration files for consistent settings
- Combine CLI with CI/CD pipelines for automated testing workflows 