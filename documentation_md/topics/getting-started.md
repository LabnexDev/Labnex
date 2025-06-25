# Getting Started with Labnex 🚀

Welcome to Labnex! This comprehensive guide will help you get up and running with our AI-powered testing automation platform. Whether you're a developer, tester, or team lead, Labnex will revolutionize your testing workflow.

## 🎯 What You'll Learn

By the end of this guide, you'll be able to:
- Set up your Labnex account and create projects
- Create and execute test cases using AI
- Use the powerful CLI for advanced testing workflows
- Integrate Discord for team collaboration
- Experience AI Voice Mode for hands-free interaction
- Navigate with interactive onboarding tutorials
- Monitor and analyze test results with performance insights
- Leverage mobile optimizations for on-the-go testing

## 📋 Prerequisites

Before getting started, ensure you have:
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ (for CLI usage)
- A Discord account (optional, for bot integration)
- Microphone access (for AI Voice Mode)
- Basic understanding of web testing concepts

## 🚀 Step 1: Account Setup

### Create Your Account

1. **Visit Labnex Platform**
   - Go to [https://labnexdev.github.io/Labnex](https://labnexdev.github.io/Labnex)
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

### First Login & Onboarding

After verification, log in to access your dashboard where you'll see:
- **Projects Overview**: Your projects and their status
- **Recent Activity**: Latest test runs and updates
- **Quick Actions**: Create projects, test cases, and more
- **Team Activity**: Collaboration updates (if in a team)
- **Interactive Tutorials**: Get guided tours of key features (AI Chat, Voice Mode)
- **Welcome Tour**: First-time user experience with step-by-step guidance

### Interactive Onboarding Tutorials

Labnex offers guided tutorials for key features:

**AI Chat Tutorial** (8 steps):
- Chat input and formatting
- Voice command integration
- Session management
- Quick actions toolbar
- Keyboard shortcuts
- AI capabilities overview
- Context awareness
- Best practices

**AI Voice Mode Tutorial** (9 steps):
- Voice orb introduction
- Smart listening features
- Mobile gesture controls
- Audio visualization
- Activity timeline
- Voice command examples
- Best practices
- Troubleshooting tips

**How to Access Tutorials**:
- **Auto-launch**: First-time users see tutorials automatically
- **Manual access**: Click "Help" or "?" buttons in respective interfaces
- **Skip option**: Can be skipped and re-accessed later
- **Progress tracking**: System remembers your tutorial completion status

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

# First-time setup wizard
labnex --help  # Triggers setup on first run

# Generate test case
labnex ai generate --description "User can log in with valid email and password"

# Generate for specific project
labnex ai generate --description "Shopping cart checkout process" --project WEBAPP
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
🚀 Labnex CLI v1.3.0
────────────────────────────────────────
📝 Project: WEBAPP (Web Application)
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
🎉 Test Run Completed Successfully!
```

## 🎤 Step 5: Experience AI Voice Mode

### Accessing Voice Mode

1. **From AI Chat**:
   - Navigate to AI Chat page
   - Click **"Voice Mode"** button
   - Or click the microphone icon

2. **Direct Access**:
   - Go to `/ai/voice` in the application
   - Bookmark for quick access

### First-Time Voice Setup

1. **Microphone Permissions**:
   - Grant browser microphone access
   - Test audio input quality
   - Adjust sensitivity if needed

2. **Interactive Tutorial**:
   - 9-step guided tutorial
   - Learn voice orb controls
   - Practice basic commands
   - Understand visual feedback

3. **Try Basic Commands**:
   ```
   "Hello, what can you help me with?"
   "What's my project status?"
   "Show me recent test results"
   "Create a test case for user authentication"
   ```

### Voice Mode Features

**The Voice Orb**:
- **Gray**: Ready to listen
- **Green Pulsing**: Actively listening
- **Purple Spinning**: AI processing
- **Blue Animated**: AI responding

**Smart Listening**:
- Automatic voice detection
- Background monitoring
- Natural conversation flow
- Adjustable sensitivity

**Mobile Gestures**:
- Single tap: Start/stop listening
- Swipe up: Show activity timeline
- Swipe down: Hide controls
- Long press: Access settings

## 🔗 Step 6: Discord Integration

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
/help
/ping
/linkaccount

# Project management
/projects
/createtask project:WEBAPP title:"Fix login bug" priority:High

# Notes and snippets
/addnote title:"Meeting Notes" body:"Discussed testing strategy"
/addsnippet language:javascript title:"API Helper" code:"fetch('/api/data')"

# Support system
/ticket create
/ticket close reason:"Issue resolved"
```

## 📱 Step 7: Mobile Optimization

### Mobile Features

**Responsive Design**:
- Optimized layouts for all screen sizes
- Touch-friendly interface elements
- Safe area support for notched devices
- Swipe gestures for navigation

**Voice Mode on Mobile**:
- Battery-efficient operation (30fps)
- Touch gestures for voice control
- Mobile-specific tutorials
- Offline status indicators

**Performance Optimizations**:
- Reduced animations for battery life
- Optimized touch targets (44px minimum)
- Faster loading with progressive enhancement
- Background processing optimizations

### Mobile Best Practices

**Voice Interaction**:
- Use headphones to avoid feedback
- Speak clearly in quiet environments
- Take advantage of gesture controls
- Monitor battery usage

**Touch Navigation**:
- Use swipe gestures efficiently
- Leverage long-press actions
- Utilize pull-to-refresh patterns
- Access quick actions via buttons

## 🧠 Step 8: Advanced AI Features

### AI Chat Enhancements

**Session Management**:
- Create topic-specific chat sessions
- Maintain context across conversations
- Share sessions with team members
- Export conversation history

**Advanced Commands**:
```
"Analyze my project's test coverage"
"Suggest optimizations for failed tests"
"Generate a comprehensive test suite for the checkout process"
"Create a performance testing strategy"
```

**Context Awareness**:
- Remembers your current project
- References previous conversations
- Adapts to your workflow patterns
- Provides personalized recommendations

### Enhanced CLI Features

**New Commands**:
```bash
# Test linting and auto-fixing
labnex lint-tests ./tests --fix

# Import test cases from files
labnex create-test-case --project WEBAPP --file tests/login.txt

# Shell completion setup
labnex completion bash >> ~/.bashrc

# Configuration management
labnex config show
labnex config set defaultProject WEBAPP
```

**Improved Workflow**:
- Welcome wizard for first-time setup
- Project-specific configuration files
- Enhanced error reporting
- Interactive project selection

## 🔧 Step 9: Troubleshooting & Support

### Common Issues

**Audio/Voice Mode**:
```
Issue: Microphone not working
Solution: Check browser permissions, test hardware

Issue: Poor voice recognition
Solution: Speak clearly, reduce background noise

Issue: AI not responding
Solution: Check internet connection, try simpler commands
```

**CLI Problems**:
```
Issue: Authentication failed
Solution: Run `labnex auth login` to re-authenticate

Issue: Command not found
Solution: Ensure global installation with `npm install -g @labnex/cli`

Issue: Project not found
Solution: Verify project ID or use `labnex projects` to list available
```

### Getting Help

**In-App Support**:
- Voice command: "Help me with this issue"
- Chat command: "How do I troubleshoot voice mode?"
- Discord: Use `/ticket create` for support

**Community Resources**:
- Discord community server
- GitHub issues and discussions
- Documentation feedback system
- Video tutorials and guides

### Best Practices

**Security**:
- Use API keys for CLI automation
- Enable two-factor authentication
- Regularly review team permissions
- Keep your browser and CLI updated

**Performance**:
- Use detailed logging for debugging
- Enable AI optimization for better results
- Monitor resource usage on mobile
- Clear browser cache periodically

**Collaboration**:
- Set up proper project roles
- Use Discord for team communication
- Share voice session insights
- Document testing strategies

## 🎯 Next Steps

### Immediate Actions

1. **Complete Setup**:
   - Create your first project
   - Run the AI Chat tutorial
   - Try Voice Mode with basic commands
   - Install and configure the CLI

2. **Explore Features**:
   - Generate test cases with AI
   - Set up Discord integration
   - Experiment with voice commands
   - Configure mobile optimizations

3. **Team Integration**:
   - Invite team members to projects
   - Set up proper permissions
   - Configure notification preferences
   - Establish testing workflows

### Long-term Goals

**Workflow Optimization**:
- Develop consistent testing patterns
- Integrate with CI/CD pipelines
- Establish quality metrics
- Create automated reporting

**Advanced Usage**:
- Master voice commands for efficiency
- Build custom CLI workflows
- Leverage AI insights for optimization
- Scale testing across multiple projects

---

## 📚 Related Documentation

- **[AI Voice Mode](./ai-voice-mode.md)** - Complete voice interaction guide
- **[CLI Usage](./cli-usage.md)** - Advanced command-line features
- **[Discord Bot Commands](./bot-commands.md)** - Complete Discord integration
- **[API Reference](./api-reference.md)** - Developer API documentation
- **[Project Management](./project-management.md)** - Advanced project features

---

**🚀 Ready to revolutionize your testing workflow?** Start with creating your first project and experience the power of AI-enhanced testing automation with voice interaction capabilities! 🎉 