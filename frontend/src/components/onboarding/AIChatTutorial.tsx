import React, { useState } from 'react';
import OnboardingTutorial from './OnboardingTutorial';
import type { TutorialStep } from './OnboardingTutorial';
import { ChatBubbleLeftRightIcon, CommandLineIcon, SparklesIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { useAIChat } from '../../contexts/AIChatContext';

interface AIChatTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const AIChatTutorial: React.FC<AIChatTutorialProps> = ({ onComplete, onSkip }) => {
  const { sendMessage } = useAIChat();
  const [demoMessageSent, setDemoMessageSent] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Labnex AI Chat',
      description: 'Your intelligent assistant for project management, coding help, and test automation. Let\'s explore the key features together.',
      icon: ChatBubbleLeftRightIcon,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <SparklesIcon className="h-4 w-4" />
            <span>AI-powered assistance for your development workflow</span>
          </div>
          <div className="text-xs text-slate-400">
            💡 Tip: You can always access this tutorial from the help menu
          </div>
        </div>
      )
    },
    {
      id: 'input-area',
      title: 'Chat Input & Commands',
      description: 'Type your questions or use slash commands for specific actions. The AI understands natural language and project context.',
      targetElement: 'textarea[placeholder*="Ask"], textarea[placeholder*="Type"]',
      icon: CommandLineIcon,
      content: (
        <div className="space-y-3">
          <div className="text-sm text-green-300">
            <strong>Try these examples:</strong>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded font-mono">
              "Create a test case for user login"
            </div>
            <div className="bg-slate-900/50 p-2 rounded font-mono">
              "/help" - Show available commands
            </div>
            <div className="bg-slate-900/50 p-2 rounded font-mono">
              "Analyze my project's recent activity"
            </div>
          </div>
        </div>
      ),
      action: {
        label: demoMessageSent ? '✅ Message sent! Next →' : 'Try sending "Hello, AI!" now',
        onClick: async () => {
          if (demoMessageSent) return;
          
          try {
            await sendMessage('Hello, AI! I\'m learning how to use Labnex.');
            setDemoMessageSent(true);
          } catch (error) {
            console.error('Demo message failed:', error);
          }
        }
      }
    },
    {
      id: 'voice-controls',
      title: 'Voice Commands',
      description: 'Use voice input for hands-free interaction. Perfect for when you\'re coding or away from keyboard.',
      targetElement: '[title*="voice"], [title*="Voice"], button[aria-label*="voice"]',
      icon: MicrophoneIcon,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <MicrophoneIcon className="h-4 w-4" />
            <span>Click the microphone to start voice input</span>
          </div>
          <div className="text-xs text-slate-400">
            <strong>Voice Tips:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Speak clearly and naturally</li>
              <li>Use "Create test case for..." to generate tests</li>
              <li>Try "What's my project status?"</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'sessions',
      title: 'Chat Sessions',
      description: 'Organize conversations by topics or projects. Each session maintains context and history.',
      targetElement: '[data-testid="session-dropdown"], button[title*="session"]',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-blue-300">
            <strong>Session Benefits:</strong>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>Keep conversations organized</li>
            <li>Maintain context per project</li>
            <li>Access chat history anytime</li>
            <li>Share sessions with team members</li>
          </ul>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'Use the toolbar buttons for common tasks and enhanced functionality.',
      targetElement: '.md\\:flex.items-center.gap-2, [data-testid="quick-actions"]',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-indigo-300">
            <strong>Available Actions:</strong>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded">
              <div className="font-medium text-purple-300">📊 Summarize</div>
              <div className="text-slate-400">Project insights</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded">
              <div className="font-medium text-emerald-300">🎤 Voice Mode</div>
              <div className="text-slate-400">Hands-free chat</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-capabilities',
      title: 'AI Capabilities',
      description: 'Discover what Labnex AI can help you with in your development workflow.',
      content: (
        <div className="space-y-4">
          <div className="text-sm text-yellow-300 font-medium">
            🚀 What can I help you with?
          </div>
          <div className="grid gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-medium text-emerald-300">🧪 Testing</div>
              <div className="text-slate-300">Create test cases, analyze failures, optimize test suites</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-blue-300">💼 Project Management</div>
              <div className="text-slate-300">Track progress, manage tasks, team coordination</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-purple-300">💡 Code Help</div>
              <div className="text-slate-300">Debug issues, code review, best practices</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-indigo-300">📈 Analytics</div>
              <div className="text-slate-300">Performance insights, trend analysis, recommendations</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Master these shortcuts to boost your productivity with Labnex AI.',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-orange-300 font-medium">
            ⌨️ Essential Shortcuts
          </div>
          <div className="grid gap-2 text-xs font-mono">
            <div className="flex justify-between bg-slate-900/50 p-2 rounded">
              <span className="text-slate-300">Send message</span>
              <span className="text-yellow-300">Enter</span>
            </div>
            <div className="flex justify-between bg-slate-900/50 p-2 rounded">
              <span className="text-slate-300">New line</span>
              <span className="text-yellow-300">Shift + Enter</span>
            </div>
            <div className="flex justify-between bg-slate-900/50 p-2 rounded">
              <span className="text-slate-300">Voice mode</span>
              <span className="text-yellow-300">Ctrl + Shift + V</span>
            </div>
            <div className="flex justify-between bg-slate-900/50 p-2 rounded">
              <span className="text-slate-300">Escape</span>
              <span className="text-yellow-300">Close dialogs</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'completion',
      title: 'You\'re All Set!',
      description: 'You now know the basics of Labnex AI Chat. Start exploring and let AI supercharge your development workflow!',
      icon: SparklesIcon,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-lg border border-purple-500/30">
              <SparklesIcon className="h-5 w-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Ready to AI-power your workflow!</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 text-center">
            💡 Pro tip: Ask me "What should I work on today?" to get personalized recommendations based on your project activity.
          </div>

          <div className="text-center space-y-2">
            <div className="text-sm text-slate-300">Quick start suggestions:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">"Show project status"</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">"Create a test case"</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">"Help me debug"</span>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Start using Labnex AI!',
        onClick: () => {
          // Focus on the input area after tutorial
          setTimeout(() => {
            const input = document.querySelector('textarea[placeholder*="Ask"], textarea[placeholder*="Type"]') as HTMLTextAreaElement;
            if (input) {
              input.focus();
            }
          }, 500);
        }
      }
    }
  ];

  // Handle tutorial completion
  const handleComplete = () => {
    // Store completion in localStorage
    localStorage.setItem('labnex_ai_chat_tutorial_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    // Still mark as completed to not show again
    localStorage.setItem('labnex_ai_chat_tutorial_completed', 'true');
    onSkip();
  };

  return (
    <OnboardingTutorial
      title="AI Chat Tutorial"
      steps={tutorialSteps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showProgress={true}
      allowSkip={true}
      className="z-[10000]"
    />
  );
};

export default AIChatTutorial; 