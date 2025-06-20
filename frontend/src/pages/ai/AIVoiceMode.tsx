import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MicrophoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceInput, type VoiceState } from '../../hooks/useVoiceInput';
import { parseMultiCommand, type ParsedIntent } from '../../utils/parseNLUCommand';
import { executeCommandQueue, formatCommandResult, type CommandResult } from '../../utils/slashCommandHandler';
import { aiChatApi } from '../../api/aiChat';
import { type TimelineEvent, type TimelineEventState } from '../../components/ai-chat/VoiceStatusTimeline';
import AudioWaveform from '../../components/ai-chat/AudioWaveform';
import MobileVoiceGestures from '../../components/ai-chat/MobileVoiceGestures';
import { getMemory, clearInterrupted, setIsSpeaking } from '../../utils/voiceContext';
import './AIVoiceMode.css';
import { useAuth } from '../../contexts/AuthContext';


/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-use-before-define, no-use-before-define */
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type AIStatus = VoiceState | 'analyzing' | 'speaking' | 'paused' | 'waiting' | 'monitoring';

interface VoiceCommand {
  command: string;
  parameters: string[];
  isSlashCommand: boolean;
  confidence: number;
  originalText: string;
}

interface ActiveListeningConfig {
  enabled: boolean;
  sensitivity: number;
  wakeWords: string[];
  silenceThreshold: number;
  continuousMode: boolean;
}

interface DebugInfo {
  lastCommand?: ParsedIntent;
  lastResult?: CommandResult;
  commandHistory: Array<{ command: ParsedIntent; result: CommandResult; timestamp: Date }>;
}

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { speak: baseSpeakOpenAI, isSpeaking: isTTSSpeaking, stopSpeaking } = useOpenAITTS();
  const { user } = useAuth();

  const speakOpenAI = useCallback(async (text: string) => {
    lastSpokenRef.current = text;
    ttsStartRef.current = Date.now();
    await baseSpeakOpenAI(text);
  }, [baseSpeakOpenAI]);

  // Wrapper to prevent navigating to unknown paths that would blank the UI
  const safeNavigate = useCallback((dest: string | number) => {
    if (typeof dest === 'string') {
      // Basic whitelist – extend as needed
      const allowed = [
        '/', '/dashboard', '/projects', '/tasks', '/notes', '/ai',
        '/settings', '/login', '/register', '/contact', '/snippets'
      ];
      if (!allowed.includes(dest)) {
        toast.error('Unknown page');
        return;
      }
    }
    navigate(dest as any);
  }, [navigate]);

  // Keep voiceContext in sync with the TTS hook
  useEffect(() => {
    setIsSpeaking(isTTSSpeaking);
  }, [isTTSSpeaking]);

  // (Self-feedback prevention effect will be added later, after voice control functions are available)
   
  // State management
  const [status, setStatus] = useState<AIStatus>('idle');
  const [, setCurrentAction] = useState<string>('Starting voice mode...');
  const [isSmartListening] = useState(true);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isDebugMode] = useState(localStorage.getItem('devMode') === 'true');
  
  // Browser / permission support states (used in legacy UI blocks)
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Legacy helper states still referenced in VAD / wake-word logic
  const [, setTranscript] = useState('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Enhanced Active Listening State
  const [activeListening, setActiveListening] = useState<ActiveListeningConfig>({
    enabled: false,
    sensitivity: 0.15,
    wakeWords: ['hey labnex', 'labnex', 'computer'],
    silenceThreshold: 2000,
    continuousMode: true
  });
  
  // Debug and command tracking
  const [, setDebugInfo] = useState<DebugInfo>({
    commandHistory: []
  });
  
  // We no longer use the setter but keep state structure for potential future features
  const [, _setDetectedCommands] = useState<VoiceCommand[]>([]);
  const [currentProjectId] = useState<string | undefined>(undefined); // Would come from context

  // Refs for audio processing and welcome state
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadDataArrayRef = useRef<Uint8Array | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVoiceActivityRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isManuallyPausedRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  // Legacy flags kept for potential future use; referenced at bottom to avoid TS unused errors
  const initializedRef = useRef<boolean>(false);
  const welcomeSpokenRef = useRef<boolean>(false);

  // Track last spoken TTS output so we can ignore echoes
  const lastSpokenRef = useRef<string>('');
  const ttsStartRef = useRef<number>(0);

  // Simplified user-facing control model
  type ListeningMode = 'push' | 'handsfree';
  const [listeningMode, setListeningMode] = useState<ListeningMode>('push');
  const [isMuted, setIsMuted] = useState(false);

  // at top of component add mountedRef
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Mark legacy helpers as used to satisfy TS noUnusedLocals
  useEffect(() => {
    void initializedRef.current;
    void welcomeSpokenRef.current;
    void checkBrowserSupport;
    void executeVoiceCommand;
    void parseVoiceCommand;
    void detectWakeWord;
  }, []);

  // ------------------------------------------------------------------
  // Event utilities and voice callback handlers (moved before useVoiceInput to avoid
  // "variable used before declaration" TypeScript errors)
  // ------------------------------------------------------------------

  // Timeline / debug event helper
  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  }, []);

  // Basic string similarity helper (ratio of matching starting words)
  const getSimilarity = (a: string, b: string): number => {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (!a || !b) return 0;
    if (a === b) return 1;
    const aWords = a.split(' ');
    const bWords = b.split(' ');
    const maxLen = Math.max(aWords.length, bWords.length);
    let match = 0;
    for (let i = 0; i < Math.min(aWords.length, bWords.length); i++) {
      if (aWords[i] === bWords[i]) match++;
      else break; // only leading words
    }
    return match / maxLen;
  };

  // Voice command processing (was previously below useVoiceInput)
  const handleVoiceResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    // Echo-prevention: if the assistant is/was speaking very recently and the
    // recognised text is almost the same as what it was saying, ignore it.
    const now = Date.now();
    if (now - ttsStartRef.current < 800) {
      // too close to TTS start – likely echo
      const sim = getSimilarity(transcript, lastSpokenRef.current);
      if (sim > 0.8) return;
    }

    const sim = getSimilarity(transcript, lastSpokenRef.current);
    if (sim > 0.85) return; // ignore near-identical echo

    setCurrentAction(`Processing: "${transcript}"`);
    pushEvent(`Voice Input: ${transcript}`, 'transcribing');

    // Parse potentially multi-step commands
    const parsedIntents = parseMultiCommand(transcript);

    // Check for interruption flag
    const { wasInterrupted } = getMemory();
    if (wasInterrupted) {
      toast('⏭️ Previous task discarded.', { icon: '🤚' });
      clearInterrupted();
    }

    if (isDebugMode) {
      console.log('🎤 Parsed Commands:', parsedIntents);
    }

    // Fallback chat: if every parsed intent is 'unknown', treat transcript as open-ended chat
    const allUnknown = parsedIntents.every(p => p.intent === 'unknown');

    if (allUnknown) {
      setStatus('analyzing');
      pushEvent('Chatting with AI…', 'analyzing');
      try {
        const chatRes = await aiChatApi.sendMessage(transcript, { page: window.location.pathname });
        toast(chatRes.reply, { icon: '🤖' });
        pushEvent('💬 AI replied', 'done');
        if (isSmartListening) {
          await speakOpenAI(chatRes.reply);
        }
        setCurrentAction('Ready for next command');
      } catch (err) {
        console.error('Chat fallback failed', err);
        toast.error('Failed to get AI response');
        pushEvent('Chat error', 'error');
        setCurrentAction('Ready (chat error)');
      }
      return;
    }

    // Execute in sequence if we have actual commands
    const results = await executeCommandQueue(parsedIntents, { navigate: safeNavigate, currentProjectId, isDebugMode });

    // Update debug info with all results
    setDebugInfo(prev => ({
      lastCommand: parsedIntents[parsedIntents.length - 1],
      lastResult: results[results.length - 1],
      commandHistory: [
        ...parsedIntents.map((cmd, idx) => ({ command: cmd, result: results[idx], timestamp: new Date() })),
        ...prev.commandHistory
      ].slice(0, 10)
    }));

    // Voice feedback for each result
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const cmd = parsedIntents[i];
      const msg = formatCommandResult(result, isDebugMode);

      if (result.success) {
        toast.success(msg);
        pushEvent(`✅ ${result.action || cmd.intent}`, 'done');
      } else {
        toast.error(msg);
        pushEvent(`❌ ${result.action || cmd.intent}`, 'error');
      }

      if (result.success && isSmartListening) {
        // eslint-disable-next-line no-await-in-loop
        await speakOpenAI(msg);
      }
    }

    setCurrentAction('Ready for next command');
  }, [safeNavigate, currentProjectId, isDebugMode, isSmartListening, speakOpenAI, pushEvent]);

  // Error handler
  const handleVoiceError = useCallback((error: string) => {
    console.warn('Voice input error:', error);
    pushEvent(`Voice Error: ${error}`, 'error');
    setCurrentAction(`Voice Error: ${error}`);
  }, [pushEvent]);

  // State-change handler
  const handleVoiceStateChange = useCallback((newState: VoiceState) => {
    setStatus(newState);
    
    const stateMessages: Record<VoiceState, string> = {
      idle: 'Ready to listen',
      listening: 'Listening for your command...',
      processing: 'Processing your command...',
      error: 'Voice input error occurred'
    };
    
    setCurrentAction(stateMessages[newState]);
    
    const eventStates: Record<VoiceState, TimelineEventState> = {
      idle: 'idle',
      listening: 'listening', 
      processing: 'analyzing',
      error: 'error'
    };
    
    pushEvent(`Voice ${newState}`, eventStates[newState]);
  }, [pushEvent]);

  // ------------------------------------------------------------------
  // Voice Input Hook (initialized AFTER core handlers are declared)
  // ------------------------------------------------------------------

  const {
    isListening,
    start: startVoice,
    stop: stopVoice,
    toggle: toggleVoiceInput,
    isSupported: isVoiceSupported
  } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
    onStateChange: handleVoiceStateChange,
    enabled: (listeningMode === 'handsfree' ? !isMuted : isSmartListening) && !isTTSSpeaking,
    continuous: true,
    autoRestart: listeningMode === 'handsfree',
    silenceTimeout: 2000,
    language: 'en-US',
    detectWakeWord: listeningMode === 'handsfree' && activeListening.enabled,
    wakeWords: activeListening.wakeWords
  });

  // Switch between modes
  const handleModeToggle = useCallback((enabled: boolean) => {
    setListeningMode(enabled ? 'handsfree' : 'push');
    setIsMuted(false);
    if (enabled) {
      startVoice();
    } else {
      stopVoice();
    }
  }, [startVoice, stopVoice]);

  // Mute / un-mute while in hands-free
  const toggleMute = useCallback(() => {
    if (listeningMode !== 'handsfree') return;
    if (isMuted) {
      setIsMuted(false);
      startVoice();
    } else {
      setIsMuted(true);
      stopVoice();
    }
  }, [listeningMode, isMuted, startVoice, stopVoice]);

  // Keep microphone active in hands-free mode even while TTS is speaking.
  // For push-to-talk we still pause the mic during playback.
  useEffect(() => {
    let resumeTimeout: NodeJS.Timeout | null = null;

    if (listeningMode === 'handsfree') {
      // Never stop the recogniser – echo suppression now handles self-feedback.
      return;
    }

    // Push-to-talk behaviour (keep as before)
    if (isTTSSpeaking) {
      stopVoice();
    } else if (!isMuted) {
      resumeTimeout = setTimeout(() => startVoice(), 300);
    }

    return () => {
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, [isTTSSpeaking, listeningMode, isMuted, startVoice, stopVoice]);

  // Voice Command Parser
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parseVoiceCommand = useCallback((text: string): VoiceCommand => {
    const normalizedText = text.toLowerCase().trim();
    
    // Check if it's a slash command
    const isSlashCommand = normalizedText.startsWith('/');
    
    if (isSlashCommand) {
      // Parse slash command: /command param1 param2
      const parts = normalizedText.slice(1).split(' ');
      const command = parts[0];
      const parameters = parts.slice(1);
      
      return {
        command,
        parameters,
        isSlashCommand: true,
        confidence: 0.95, // High confidence for explicit commands
        originalText: text
      };
    }
    
    // Natural language understanding
    const nluResult = parseNaturalLanguageCommand(normalizedText);
    
    return {
      command: nluResult.command,
      parameters: nluResult.parameters,
      isSlashCommand: false,
      confidence: nluResult.confidence,
      originalText: text
    };
  }, []);

  // Natural Language Understanding for Commands
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parseNaturalLanguageCommand = useCallback((text: string) => {
    const patterns = {
      // Project management
      'create_project': [
        /create (?:a |new )?project (?:called |named |for )?(.+)/i,
        /make (?:a |new )?project (?:called |named |for )?(.+)/i,
        /start (?:a |new )?project (?:called |named |for )?(.+)/i
      ],
      'list_projects': [
        /(?:list|show|display) (?:my )?projects/i,
        /what projects (?:do i have|are there)/i,
        /projects list/i
      ],
      'open_project': [
        /open (?:the )?project (?:called |named )?(.+)/i,
        /switch to (?:the )?project (?:called |named )?(.+)/i,
        /go to (?:the )?project (?:called |named )?(.+)/i
      ],
      
      // Test management
      'create_test': [
        /create (?:a |new )?test (?:case )?(?:for |about |to test )?(.+)/i,
        /make (?:a |new )?test (?:case )?(?:for |about |to test )?(.+)/i,
        /add (?:a |new )?test (?:case )?(?:for |about |to test )?(.+)/i
      ],
      'run_tests': [
        /run (?:the )?tests?/i,
        /execute (?:the )?tests?/i,
        /start testing/i
      ],
      'show_test_results': [
        /(?:show|display) (?:test )?results/i,
        /what are the (?:test )?results/i,
        /test status/i
      ],
      
      // Navigation
      'navigate': [
        /(?:go to|navigate to|open) (?:the )?(.+) (?:page|section)/i,
        /take me to (?:the )?(.+)/i,
        /show me (?:the )?(.+)/i
      ],
      
      // Notes and snippets
      'create_note': [
        /create (?:a |new )?note (?:about |for )?(.+)/i,
        /make (?:a |new )?note (?:about |for )?(.+)/i,
        /add (?:a |new )?note (?:about |for )?(.+)/i
      ],
      'create_snippet': [
        /create (?:a |new )?(?:code )?snippet (?:for |about )?(.+)/i,
        /save (?:this )?code (?:as |for )?(.+)/i,
        /add (?:a |new )?snippet (?:for |about )?(.+)/i
      ],
      
      // System commands
      'help': [
        /help/i,
        /what can you do/i,
        /what commands (?:are available|can i use)/i,
        /how do i (.+)/i
      ],
      'status': [
        /(?:what's|what is) (?:my )?(?:current )?status/i,
        /(?:show|tell me) (?:my )?(?:current )?status/i,
        /status (?:report|update)/i
      ]
    };
    
    for (const [command, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = text.match(regex);
        if (match) {
          const parameters = match.slice(1).filter(Boolean);
          const confidence = calculateConfidence(text, command, match);
          
          return {
            command,
            parameters,
            confidence
          };
        }
      }
    }
    
    // Fallback to general AI chat
    return {
      command: 'chat',
      parameters: [text],
      confidence: 0.7
    };
  }, []);

  // Calculate confidence score for NLU matches
  const calculateConfidence = useCallback((text: string, command: string, match: RegExpMatchArray): number => {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence for exact matches
    if (match[0].length / text.length > 0.8) {
      confidence += 0.1;
    }
    
    // Increase confidence for specific keywords
    const keywordBoosts = {
      'create_project': ['project', 'create', 'new'],
      'run_tests': ['run', 'execute', 'test'],
      'navigate': ['go', 'navigate', 'show']
    };
    
    if (keywordBoosts[command as keyof typeof keywordBoosts]) {
      const keywords = keywordBoosts[command as keyof typeof keywordBoosts];
      const foundKeywords = keywords.filter(keyword => text.includes(keyword));
      confidence += (foundKeywords.length / keywords.length) * 0.1;
    }
    
    return Math.min(confidence, 0.99);
  }, []);

  // Wake word detection
  const detectWakeWord = useCallback((text: string): boolean => {
    const normalizedText = text.toLowerCase();
    return activeListening.wakeWords.some(wakeWord => 
      normalizedText.includes(wakeWord.toLowerCase())
    );
  }, [activeListening.wakeWords]);

  // Handle slash commands
  const handleSlashCommand = useCallback(async (voiceCommand: VoiceCommand): Promise<{success: boolean, message: string}> => {
    const { command, parameters } = voiceCommand;
    
    switch (command) {
      case 'help':
        return {
          success: true,
          message: 'Available slash commands: /help, /status, /projects, /tests, /create, /navigate. You can also speak naturally!'
        };
        
      case 'status':
        return {
          success: true,
          message: `Voice mode is active. Current status: ${status}. Active listening is ${activeListening.enabled ? 'enabled' : 'disabled'}.`
        };
        
      case 'projects': {
        try {
          // This would integrate with your project API
          return {
            success: true,
            message: 'Fetching your projects. This would show your current projects.'
          };
        } catch {
          return {
            success: false,
            message: 'Could not fetch projects.'
          };
        }
      }
        
      case 'tests':
        return {
          success: true,
          message: 'This would show your test results and run new tests.'
        };
        
      case 'create':
        if (parameters.length === 0) {
          return {
            success: false,
            message: 'Please specify what to create. For example: /create project MyApp'
          };
        }
        return {
          success: true,
          message: `Creating ${parameters.join(' ')}. This would integrate with your creation workflows.`
        };
        
      case 'navigate': {
        if (parameters.length === 0) {
          return {
            success: false,
            message: 'Please specify where to navigate. For example: /navigate dashboard'
          };
        }
        const destination = parameters.join(' ');
        // This would integrate with your routing
        return {
          success: true,
          message: `Navigating to ${destination}.`
        };
      }
        
      default:
        return {
          success: false,
          message: `Unknown slash command: ${command}. Say "/help" for available commands.`
        };
    }
  }, [status, activeListening.enabled]);

  // Handle NLU commands
  const handleNLUCommand = useCallback(async (voiceCommand: VoiceCommand): Promise<{success: boolean, message: string}> => {
    const { command, parameters } = voiceCommand;
    
    switch (command) {
      case 'create_project': {
        const projectName = parameters[0] || 'New Project';
        return {
          success: true,
          message: `I'll help you create a project called "${projectName}". This would integrate with your project creation system.`
        };
      }
        
      case 'list_projects':
        return {
          success: true,
          message: 'Here are your current projects. This would fetch and list your actual projects.'
        };
        
      case 'open_project': {
        const targetProject = parameters[0] || 'the specified project';
        return {
          success: true,
          message: `Opening ${targetProject}. This would navigate to the project.`
        };
      }
        
      case 'create_test': {
        const testDescription = parameters[0] || 'a new test';
        return {
          success: true,
          message: `Creating a test case for ${testDescription}. This would integrate with your test creation system.`
        };
      }
        
      case 'run_tests':
        return {
          success: true,
          message: 'Running your test suite. This would execute your tests and provide results.'
        };
        
      case 'navigate': {
        const page = parameters[0] || 'the specified page';
        return {
          success: true,
          message: `Navigating to ${page}. This would handle the navigation.`
        };
      }
        
      case 'help':
        return {
          success: true,
          message: 'I can help you with projects, tests, navigation, notes, and more. Try saying "create a project" or "run tests".'
        };
        
      case 'status':
        return {
          success: true,
          message: `Your system status: Voice mode active, ${events.length} recent activities. Everything looks good!`
        };
        
      default:
        return {
          success: false,
          message: `I understand you want to ${command}, but I'm not sure how to do that yet. This would be implemented based on your specific needs.`
        };
    }
  }, [events.length]);

  // Execute voice command
  const executeVoiceCommand = useCallback(async (voiceCommand: VoiceCommand) => {
    pushEvent(`Executing: ${voiceCommand.command}`, 'executing');
    setCurrentAction(`Executing command: ${voiceCommand.command}`);
    
    try {
      if (voiceCommand.isSlashCommand) {
        // Handle slash commands
        const result = await handleSlashCommand(voiceCommand);
        if (result.success) {
          await speakOpenAI(result.message);
          pushEvent(`Command completed: ${voiceCommand.command}`, 'done');
        } else {
          throw new Error(result.message);
        }
      } else if (voiceCommand.command === 'chat') {
        // Regular AI chat
        const response = await aiChatApi.sendMessage(voiceCommand.originalText);
        if (response.reply) {
          await speakOpenAI(response.reply);
          pushEvent('AI response completed', 'done');
        }
      } else {
        // NLU commands
        const result = await handleNLUCommand(voiceCommand);
        if (result.success) {
          await speakOpenAI(result.message);
          pushEvent(`NLU command completed: ${voiceCommand.command}`, 'done');
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error('Command execution error:', error);
      const errorMessage = `Sorry, I couldn't execute that command. ${(error as Error).message}`;
      await speakOpenAI(errorMessage);
      pushEvent(`Command failed: ${voiceCommand.command}`, 'error');
    }
  }, [speakOpenAI, pushEvent, handleSlashCommand, handleNLUCommand]);

  // Enhanced VAD with active listening
  const vadLoop = useCallback(() => {
    if (!mountedRef.current || !analyserRef.current || !vadDataArrayRef.current) return;

    try {
      analyserRef.current.getByteFrequencyData(vadDataArrayRef.current);
      const average = vadDataArrayRef.current.reduce((sum, value) => sum + value, 0) / vadDataArrayRef.current.length;
      const normalizedLevel = Math.min(average / 128, 1);
      
      setVoiceActivityLevel(normalizedLevel);

      const isVoiceDetected = normalizedLevel > activeListening.sensitivity;

      if (isVoiceDetected) {
        lastVoiceActivityRef.current = Date.now();
        
        // Auto-activate listening in active listening mode
        if (activeListening.enabled && status === 'monitoring' && !isTTSSpeaking) {
          setStatus('listening');
          setCurrentAction('Voice detected - starting to listen...');
          pushEvent('Auto-activated by voice detection', 'listening');
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Auto-start recognition error:', error);
            }
          }
        }
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else {
        // Handle silence in different modes
        if (!silenceTimeoutRef.current) {
          const timeoutDuration = status === 'listening' ? activeListening.silenceThreshold : 5000;
          
          silenceTimeoutRef.current = setTimeout(() => {
            const timeSinceLastActivity = Date.now() - lastVoiceActivityRef.current;
            
            if (timeSinceLastActivity > timeoutDuration) {
              if (status === 'listening' && activeListening.enabled && activeListening.continuousMode) {
                // Switch back to monitoring mode
                setStatus('monitoring');
                setCurrentAction('Monitoring for voice activity...');
                pushEvent('Switched to monitoring mode', 'waiting');
              } else if (status === 'listening') {
                setStatus('waiting');
                setCurrentAction('Waiting for voice input...');
                pushEvent('Waiting for voice input', 'waiting');
              }
            }
          }, timeoutDuration);
        }
      }

      vadTimeoutRef.current = setTimeout(vadLoop, 100);
    } catch (error) {
      console.error('Voice activity detection error:', error);
      pushEvent('VAD processing error', 'error');
    }
  }, [status, activeListening, isTTSSpeaking, pushEvent]);

  // Enhanced browser support detection
  const checkBrowserSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasAudioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setCurrentAction('Speech recognition not supported in this browser');
      pushEvent('Browser not supported', 'error');
      return false;
    }
    
    if (!hasGetUserMedia) {
      setIsSupported(false);
      setCurrentAction('Microphone access not available');
      pushEvent('No microphone support', 'error');
      return false;
    }

    if (!hasAudioContext) {
      setIsSupported(false);
      setCurrentAction('Audio processing not supported');
      pushEvent('No audio context support', 'error');
      return false;
    }

    return true;
  }, [pushEvent]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMicrophoneError = useCallback((errorType: string = 'Unknown error') => {
    const errorMessage = `Microphone error: ${errorType}`;
    toast.error(errorMessage);
    setStatus('error');
    setCurrentAction(`Microphone ${errorType.toLowerCase()}`);
    pushEvent(`Microphone error: ${errorType}`, 'error');
    
    // Cleanup on error
    cleanupVoiceSystem();
  }, [pushEvent]);

  const cleanupVoiceSystem = useCallback(() => {
    try {
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioStream(null);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      setPermissionError(null);
      
      if (!audioStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100
            } 
          });
          audioStreamRef.current = stream;
          setAudioStream(stream);

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext; // Browser API
          audioContextRef.current = new AudioContextClass();

          // Handle audio context suspension
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 512; // Increased for better frequency resolution
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;

          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyser);

          vadDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        } catch (permError: unknown) {
          const error = permError as { name?: string };
          if (error.name === 'NotAllowedError') {
            setPermissionError('Microphone permission denied. Please enable microphone access and refresh the page.');
            handleMicrophoneError('Permission denied');
          } else if (error.name === 'NotFoundError') {
            setPermissionError('No microphone found. Please connect a microphone and try again.');
            handleMicrophoneError('No microphone');
          } else {
            setPermissionError('Failed to access microphone. Please check your browser settings.');
            handleMicrophoneError('Access failed');
          }
          return;
        }
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setStatus('listening');
          setCurrentAction('Listening for your voice...');
          pushEvent('Started listening', 'listening');
          isManuallyPausedRef.current = false;
          retryCountRef.current = 0;
          vadLoop();
        } catch (recError: any) { // Speech recognition error
          console.error('Speech recognition start error:', recError);
          if (recError.name === 'InvalidStateError') {
            // Recognition is already running, stop and restart
            recognitionRef.current.stop();
            setTimeout(() => startListening(), 100);
          } else {
            handleMicrophoneError('Recognition failed');
          }
        }
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast.error('Failed to start voice recognition');
      handleMicrophoneError('System error');
    }
  }, [vadLoop, pushEvent, handleMicrophoneError]);

  const stopListening = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = null;
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      setStatus('paused');
      setCurrentAction('Voice recognition paused');
      pushEvent('Stopped listening', 'idle');
      isManuallyPausedRef.current = true;
      setVoiceActivityLevel(0);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      pushEvent('Error stopping recognition', 'error');
    }
  }, [pushEvent]);

  // Toggle active listening mode
  const toggleActiveListening = useCallback(() => {
    setActiveListening(prev => {
      const newState = { ...prev, enabled: !prev.enabled };
      
      if (newState.enabled) {
        setStatus('monitoring');
        setCurrentAction('Active listening enabled - monitoring for voice...');
        pushEvent('Active listening enabled', 'listening');
        toast.success('Active listening enabled - I\'m always listening for wake words!');
        
        // Start monitoring immediately
        if (!vadTimeoutRef.current && mountedRef.current) {
          vadLoop();
        }
      } else {
        setStatus('idle');
        setCurrentAction('Active listening disabled');
        pushEvent('Active listening disabled', 'idle');
        toast.success('Active listening disabled');
        
        // Stop current recognition if active
        if (recognitionRef.current && (status === 'listening' || status === 'monitoring')) {
          recognitionRef.current.stop();
        }
      }
      
      return newState;
    });
  }, [vadLoop, status, pushEvent]);

  const resetVoiceSystem = useCallback(() => {
    try {
      stopListening();
      stopSpeaking();
      setStatus('idle');
      setTranscript('');
      setCurrentAction('Voice system reset');
      setPermissionError(null);
      retryCountRef.current = 0;
      pushEvent('System reset', 'done');
    } catch (error) {
      console.error('Error resetting voice system:', error);
      pushEvent('Error during reset', 'error');
    }
  }, [stopListening, stopSpeaking, pushEvent]);

  // Toggle active listening mode
  const togglePause = useCallback(() => {
    try {
      if (status === 'listening' || status === 'waiting') {
        stopListening();
      } else if (status === 'paused' || status === 'idle' || status === 'error') {
        startListening();
      }
    } catch (error) {
      console.error('Toggle pause error:', error);
      pushEvent('Error toggling pause', 'error');
    }
  }, [status, stopListening, startListening, pushEvent]);

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'text-green-400';
      case 'analyzing': return 'text-blue-400';
      case 'speaking': return 'text-purple-400';
      case 'paused': return 'text-yellow-400';
      case 'waiting': return 'text-orange-400';
      case 'monitoring': return 'text-cyan-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  // ------------------------------------------------------------------
  // Personalized Welcome Message (first-time vs returning)
  // ------------------------------------------------------------------
  const [hasWelcomed, setHasWelcomed] = useState<boolean>(false);
  useEffect(() => {
    if (hasWelcomed) return;
    if (status !== 'idle' || isTTSSpeaking) return; // wait until system idle and TTS free
    const firstName = user?.name?.split(' ')[0] || 'there';
    const hasSeen = localStorage.getItem('voice_welcome_shown');
    const message = hasSeen
      ? `Welcome back ${firstName}! What are we doing today?`
      : `Hello ${firstName}, welcome to Labnex Voice Mode. How can I help you today?`;

    speakOpenAI(message).then(() => {
      // after speaking finished, system will auto resume mic by earlier effect
    });
    localStorage.setItem('voice_welcome_shown', 'true');
    setHasWelcomed(true);
    pushEvent('🎉 Welcome message played', 'done');
  }, [hasWelcomed, status, isTTSSpeaking, user, speakOpenAI, pushEvent]);

  // Browser not supported UI
  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-8">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Browser Not Supported</h1>
        <p className="text-slate-400 text-center mb-6 max-w-md">
          Your browser doesn't support the required features for AI Voice Mode. 
          Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Permission error UI
  if (permissionError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-8">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Microphone Access Required</h1>
        <p className="text-slate-400 text-center mb-6 max-w-md">
          {permissionError}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Minimal UI
  // ------------------------------------------------------------
  return (
    <div className="voice-mode-container overflow-hidden font-sans text-slate-100 bg-gradient-to-br from-slate-900 via-purple-900/20 to-indigo-900/30">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Primary gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-indigo-900/40"></div>
        
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-600/5 to-cyan-600/10 animate-pulse opacity-70"></div>
        
        {/* Radial gradient for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full particle ${
              i % 3 === 0 ? 'w-2 h-2 bg-purple-400/20' :
              i % 3 === 1 ? 'w-1 h-1 bg-cyan-400/30' :
              'w-1.5 h-1.5 bg-indigo-400/15'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      <MobileVoiceGestures
        onDoubleTap={togglePause}
        onSwipeDown={resetVoiceSystem}
        onLongPress={toggleActiveListening}
      >
        <div className="relative h-full">
          {/* Top Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 animate-slide-in-top">
            <div className="flex items-center justify-between p-8">
              {/* Status Indicator */}
              <div className="flex items-center gap-4">
                <div className={`relative w-4 h-4 rounded-full transition-all duration-500 ${
                  status === 'listening' ? 'bg-green-400 shadow-green-400/50' :
                  status === 'speaking' ? 'bg-purple-400 shadow-purple-400/50' :
                  status === 'analyzing' ? 'bg-blue-400 shadow-blue-400/50' :
                  status === 'error' ? 'bg-red-400 shadow-red-400/50' : 'bg-slate-400 shadow-slate-400/50'
                } shadow-lg`}>
                  {/* Pulsing ring for active states */}
                  {(status === 'listening' || status === 'speaking' || status === 'analyzing') && (
                    <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30"></div>
                  )}
                </div>
                <div className="text-white">
                  <h3 className="font-bold text-lg tracking-wide">LABNEX AI</h3>
                  <p className="text-slate-300 text-sm opacity-80">{
                    status === 'listening' ? 'Listening for commands...' :
                    status === 'speaking' ? 'AI is responding...' :
                    status === 'analyzing' ? 'Processing your request...' :
                    status === 'error' ? 'Voice error occurred' :
                    'Ready to listen'
                  }</p>
                </div>
              </div>
              
              {/* System Stats */}
              <div className="hidden md:flex items-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{events.length}</span>
                  <span>Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{listeningMode === 'handsfree' ? 'Auto' : 'Manual'}</span>
                  <span>Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex h-full">
            {/* Left Timeline Panel */}
            <div className="hidden xl:flex w-80 flex-col animate-slide-in-left">
              <div className="flex-1 p-8 pt-32">
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 h-full border border-slate-700/30 shadow-2xl hover-glow voice-transition">
                  <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⚡</span>
                    </div>
                    Activity Timeline
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {events.slice(0, 12).map((event, i) => (
                      <div key={event.id} className="group flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-600/20 hover:bg-slate-700/50 hover:border-slate-500/30 transition-all duration-300 hover-lift">
                        <div className="relative timeline-connector">
                          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            event.state === 'done' ? 'bg-green-400 shadow-green-400/50' :
                            event.state === 'error' ? 'bg-red-400 shadow-red-400/50' :
                            event.state === 'listening' ? 'bg-blue-400 shadow-blue-400/50' :
                            event.state === 'analyzing' ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-slate-400 shadow-slate-400/50'
                          } shadow-lg group-hover:scale-110`}></div>
                          {i < events.length - 1 && (
                            <div className="absolute top-4 left-1/2 w-px h-8 bg-gradient-to-b from-slate-500/50 to-transparent -translate-x-1/2"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm leading-relaxed group-hover:text-slate-100 transition-colors">{event.label}</p>
                          <p className="text-slate-400 text-xs mt-1 font-mono">{i === 0 ? 'now' : `${i * 2}s ago`}</p>
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-slate-400">🔇</span>
                        </div>
                        <p className="text-sm">No activity yet</p>
                        <p className="text-xs mt-1">Start speaking to see events</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Central Voice Interface */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Large Status Display */}
              <div className="mb-12 animate-fade-in-scale">
                <div className={`text-6xl md:text-8xl font-black tracking-wider transition-all duration-500 text-center status-shimmer ${getStatusColor()}`}>
                  {status.toUpperCase()}
                </div>
                <div className="text-center mt-4">
                  <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-current to-transparent opacity-50 rounded-full"></div>
                </div>
              </div>

              {/* Enhanced Voice Orb */}
              <div className="relative mb-12 animate-fade-in-scale">
                {/* Outer glow rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {(status === 'listening' || status === 'monitoring') && (
                    <>
                      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full border border-green-400/20 animate-ping"></div>
                      <div className="absolute w-72 h-72 md:w-88 md:h-88 rounded-full border border-green-400/30 animate-pulse"></div>
                    </>
                  )}
                  
                  {status === 'speaking' && (
                    <>
                      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full border border-purple-400/20 animate-ping"></div>
                      <div className="absolute w-72 h-72 md:w-88 md:h-88 rounded-full border border-purple-400/30 animate-pulse"></div>
                    </>
                  )}
                  
                  {status === 'analyzing' && (
                    <>
                      <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full border border-blue-400/20 animate-spin-slow"></div>
                      <div className="absolute w-72 h-72 md:w-88 md:h-88 rounded-full border border-blue-400/30 animate-pulse"></div>
                    </>
                  )}
                </div>

                {/* Main Orb */}
                <div className={`voice-orb voice-transition relative w-56 h-56 md:w-72 md:h-72 rounded-full shadow-2xl transition-all duration-700 ${
                  status === 'listening' ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 listening' :
                  status === 'speaking' ? 'bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 speaking' :
                  status === 'analyzing' ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-600 animate-spin-slow' :
                  status === 'error' ? 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600' :
                  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700'
                }`}>
                  
                  {/* Inner glow effect */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                  
                  {/* Waveform Overlay */}
                  <div className="absolute inset-0 rounded-full overflow-hidden opacity-70">
                    <AudioWaveform
                      audioStream={audioStream}
                      isActive={status === 'listening' || status === 'monitoring'}
                      mode={status === 'speaking' ? 'output' : status === 'listening' || status === 'monitoring' ? 'input' : 'idle'}
                      intensity={status === 'speaking' ? 0.8 : voiceActivityLevel}
                    />
                  </div>
                  
                  {/* Central Mic Button */}
                  <button
                    onClick={listeningMode === 'push' ? toggleVoiceInput : toggleMute}
                    disabled={!isVoiceSupported}
                    className="absolute inset-0 flex items-center justify-center focus:outline-none group transition-all duration-300 hover:scale-105"
                  >
                    <div className="relative">
                      <MicrophoneIcon className={`w-24 h-24 md:w-32 md:h-32 transition-all duration-300 ${
                        !isVoiceSupported ? 'text-gray-500' :
                        listeningMode === 'handsfree' && !isMuted ? 'text-cyan-100 drop-shadow-2xl' :
                        isListening ? 'text-white drop-shadow-2xl' :
                        'text-white/90 group-hover:text-white group-hover:scale-110'
                      }`} />
                      
                      {/* Infinity symbol for hands-free */}
                      {listeningMode === 'handsfree' && !isMuted && (
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          <span className="text-white text-xl font-bold">∞</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Control Panel */}
            <div className="hidden lg:flex w-80 flex-col animate-slide-in-right">
              <div className="flex-1 p-8 pt-32">
                <div className="space-y-6">
                  {/* Mode Control Card */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">⚙️</span>
                      </div>
                      Voice Mode
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">∞</span>
                          </div>
                          <div>
                            <h5 className="text-white font-semibold">Always Listen</h5>
                            <p className="text-slate-400 text-sm">Hands-free voice mode</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleModeToggle(listeningMode === 'push')}
                          className={`btn-voice-mode relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 hover-lift ${
                            listeningMode === 'handsfree' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50' : 'bg-slate-600'
                          } shadow-lg`}
                        >
                          <span
                            className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                              listeningMode === 'handsfree' ? 'translate-x-10 shadow-cyan-200/50' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Voice Activity Indicator */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🎤</span>
                      </div>
                      Voice Activity
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Level</span>
                        <span className="text-white font-mono activity-pulse">{Math.round(voiceActivityLevel * 100)}%</span>
                      </div>
                      
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-150 rounded-full"
                          style={{ 
                            width: `${voiceActivityLevel * 100}%`,
                            boxShadow: voiceActivityLevel > 0.1 ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <div className="text-center">
                          <div className="w-full h-1 bg-slate-700 rounded mb-1"></div>
                          <span>Silent</span>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-1 bg-yellow-500 rounded mb-1"></div>
                          <span>Speaking</span>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-1 bg-green-500 rounded mb-1"></div>
                          <span>Loud</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Gesture Hints */}
          <div className="xl:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-20 animate-slide-in-top">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-full px-8 py-4 border border-slate-700/50 shadow-2xl hover-glow voice-transition">
              <div className="flex items-center gap-6 text-slate-300">
                <div className="flex items-center gap-3 hover-lift voice-transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">👆</span>
                  </div>
                  <span className="text-sm font-medium">Tap orb</span>
                </div>
                <div className="w-px h-6 bg-gradient-to-b from-slate-600 to-transparent"></div>
                <div className="flex items-center gap-3 hover-lift voice-transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">⬆️</span>
                  </div>
                  <span className="text-sm font-medium">Swipe up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MobileVoiceGestures>
    </div>
  );
};

export default AIVoiceMode; 