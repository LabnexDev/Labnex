import React from 'react';
import OnboardingTutorial from './OnboardingTutorial';
import type { TutorialStep } from './OnboardingTutorial';
import { MicrophoneIcon, SpeakerWaveIcon, EyeIcon, HandRaisedIcon } from '@heroicons/react/24/solid';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface AIVoiceTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const AIVoiceTutorial: React.FC<AIVoiceTutorialProps> = ({ onComplete, onSkip }) => {
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome-voice',
      title: 'Welcome to AI Voice Mode',
      description: 'Experience hands-free interaction with Labnex AI. Perfect for when you\'re coding, testing, or need to multitask.',
      icon: MicrophoneIcon,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <SpeakerWaveIcon className="h-4 w-4" />
            <span>Voice recognition + AI responses in one seamless experience</span>
          </div>
          <div className="text-xs text-slate-400">
            💡 Make sure your microphone is enabled and you're in a quiet environment
          </div>
        </div>
      )
    },
    {
      id: 'voice-orb',
      title: 'The Voice Orb',
      description: 'Your central control for voice interaction. Tap to start speaking, and watch it respond to your voice.',
      targetElement: '[role="button"][tabIndex="0"], .voice-orb, [aria-label*="voice"]',
      icon: HandRaisedIcon,
      content: (
        <div className="space-y-3">
          <div className="text-sm text-emerald-300">
            <strong>Orb States:</strong>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-slate-300">Idle - Ready to listen</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-300">Listening - Speak now</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-spin"></div>
              <span className="text-slate-300">Processing - AI thinking</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="text-slate-300">Speaking - AI responding</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'smart-listening',
      title: 'Smart Listening Mode',
      description: 'Enable automatic voice detection. The AI will start listening when it detects your voice activity.',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-blue-300">
            <strong>How Smart Listening Works:</strong>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>Automatically detects when you start speaking</li>
            <li>Begins listening without manual activation</li>
            <li>Stops when you pause or finish speaking</li>
            <li>Reduces need for constant tapping</li>
          </ul>
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded text-xs text-yellow-300">
            ⚠️ Works best in quiet environments with clear speech
          </div>
        </div>
      )
    },
    {
      id: 'mobile-gestures',
      title: 'Mobile Gestures',
      description: 'On mobile, use intuitive gestures to control the voice interface efficiently.',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-orange-300">
            <strong>Touch Gestures:</strong>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded">
              <HandRaisedIcon className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-slate-200">Single Tap</div>
                <div className="text-slate-400">Start/stop voice recognition</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded">
              <ArrowUpIcon className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-slate-200">Swipe Up</div>
                <div className="text-slate-400">Show activity timeline</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded">
              <ArrowDownIcon className="h-4 w-4 text-purple-400" />
              <div>
                <div className="text-slate-200">Swipe Down</div>
                <div className="text-slate-400">Hide mobile controls</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-waveform',
      title: 'Audio Visualization',
      description: 'Watch the waveform respond to your voice and AI responses. It helps you understand when the system is active.',
      targetElement: 'canvas, .waveform, [data-testid="audio-waveform"]',
      icon: EyeIcon,
      content: (
        <div className="space-y-3">
          <div className="text-sm text-cyan-300">
            <strong>Waveform Indicators:</strong>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded">
              <div className="text-green-300 font-medium">Green Waves</div>
              <div className="text-slate-400">Your voice input being detected</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded">
              <div className="text-purple-300 font-medium">Purple Waves</div>
              <div className="text-slate-400">AI generating and speaking response</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded">
              <div className="text-slate-400 font-medium">Flat Line</div>
              <div className="text-slate-400">No audio activity detected</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-timeline',
      title: 'Activity Timeline',
      description: 'Track the conversation flow and see what the AI is doing in real-time.',
      targetElement: '.timeline, [data-testid="voice-timeline"]',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-indigo-300">
            <strong>Timeline Features:</strong>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>Real-time status updates</li>
            <li>Conversation history</li>
            <li>Processing time tracking</li>
            <li>Error and success indicators</li>
          </ul>
          <div className="text-xs text-slate-400">
            💡 On mobile, swipe up to reveal the timeline panel
          </div>
        </div>
      )
    },
    {
      id: 'voice-best-practices',
      title: 'Voice Best Practices',
      description: 'Tips for optimal voice interaction with Labnex AI.',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-yellow-300">
            <strong>For Best Results:</strong>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
              <div className="font-medium text-green-300 mb-1">✅ Do This:</div>
              <ul className="space-y-1 list-disc list-inside text-slate-300">
                <li>Speak clearly and at normal pace</li>
                <li>Use specific, actionable requests</li>
                <li>Wait for AI response before speaking again</li>
                <li>Use quiet environment when possible</li>
              </ul>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded">
              <div className="font-medium text-red-300 mb-1">❌ Avoid:</div>
              <ul className="space-y-1 list-disc list-inside text-slate-300">
                <li>Speaking too fast or mumbling</li>
                <li>Background noise and interruptions</li>
                <li>Very long sentences without pauses</li>
                <li>Multiple questions in one breath</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-commands',
      title: 'Voice Command Examples',
      description: 'Try these example commands to get started with voice interaction.',
      content: (
        <div className="space-y-3">
          <div className="text-sm text-emerald-300">
            <strong>Try saying:</strong>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded border-l-2 border-blue-500">
              <div className="text-blue-300">"What's my project status?"</div>
              <div className="text-slate-400">Get current project overview</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border-l-2 border-purple-500">
              <div className="text-purple-300">"Create a test case for user login"</div>
              <div className="text-slate-400">Generate new test case</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border-l-2 border-green-500">
              <div className="text-green-300">"Show me recent test failures"</div>
              <div className="text-slate-400">Analyze test run results</div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border-l-2 border-orange-500">
              <div className="text-orange-300">"Help me debug this issue"</div>
              <div className="text-slate-400">Get debugging assistance</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice-completion',
      title: 'Ready for Voice Mode!',
      description: 'You\'re now ready to use AI Voice Mode effectively. Start speaking naturally and let AI assist your workflow!',
      icon: MicrophoneIcon,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg border border-emerald-500/30">
              <MicrophoneIcon className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Voice Mode Activated!</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 text-center">
            💡 Pro tip: Start with simple commands like "Hello" or "What can you help me with?" to test your setup.
          </div>

          <div className="text-center space-y-2">
            <div className="text-sm text-slate-300">Keyboard shortcuts:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">Space - Toggle listening</span>
              <span className="px-2 py-1 bg-slate-800 rounded text-xs">Escape - Stop/Close</span>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Start using Voice Mode!',
        onClick: () => {
          // Auto-start listening after tutorial if possible
          setTimeout(() => {
            const voiceButton = document.querySelector('[role="button"][tabIndex="0"], .voice-orb') as HTMLElement;
            if (voiceButton) {
              voiceButton.focus();
            }
          }, 500);
        }
      }
    }
  ];

  // Handle tutorial completion
  const handleComplete = () => {
    localStorage.setItem('labnex_ai_voice_tutorial_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('labnex_ai_voice_tutorial_completed', 'true');
    onSkip();
  };

  return (
    <OnboardingTutorial
      title="AI Voice Mode Tutorial"
      steps={tutorialSteps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showProgress={true}
      allowSkip={true}
      className="z-[10000]"
    />
  );
};

export default AIVoiceTutorial; 