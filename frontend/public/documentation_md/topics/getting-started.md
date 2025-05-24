# Getting Started with Labnex 🚀

Welcome to Labnex! This comprehensive guide will help you get up and running with our AI-powered testing automation platform. Whether you're a developer, tester, or team lead, Labnex will revolutionize your testing workflow.

## 🎯 What You'll Learn

By the end of this guide, you'll be able to:
- Set up your Labnex account and create projects
- Create and execute test cases using AI
- Use the powerful CLI for advanced testing workflows
- Integrate Discord for team collaboration
- Monitor and analyze test results with performance insights

## 📋 Prerequisites

Before getting started, ensure you have:
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ (for CLI usage)
- A Discord account (optional, for bot integration)
- Basic understanding of web testing concepts

## 🚀 Step 1: Account Setup

### Create Your Account

1. **Visit Labnex Platform**
   - Go to [https://labnex.dev](https://labnex.dev)
   - Click **"Sign Up"** in the top right corner

2. **Registration Details**
   ```
   Full Name: Your professional name
   Email: your.email@company.com
   Password: Strong password (8+ characters)
   ```

3. **Email Verification**
   - Check your email for verification link
   - Click the link to activate your account
   - Complete your profile setup

4. **Profile Completion**
   - Add your company/organization
   - Select your role (Developer, Tester, Manager, etc.)
   - Set notification preferences

### First Login

After verification, log in to access your dashboard where you'll see:
- **Projects Overview**: Your projects and their status
- **Recent Activity**: Latest test runs and updates
- **Quick Actions**: Create projects, test cases, and more
- **Team Activity**: Collaboration updates (if in a team)

## 🏗️ Step 2: Create Your First Project

### Project Creation

1. **Navigate to Projects**
   - Click **"Projects"** in the sidebar
   - Click **"Create New Project"**

2. **Project Configuration**
   ```
   Project Name: My Web Application
   Description: E-commerce platform testing
   Project Code: WEBAPP (auto-generated)
   Default Environment: staging
   ```

3. **Advanced Settings**
   - **Test Environment URLs**: Configure staging, production URLs
   - **Team Access**: Invite team members (if applicable)
   - **Notification Settings**: Configure alert preferences
   - **Integration Options**: Set up CI/CD connections

### Project Dashboard

Your project dashboard provides:
- **Test Cases**: All test cases for this project
- **Test Runs**: Execution history and results
- **Performance Metrics**: Speed and reliability trends
- **Team Activity**: Collaboration and changes
- **AI Insights**: Automated recommendations

## 📝 Step 3: Create Test Cases

### Method 1: Manual Creation

1. **Navigate to Test Cases**
   - Go to your project
   - Click **"Test Cases"** tab
   - Click **"Create Test Case"**

2. **Test Case Details**
   ```
   Title: User Login Validation
   Description: Verify users can log in with valid credentials
   Priority: High
   Category: Authentication
   Environment: All
   ```

3. **Test Steps**
   ```
   Step 1: Navigate to login page (/login)
   Step 2: Enter valid email (test@example.com)
   Step 3: Enter valid password (SecurePass123)
   Step 4: Click "Login" button
   Step 5: Verify redirect to dashboard
   Step 6: Verify user profile is displayed
   ```

4. **Expected Results**
   ```
   - User is successfully authenticated
   - Redirected to dashboard page
   - User profile information is visible
   - No error messages displayed
   ```

### Method 2: AI-Powered Generation

1. **Use AI Generator**
   - Click **"Generate with AI"** button
   - Enter natural language description

2. **AI Prompt Examples**
   ```
   "Create a test for user registration with email validation"
   "Test shopping cart functionality including add, remove, and checkout"
   "Verify password reset flow with email confirmation"
   ```

3. **Review and Refine**
   - AI generates comprehensive test steps
   - Review generated content
   - Modify as needed
   - Save the test case

### Method 3: CLI Generation

```bash
# Install CLI first
npm install -g @labnex/cli

# Generate test case
labnex generate test "User can log in with valid email and password"

# Generate for specific project
labnex generate test "Shopping cart checkout process" --project WEBAPP
```

## 🏃‍♂️ Step 4: Execute Your First Test

### Web Interface Execution

1. **Single Test Execution**
   - Open your test case
   - Click **"Run Test"** button
   - Monitor real-time execution
   - View detailed results

2. **Test Suite Execution**
   - Go to **"Test Runs"** tab
   - Click **"New Test Run"**
   - Select test cases to include
   - Configure execution settings:
     ```
     Environment: staging
     Parallel Workers: 4
     AI Optimization: enabled
     Browser: Chrome (headless)
     ```
   - Start the test run

### CLI Execution (Recommended)

The CLI provides the most powerful testing experience:

```bash
# Basic test execution
labnex run --project WEBAPP

# Enhanced execution with AI and detailed logging
labnex run --project WEBAPP --ai-optimize --detailed

# Production environment testing
labnex run --project WEBAPP --env production --parallel 8

# Continuous testing
labnex run --project WEBAPP --watch --detailed
```

### Enhanced CLI Output

With `--detailed` flag, you'll see comprehensive real-time logging:

```bash
🚀 Initializing test run...
📝 Project: WEBAPP
🌍 Environment: staging
⚡ Parallel workers: 4
🖱 AI Optimization: enabled
🔍 Detailed logging: enabled

🧠 AI Analysis Phase:
   • Analyzing test suite and optimizing execution order
   • Code changes detected: Reviewing project files
   • Estimated completion time: 2-3 minutes

🧪 Starting: User Login Validation
🔗 [1.2s] Navigating to login page: https://staging.webapp.com/login
   • Page load time: 445ms
   • HTTP response: 200
🖱️ [1.8s] Clicking email input field
   • Element: #email-input
   • Execution time: 32ms
⌨️ [2.1s] Typing email address
   • Value: "test@example.com"
✅ PASSED User Login Validation (3,456ms)

📊 Progress: 5/5 ████████████████████ 100%
🎉 Test Run Completed!
```

## 🔗 Step 5: Discord Integration

### Setup Discord Bot

1. **Connect Discord Account**
   - Go to **Settings** → **Integrations**
   - Click **"Connect Discord"**
   - Authorize the Labnex bot

2. **Invite Bot to Server**
   - Use the provided invite link
   - Grant necessary permissions:
     - Read Messages
     - Send Messages
     - Use Slash Commands
   - Bot appears in your server

### Discord Commands

```bash
# Basic commands
@Labnex AI help
@Labnex AI status

# Project management
@Labnex AI create project "Mobile App Testing"
@Labnex AI status of project WEBAPP

# Test case creation
@Labnex AI generate test case for "user profile editing"

# Test execution
@Labnex AI run tests for project WEBAPP

# Notes and snippets
@Labnex AI create note "Fix login button styling" for project WEBAPP
```

## 📊 Step 6: Understanding Results

### Test Run Dashboard

After execution, analyze results through:

**Overview Metrics:**
- Total tests executed
- Pass/fail ratio
- Execution duration
- Success rate percentage

**Performance Analytics:**
- Average page load times
- Action execution speeds
- Network request performance
- Memory usage patterns

**Failure Analysis:**
- AI-powered root cause analysis
- Suggested fixes and improvements
- Pattern recognition in failures
- Performance bottleneck identification

### Detailed Reports

Each test run provides:
- **Step-by-step execution logs**
- **Screenshots at key points**
- **Performance metrics for each action**
- **Network traffic analysis**
- **Console error logs**
- **AI-generated insights and recommendations**

## 🎯 Best Practices

### Test Case Design

1. **Atomic Tests**: Each test should verify one specific functionality
2. **Clear Naming**: Use descriptive, consistent naming conventions
3. **Independent Tests**: Tests shouldn't depend on each other
4. **Data Management**: Use test data that's independent and reusable

### Execution Strategy

1. **Environment Progression**: Test in staging before production
2. **Parallel Execution**: Use multiple workers for faster execution
3. **AI Optimization**: Enable AI for smarter test selection
4. **Continuous Monitoring**: Set up automated test runs

### Team Collaboration

1. **Role-based Access**: Assign appropriate permissions
2. **Code Review**: Implement peer review for test cases
3. **Documentation**: Keep test cases well-documented
4. **Communication**: Use Discord for real-time updates

## 🚀 Advanced Features

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Labnex Tests
  run: |
    npm install -g @labnex/cli
    labnex auth login --token ${{ secrets.LABNEX_TOKEN }}
    labnex run --project WEBAPP --ai-optimize --detailed
```

### Performance Monitoring

```bash
# Monitor performance trends
labnex analyze performance --project WEBAPP

# Get optimization suggestions
labnex analyze optimization --project WEBAPP
```

### Custom Configuration

Create `.labnexrc` in your project:
```json
{
  "defaultProject": "WEBAPP",
  "defaultEnvironment": "staging",
  "parallelWorkers": 4,
  "detailed": true,
  "aiOptimization": true
}
```

## 📚 Next Steps

Now that you're set up with Labnex:

1. **Explore Advanced Features**
   - [Test Case Management](./test-case-management.md)
   - [CLI Usage](./cli-usage.md)
   - [Discord Bot Commands](./bot-commands.md)

2. **Learn AI Features**
   - AI-powered test generation
   - Automated failure analysis
   - Performance optimization

3. **Team Collaboration**
   - [Project Management](./project-management.md)
   - [Task Management](./task-management.md)
   - Team workflows and permissions

4. **Integration & Automation**
   - CI/CD pipeline integration
   - Automated test scheduling
   - Performance monitoring

## 🆘 Getting Help

### Community Support
- **Discord Community**: Join our active community
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: Comprehensive guides and references

### Technical Support
- **Email**: support@labnex.dev
- **Live Chat**: Available in the platform
- **Knowledge Base**: Searchable help articles

### Premium Support
- **Priority Support**: Faster response times
- **Dedicated Success Manager**: Personal assistance
- **Custom Training**: Team onboarding sessions

---

**🎉 Congratulations!** You're now ready to harness the full power of AI-enhanced testing automation with Labnex. Start creating amazing test suites and let AI optimize your testing workflow!

**Ready to dive deeper?** Continue with [Test Case Management](./test-case-management.md) or explore our [CLI Usage Guide](./cli-usage.md). 