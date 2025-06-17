# Labnex CLI Usage Guide 🖥️

The Labnex CLI is a powerful command-line interface that provides professional-grade testing automation tools with enhanced logging, real-time monitoring, and AI-powered features.

## 🚀 Installation

### Global Installation
```bash
# Install globally via npm
npm install -g @labnex/cli

# Verify installation
labnex --version
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

# Specific test suite
labnex run --project MYAPP --suite "smoke-tests"

# Watch mode for continuous testing
labnex run --project MYAPP --watch

# Combined advanced usage
labnex run --project MYAPP --env staging --parallel 4 --ai-optimize --detailed --suite "regression"

# Explicit cloud runner (default)
labnex run --project MYAPP --mode cloud

# Provide base URL for relative navigation
labnex run --project MYAPP --base-url https://staging.myapp.com

# Auth credentials for login flows
labnex run --project MYAPP --username john --password secret123
```

### `labnex generate` - AI Test Generation

Create test cases using AI with natural language descriptions.

```bash
# Generate test case
labnex generate test "User login functionality"

# More specific description
labnex generate test "User can log in with valid email and password, and is redirected to dashboard"

# Generate for specific project
labnex generate test "Shopping cart checkout process" --project ECOM
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

### `labnex status` - System Status

Check the status of active test runs and system health.

```bash
# Check active test runs
labnex status

# System health check
labnex health

# Project-specific status
labnex status --project MYAPP
```

### `labnex projects` - Project Management

Manage projects from the command line.

```bash
# List all projects
labnex projects

# Show project details
labnex project show MYAPP

# Create new project (interactive)
labnex project create
```

### `labnex lint-tests` - Static Analysis

Automatically lint raw step files and receive AI-powered suggestions. Use `--fix` to auto-repair.

```bash
# Lint the tests directory and output JSON
labnex lint-tests ./tests --json

# Interactive auto-fix
labnex lint-tests ./tests --fix
```

### `labnex create-test-case` - Import Raw Steps

Convert a plain-text list of steps into a structured test case and upload it to a project.

```bash
# Import from a file
labnex create-test-case --project MYAPP --file checkout-steps.txt

# Pipe from stdin
cat steps.md | labnex create-test-case --project MYAPP --stdin
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
🚀 Initializing test run...
📝 Project ID: MYAPP
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

🖱️ [2.8s] Clicking email input field
   • Element: #email-input
   • Execution time: 43ms

⌨️ [3.2s] Typing user credentials
   • Value: "user@example.com"
   • Typing speed: 127ms

🖱️ [3.9s] Clicking password field
   • Element: #password-input
   • Execution time: 38ms

⌨️ [4.1s] Entering password
   • Value: "••••••••"
   • Typing speed: 89ms

🖱️ [4.7s] Clicking login button
   • Element: button[type="submit"]
   • Execution time: 51ms

🔗 [5.2s] Redirected to dashboard: https://staging.myapp.com/dashboard
   • Page load time: 523ms
   • HTTP response: 200

✓ [5.8s] Verifying successful login
   • Expected: Dashboard loaded
   • Verification time: 21ms

📸 [6.1s] Capturing success screenshot: login-success.png

   ───────────────────────────────────────
✅ PASSED User Authentication Test (4,234ms)
   • Actions performed: 9
   • Assertions verified: 1
   • Average response time: 585ms

📊 Progress: 1/6 ████░░░░░░░░░░░░░░░░ 17%

⚡ Performance Snapshot:
   • Current page load: 623ms
   • Network requests: 8
   • Memory usage: 42MB

🎉 Test Run Completed!

┌─────────────────────────────────────────────┐
│                 Final Results                │
├─────────────────────────────────────────────┤
│ 📊 Total Tests:                           6 │
│ ✅ Passed:                               6 │
│ ❌ Failed:                               0 │
│ ⏱️  Duration:                        15.2s │
│ 📈 Success Rate:                       100% │
└─────────────────────────────────────────────┘

⚡ Performance Summary:
   • Average page load: 587ms
   • Total actions performed: 39
   • Network requests: 68
   • Screenshots captured: 5

🔗 View detailed report: https://app.labnex.io/reports/683171b0e7fc522798bbca4c
```

## 🎨 Action Icons & Indicators

The detailed logging uses specific icons to represent different types of actions:

| Icon | Action Type | Description |
|------|-------------|-------------|
| 🔗 | Navigation | Page loads, redirects, URL changes |
| 🖱️ | Click | Button clicks, link clicks, element interactions |
| ⌨️ | Input | Text typing, form filling, keyboard actions |
| 👆 | Hover | Mouse hover events |
| 📜 | Scroll | Page scrolling actions |
| 📋 | Select | Dropdown selections, option choosing |
| 📤 | Upload | File upload actions |
| 📥 | Download | File download actions |
| 🫴 | Drag & Drop | Drag and drop interactions |
| ⏱️ | Wait | Explicit waits, delays |
| 🔄 | Refresh | Page refresh actions |
| ⬅️ | Back | Browser back navigation |
| ➡️ | Forward | Browser forward navigation |
| ✓ | Assertion | Test verification and assertions |
| 📸 | Screenshot | Screenshot capture |
| ⚡ | Performance | Performance metrics and snapshots |

## 🔧 Configuration & Environment

### Authentication
```bash
# Login to Labnex (interactive)
labnex auth login

# Check authentication status
labnex auth status

# Logout
labnex auth logout
```

### Environment Variables
```bash
# Set custom API URL
export LABNEX_API_URL=https://api.labnex.dev

# Enable verbose logging
export LABNEX_VERBOSE=true

# Set custom timeout
export LABNEX_TIMEOUT=300000
```

### Configuration File
Create a `.labnexrc` file in your project root:
```json
{
  "apiUrl": "https://api.labnex.dev",
  "defaultProject": "MYAPP",
  "defaultEnvironment": "staging",
  "parallelWorkers": 4,
  "timeout": 300000,
  "detailed": true
}
```

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
name: Labnex Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g @labnex/cli
      - run: labnex auth login --token ${{ secrets.LABNEX_TOKEN }}
      - run: labnex run --project ${{ vars.PROJECT_ID }} --ai-optimize --detailed
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm install -g @labnex/cli'
                withCredentials([string(credentialsId: 'labnex-token', variable: 'LABNEX_TOKEN')]) {
                    sh 'labnex auth login --token $LABNEX_TOKEN'
                    sh 'labnex run --project ${PROJECT_ID} --ai-optimize --detailed'
                }
            }
        }
    }
}
```

### Docker Integration
```dockerfile
FROM node:18-alpine
RUN npm install -g @labnex/cli
COPY . .
RUN labnex run --project $PROJECT_ID --ai-optimize --detailed
```

## ⚡ Performance & Optimization

### Parallel Execution
```bash
# Optimize for speed with more workers
labnex run --project MYAPP --parallel 8

# Balance speed and resource usage
labnex run --project MYAPP --parallel 4
```

### AI Optimization
```bash
# Let AI optimize test selection and order
labnex run --project MYAPP --ai-optimize

# Get optimization recommendations
labnex analyze optimization --project MYAPP
```

### Resource Management
```bash
# Monitor resource usage
labnex status --resources

# Set custom timeouts
labnex run --project MYAPP --timeout 600000

# Memory-optimized execution
labnex run --project MYAPP --memory-limit 2GB
```

## 🔍 Troubleshooting

### Common Issues

**Installation Problems:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall globally
npm uninstall -g @labnex/cli
npm install -g @labnex/cli
```

**Authentication Issues:**
```bash
# Check authentication status
labnex auth status

# Re-authenticate
labnex auth logout
labnex auth login
```

**Network Problems:**
```bash
# Test API connectivity
labnex health

# Check with custom API URL
labnex health --api-url https://api.labnex.dev
```

**Performance Issues:**
```bash
# Use fewer parallel workers
labnex run --project MYAPP --parallel 2

# Increase timeout
labnex run --project MYAPP --timeout 900000
```

### Debug Mode
```bash
# Enable verbose logging
labnex run --project MYAPP --verbose

# Debug with detailed output
labnex run --project MYAPP --debug --detailed
```

## 📞 Support

- **Documentation**: Full API reference and guides
- **GitHub**: Report issues and feature requests
- **Discord**: Community support and discussions
- **Email**: Direct technical support

---

**Ready to supercharge your testing workflow?** Start with `labnex run --project <your-project> --ai-optimize --detailed` and experience the future of test automation! 🚀 