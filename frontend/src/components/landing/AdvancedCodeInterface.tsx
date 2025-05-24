import React, { useState } from 'react';
import SectionWrapper from './SectionWrapper';

interface CodeTab {
  id: string;
  label: string;
  language: string;
  content: string;
  summary: string;
  description: string;
}

const AdvancedCodeInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cli');
  const [showFullContent, setShowFullContent] = useState(false);

  const tabs: CodeTab[] = [
    {
      id: 'cli',
      label: 'CLI Commands',
      language: 'bash',
      description: 'Install and use our CLI tool for automated testing',
      summary: `# Quick CLI Overview
$ npm install -g @labnex/cli
$ labnex auth login
$ labnex projects create --name "My App" --code MYAPP
$ labnex test run --project MYAPP --ai

✓ Authenticated successfully
✓ Project created: MYAPP  
🚀 Running 5 tests with AI optimization
✅ All tests passed in 1.8s`,
      content: `# Install Labnex CLI
$ npm install -g @labnex/cli

# Authenticate with Labnex
$ labnex auth login
Email: developer@company.com
✓ Successfully authenticated with Labnex
✓ Configuration saved to ~/.labnex/config.json

# Create a new project
$ labnex projects create --name "My Application" --code MYAPP
✓ Project created successfully
✓ Project code: MYAPP
✓ Ready for test cases

# List your projects
$ labnex projects list
┌─────────────┬──────────────────────┬────────────┬─────────────┐
│ Project     │ Name                 │ Tests      │ Status      │
├─────────────┼──────────────────────┼────────────┼─────────────┤
│ MYAPP       │ My Application       │ 5 tests    │ ✅ Active  │
│ DEMO        │ Demo Project         │ 3 tests    │ ✅ Active  │
└─────────────┴──────────────────────┴────────────┴─────────────┘

# Run tests with AI optimization
$ labnex test run --project MYAPP --ai --parallel 2

🚀 Labnex CLI v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Project: MYAPP (My Application)
✓ AI optimization enabled
✓ Parallel execution: 2 workers
✓ Environment: staging

🧠 AI Analysis:
   • 5 test cases found
   • Prioritizing critical path tests
   • Estimated time: 2 minutes

🏃 Executing tests...
Login Tests             ████████████████████ 100% (2/2)   ✅ 0.6s
Form Validation         ████████████████████ 100% (3/3)   ✅ 1.2s

📊 Results Summary:
   • Passed: 5/5 tests ✅
   • Duration: 1.8 seconds
   • Success Rate: 100%

🔗 View results: https://app.labnex.io/projects/MYAPP/runs/abc123`
    },
    {
      id: 'ai-generate',
      label: 'AI Test Generation',
      language: 'bash',
      description: 'Generate test cases with AI assistance',
      summary: `# AI Test Generation
$ labnex ai generate --description "Test user login form"

📝 Generated: User Login Form Test
✓ 4 test steps created
✓ 3 validation cases added
✓ Saved as TC-MYAPP-001`,
      content: `# Generate test case with AI
$ labnex ai generate --description "Test user login form validation"

🧠 AI Test Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Analyzing requirements...
✓ Generating test steps...
✓ Creating assertions...
✓ Adding edge cases...

📝 Generated Test Case:

Title: User Login Form Validation
Priority: HIGH
Category: Authentication

Test Steps:
1. Navigate to login page (/login)
2. Verify form fields are present
3. Enter valid credentials:
   - Email: user@example.com
   - Password: ValidPass123!
4. Click "Login" button
5. Verify successful login redirect

Validation Tests:
• Empty email field → "Email is required"
• Invalid email format → "Enter valid email"
• Empty password → "Password is required"
• Invalid credentials → "Invalid login"

Expected Results:
✓ User successfully logged in
✓ Redirected to dashboard
✓ All validation errors handled

# Save to project
$ labnex ai generate --project MYAPP --save
✓ Test case saved to project MYAPP
✓ Test ID: TC-MYAPP-001`
    },
    {
      id: 'analysis',
      label: 'Failure Analysis',
      language: 'bash',
      description: 'AI-powered test failure analysis and suggestions',
      summary: `# AI Failure Analysis  
$ labnex ai analyze run123 failure456

❌ Test: "Login Form" FAILED
🧠 AI Analysis: Button selector changed (85% confidence)
💡 Suggested fix: Update to [data-testid="login-btn"]
✨ Confidence Score: 85%`,
      content: `# Analyze test failure with AI
$ labnex ai analyze run123 failure456

🔍 AI Failure Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test: "Login Form Validation"
Status: ❌ FAILED
Duration: 3.2s
Environment: staging

📋 Failure Details:
   Step 4: "Click login button"
   Error: Element not found: #login-button
   Screenshot: Available in test results

🧠 AI Analysis:
   • Button selector likely changed (85% confidence)
   • Common pattern in recent updates
   • Similar failure in 1 other test

💡 Suggested Solutions:
1. Update selector to: [data-testid="login-btn"]
2. Add wait condition for form loading
3. Check if button is disabled initially

🔄 Related Issues:
   • TC-MYAPP-002: Similar selector issue

📊 Pattern Analysis:
   • 60% of failures due to selector changes
   • 30% due to timing issues
   • 10% due to test data problems

🛠️ Quick Fix Available:
   Run: labnex ai fix --test-id TC-MYAPP-001 --apply
   
✨ Confidence Score: 85%`
    },
    {
      id: 'config',
      label: 'Test Configuration',
      language: 'yaml',
      description: 'Project configuration for test automation',
      summary: `# labnex.yml Configuration
name: "My Application Tests"
project_code: "MYAPP"

ai_optimization:
  enabled: true
  smart_selection: true
  
environments:
  staging:
    parallel_workers: 2
  production:
    parallel_workers: 4`,
      content: `# labnex.yml - Project Configuration
name: "My Application Tests"
version: "1.0.0"
project_code: "MYAPP"

# AI-Powered Features
ai_optimization:
  enabled: true
  smart_selection: true
  failure_prediction: true
  auto_healing: false

# Environment Configuration
environments:
  staging:
    url: "https://staging.myapp.com"
    parallel_workers: 2
    timeout: 30000
    
  production:
    url: "https://myapp.com"
    parallel_workers: 4
    timeout: 45000
    smoke_tests_only: true

# Test Suite Organization
test_suites:
  authentication:
    priority: critical
    tests: ["login", "register", "password_reset"]
    dependencies: ["database"]
    
  forms:
    priority: high
    tests: ["contact_form", "feedback", "validation"]
    dependencies: ["frontend"]

# Real-time Monitoring
monitoring:
  websocket_updates: true
  live_screenshots: true
  performance_tracking: true

# Integrations
notifications:
  slack:
    webhook: \${SLACK_WEBHOOK_URL}
    channels: ["#dev-team"]
    on_failure: true
    
  email:
    recipients: ["team@myapp.com"]
    on_critical_failure: true

# Reporting
reporting:
  formats: ["html", "json"]
  include_screenshots: true
  include_logs: true
  retention_days: 30

# CI/CD Integration
ci_integration:
  github_actions: true
  gitlab_ci: true`
    },
    {
      id: 'sdk',
      label: 'SDK Integration',
      language: 'javascript',
      description: 'Programmatic integration with your codebase',
      summary: `// Labnex SDK Integration
import { LabnexClient } from '@labnex/cli';

const client = new LabnexClient({
  apiKey: process.env.LABNEX_API_KEY,
  projectCode: 'MYAPP'
});

// Run tests programmatically
const results = await client.test.run({
  suites: ['authentication', 'forms'],
  aiOptimization: true
});`,
      content: `import { LabnexClient } from '@labnex/cli';

// Initialize Labnex client
const labnex = new LabnexClient({
  apiKey: process.env.LABNEX_API_KEY,
  projectCode: 'MYAPP',
  environment: 'staging'
});

// Programmatic test execution
async function runAutomatedTests() {
  try {
    // Start AI-optimized test run
    const testRun = await labnex.test.run({
      projectCode: 'MYAPP',
      suites: ['authentication', 'forms'],
      aiOptimization: true,
      parallelWorkers: 2,
      environment: 'staging'
    });

    console.log(\`Test run started: \${testRun.id}\`);

    // Real-time progress monitoring
    testRun.on('progress', (data) => {
      console.log(\`Progress: \${data.completed}/\${data.total} tests\`);
    });

    testRun.on('test_completed', (result) => {
      if (result.status === 'failed') {
        console.error(\`❌ \${result.name}: \${result.error}\`);
      } else {
        console.log(\`✅ \${result.name}: \${result.duration}ms\`);
      }
    });

    // Wait for completion
    const results = await testRun.waitForCompletion();
    
    return {
      success: results.stats.failed === 0,
      stats: results.stats,
      reportUrl: results.reportUrl,
      duration: results.duration
    };

  } catch (error) {
    console.error('Test execution failed:', error);
    throw error;
  }
}

// AI-powered test generation
async function generateTestWithAI() {
  const testCase = await labnex.ai.generateTest({
    description: "Test contact form submission",
    category: "forms",
    priority: "medium",
    projectCode: "MYAPP"
  });

  console.log('Generated test case:', testCase);
  
  // Save to project
  await labnex.testCases.create(testCase);
  
  return testCase;
}

// CI/CD Pipeline Integration
async function cicdIntegration() {
  const branch = process.env.GIT_BRANCH || 'main';
  const commit = process.env.GIT_COMMIT || 'latest';
  
  // Run tests with metadata
  const testRun = await labnex.test.run({
    projectCode: 'MYAPP',
    metadata: {
      branch,
      commit,
      buildNumber: process.env.BUILD_NUMBER
    },
    aiOptimization: {
      enabled: true,
      analyzeCodeChanges: true
    }
  });

  // Set exit code based on results
  const results = await testRun.waitForCompletion();
  process.exit(results.stats.failed > 0 ? 1 : 0);
}

// Export for use in CI/CD
module.exports = {
  runAutomatedTests,
  generateTestWithAI,
  cicdIntegration
};`
    }
  ];

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'json':
        return '{ }';
      case 'yaml':
        return '⚙️';
      case 'bash':
        return '$';
      case 'javascript':
        return 'JS';
      default:
        return '📄';
    }
  };

  const getSyntaxHighlightedCode = (code: string, language: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      let highlightedLine = line;
      
      if (language === 'json') {
        highlightedLine = line
          .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
          .replace(/:\s*"([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
          .replace(/:\s*(\d+)/g, ': <span class="text-orange-400">$1</span>')
          .replace(/(true|false|null)/g, '<span class="text-purple-400">$1</span>');
      } else if (language === 'yaml') {
        highlightedLine = line
          .replace(/^(\s*)([\w_]+):/g, '$1<span class="text-blue-400">$2</span>:')
          .replace(/:\s*([^#\n]+)/g, ': <span class="text-green-400">$1</span>')
          .replace(/#.*/g, '<span class="text-slate-500">$&</span>');
      } else if (language === 'bash') {
        highlightedLine = line
          .replace(/^\$\s/, '<span class="text-emerald-400">$ </span>')
          .replace(/✓/g, '<span class="text-green-400">✓</span>')
          .replace(/❌/g, '<span class="text-red-400">❌</span>')
          .replace(/✅/g, '<span class="text-green-400">✅</span>')
          .replace(/🚀|🔍|🏃|📊|📈|🔗/g, '<span class="text-yellow-400">$&</span>');
      } else if (language === 'javascript') {
        highlightedLine = line
          .replace(/(const|let|var|function|async|await|import|from|export)/g, '<span class="text-purple-400">$1</span>')
          .replace(/('.*?'|".*?")/g, '<span class="text-green-400">$1</span>')
          .replace(/\/\/.*$/g, '<span class="text-slate-500">$&</span>')
          .replace(/(\d+)/g, '<span class="text-orange-400">$1</span>');
      }
      
      return (
        <div key={index} className="flex">
          <span className="text-slate-500 text-right w-12 mr-4 select-none">
            {index + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
        </div>
      );
    });
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <SectionWrapper 
      badge="Developer Experience"
      title={
        <>
          Built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            developers
          </span>
        </>
      }
      subtitle="Experience the power of Labnex through our CLI automation tool, AI-powered test generation, and seamless CI/CD integration."
      backgroundType="split"
    >
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-t-2xl p-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{getLanguageIcon(tab.language)}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Code Display */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 border-t-0 rounded-b-2xl overflow-hidden">
          {/* Tab Description */}
          <div className="px-6 py-4 bg-white/5 border-b border-white/10">
            <p className="text-slate-300 text-sm">
              {currentTab?.description}
            </p>
          </div>

          {/* Code Content */}
          <div className="p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/15 rounded-lg text-slate-300 hover:text-white text-sm transition-colors duration-200"
              >
                {showFullContent ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Summary
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show Full Details
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-sm leading-relaxed">
              {currentTab && getSyntaxHighlightedCode(
                showFullContent ? currentTab.content : (currentTab.summary || currentTab.content),
                currentTab.language
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            {
              icon: '🚀',
              title: 'CLI Automation',
              description: 'Command-line interface for automated testing with AI optimization and parallel execution'
            },
            {
              icon: '🧠',
              title: 'AI Test Generation',
              description: 'Generate test cases with AI, analyze failures, and get intelligent suggestions'
            },
            {
              icon: '🔄',
              title: 'CI/CD Integration',
              description: 'Seamless integration with GitHub Actions, GitLab CI, and your existing workflows'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to automate your testing?
            </h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Install the Labnex CLI and start running AI-powered tests in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                Install CLI Tool
              </button>
              <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-slate-200 hover:bg-white/15 hover:text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]">
                View CLI Docs
              </button>
            </div>
            <div className="mt-6 p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
              <code className="text-slate-300 text-sm font-mono">
                npm install -g @labnex/cli && labnex auth login
              </code>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default AdvancedCodeInterface;