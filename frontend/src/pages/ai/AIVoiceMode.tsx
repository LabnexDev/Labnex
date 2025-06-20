import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PauseIcon, PlayIcon, XMarkIcon, MicrophoneIcon, Bars3Icon, ExclamationTriangleIcon, CommandLineIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceInput, type VoiceState } from '../../hooks/useVoiceInput';
import { parseMultiCommand, type ParsedIntent } from '../../utils/parseNLUCommand';
import { executeCommandQueue, formatCommandResult, type CommandResult } from '../../utils/slashCommandHandler';
import VoiceStatusTimeline, { type TimelineEvent, type TimelineEventState } from '../../components/ai-chat/VoiceStatusTimeline';
import AudioWaveform from '../../components/ai-chat/AudioWaveform';
import AIPreviewPanel from '../../components/ai-chat/AIPreviewPanel';
import MobileVoiceGestures from '../../components/ai-chat/MobileVoiceGestures';
import AIVoiceTutorial from '../../components/onboarding/AIVoiceTutorial';
import { aiChatApi } from '../../api/aiChat';
import MemoryPanel from '../../components/ai-chat/MemoryPanel';
import { getSuggestion, suggestionsCount } from '../../utils/rotateSuggestions';


/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const { speak: speakOpenAI, isSpeaking: isTTSSpeaking, stopSpeaking } = useOpenAITTS();

  // Sync TTS speaking state to voiceContext
  useEffect(() => {
    (async () => {
      const vc = await import('../../utils/voiceContext');
      vc.setIsSpeaking(isTTSSpeaking);
    })();
  }, [isTTSSpeaking]);

  // State management
  const [status, setStatus] = useState<AIStatus>('idle');
  const [currentAction, setCurrentAction] = useState<string>('Starting voice mode...');
  const [isSmartListening, setIsSmartListening] = useState(true);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isDebugMode] = useState(localStorage.getItem('devMode') === 'true');
  
  // Browser / permission support states (used in legacy UI blocks)
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Legacy helper states still referenced in VAD / wake-word logic
  const [, setTranscript] = useState('');
  const [, setLastWakeWordDetected] = useState<number>(0);
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
  
  const [detectedCommands, setDetectedCommands] = useState<VoiceCommand[]>([]);
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
  const initializedRef = useRef<boolean>(false);
  const welcomeSpokenRef = useRef<boolean>(false);

  // New states for suggestion rotation
  const [_suggestionIndex, setSuggestionIndex] = useState(0);
  const [currentSuggestion, setCurrentSuggestion] = useState(getSuggestion(0));

  // Event handler - defined first to avoid hoisting issues
  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  }, []);

  // Voice command processing
  const handleVoiceResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setCurrentAction(`Processing: "${transcript}"`);
         pushEvent(`Voice Input: ${transcript}`, 'transcribing');

    // Parse potentially multi-step commands
    const parsedIntents = parseMultiCommand(transcript);

    // Check for interruption flag
    const { wasInterrupted } = await import('../../utils/voiceContext').then(m => m.getMemory());
    if (wasInterrupted) {
      toast('⏭️ Previous task discarded.', {
        icon: '🤚',
      });
      const vc = await import('../../utils/voiceContext');
      vc.clearInterrupted();
    }

    if (isDebugMode) {
      console.log('🎤 Parsed Commands:', parsedIntents);
    }

    // Execute in sequence
    const results = await executeCommandQueue(parsedIntents, {
      navigate,
      currentProjectId,
      isDebugMode
    });

    const lastResult = results[results.length - 1];

    // Update debug info with all results
    setDebugInfo(prev => ({
      lastCommand: parsedIntents[parsedIntents.length - 1],
      lastResult: lastResult,
      commandHistory: [
        ...parsedIntents.map((cmd, idx) => ({ command: cmd, result: results[idx], timestamp: new Date() })),
        ...prev.commandHistory
      ].slice(0, 10)
    }));

    // Feedback for each result
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
  }, [navigate, currentProjectId, isDebugMode, isSmartListening, speakOpenAI, pushEvent]);

  const handleVoiceError = useCallback((error: string) => {
    console.warn('Voice input error:', error);
    pushEvent(`Voice Error: ${error}`, 'error');
    setCurrentAction(`Voice Error: ${error}`);
  }, [pushEvent]);

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

  // Production-ready voice input hook
  const {
    state: voiceState,
    isListening,
    error: voiceError,
    toggle: toggleVoiceInput,
    isSupported: isVoiceSupported
  } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
    onStateChange: handleVoiceStateChange,
    enabled: isSmartListening,
    continuous: activeListening.continuousMode,
    autoRestart: activeListening.enabled,
    silenceTimeout: activeListening.silenceThreshold,
    language: 'en-US',
    detectWakeWord: activeListening.enabled,
    wakeWords: activeListening.wakeWords
  });

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
    if (!analyserRef.current || !vadDataArrayRef.current) return;

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

  // Enhanced speech recognition with wake word detection
  const handleFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isTTSSpeaking) return;

    const cleanText = text.trim();
    
    // Check for wake word if in monitoring mode
    if (status === 'monitoring' && !detectWakeWord(cleanText)) {
      pushEvent(`Ignored: "${cleanText}" (no wake word)`, 'waiting');
      return;
    }
    
    if (detectWakeWord(cleanText)) {
      setLastWakeWordDetected(Date.now());
      // Remove wake word from command if present
      const commandText = activeListening.wakeWords.reduce((text, wakeWord) => {
        return text.replace(new RegExp(wakeWord, 'gi'), '').trim();
      }, cleanText);
      
      if (commandText.length > 0) {
        text = commandText;
      } else {
        await speakOpenAI("I'm listening. How can I help you?");
        return;
      }
    }

    setStatus('analyzing');
    setCurrentAction('Understanding your command...');
    pushEvent(`Processing: "${cleanText}"`, 'transcribing');

    try {
      // Parse the voice command
      const voiceCommand = parseVoiceCommand(cleanText);
      setDetectedCommands(prev => [voiceCommand, ...prev.slice(0, 4)]);
      
      pushEvent(`Detected ${voiceCommand.isSlashCommand ? 'slash' : 'NLU'} command: ${voiceCommand.command}`, 'analyzing');
      
      setStatus('speaking');
      setCurrentAction('Executing command...');
      
      await executeVoiceCommand(voiceCommand);
      
      // Return to appropriate state
      if (activeListening.enabled && activeListening.continuousMode) {
        setStatus('monitoring');
        setCurrentAction('Monitoring for voice activity...');
        pushEvent('Ready for next command', 'waiting');
      } else {
        setStatus('waiting');
        setCurrentAction('Ready for your next input...');
        pushEvent('Ready for next input', 'waiting');
        
        if (!isManuallyPausedRef.current && isSmartListening) {
          setTimeout(() => {
            if (!isManuallyPausedRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setStatus('listening');
                setCurrentAction('Listening for your voice...');
                pushEvent('Auto-restarted listening', 'listening');
                isManuallyPausedRef.current = false;
              } catch (error) {
                console.error('Auto-restart error:', error);
              }
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process your command. Please try again.');
      setStatus('error');
      setCurrentAction('Error processing command');
      pushEvent('Error processing command', 'error');
      
      setTimeout(() => {
        if (activeListening.enabled) {
          setStatus('monitoring');
          setCurrentAction('Monitoring for voice activity...');
        } else {
          setStatus('idle');
          setCurrentAction('Ready to start');
        }
      }, 3000);
    }
  }, [isTTSSpeaking, status, detectWakeWord, parseVoiceCommand, executeVoiceCommand, activeListening, isSmartListening, pushEvent, speakOpenAI]);

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
        if (!vadTimeoutRef.current) {
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

  // Enhanced initialization
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!checkBrowserSupport()) {
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        pushEvent('Recognition started', 'listening');
        retryCountRef.current = 0;
      };

      recognition.onend = () => {
        if ((status === 'listening' || status === 'monitoring') && !isManuallyPausedRef.current) {
          const delay = Math.min(100 * Math.pow(2, retryCountRef.current), 2000);
          setTimeout(() => {
            if (!isManuallyPausedRef.current && (status === 'listening' || status === 'monitoring')) {
              retryCountRef.current++;
              if (retryCountRef.current < 5) {
                try {
                  recognition.start();
                } catch (error) {
                  console.error('Auto-restart failed:', error);
                  handleMicrophoneError('Auto-restart failed');
                }
              } else {
                handleMicrophoneError('Too many restarts');
              }
            }
          }, delay);
        }
      };

      recognition.onerror = (event: any) => { // Speech recognition event
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          handleMicrophoneError('Permission denied');
        } else if (event.error === 'no-speech') {
          if (status === 'monitoring') {
            pushEvent('No speech detected (monitoring)', 'waiting');
          } else {
            pushEvent('No speech detected', 'waiting');
          }
        } else if (event.error === 'network') {
          handleMicrophoneError('Network error');
        } else {
          handleMicrophoneError(event.error);
        }
      };

      recognition.onresult = (event: any) => { // Speech recognition event
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);

        if (finalTranscript) {
          handleFinalTranscript(finalTranscript);
        }
      };

      recognitionRef.current = recognition;

      // Enhanced welcome message
      if (!welcomeSpokenRef.current) {
        welcomeSpokenRef.current = true;
        setTimeout(() => {
          setCurrentAction('Ready! Try saying "Hey Labnex" or click to start...');
          pushEvent('System ready', 'idle');
        }, 500);
      }

    } catch (error) {
      console.error('Initialization error:', error);
      setIsSupported(false);
      setCurrentAction('Failed to initialize voice system');
      pushEvent('Initialization failed', 'error');
    }

    return cleanupVoiceSystem;
  }, [checkBrowserSupport, status, pushEvent, handleMicrophoneError, handleFinalTranscript]);

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

  const getStatusIcon = () => {
    if (status === 'error') {
      return <ExclamationTriangleIcon className="w-8 h-8" />;
    }
    if (status === 'listening' || status === 'waiting' || status === 'monitoring') {
      return <PauseIcon className="w-8 h-8" />;
    }
    return <PlayIcon className="w-8 h-8" />;
  };

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

  // suggestion rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex(prev => {
        const next = (prev + 1) % suggestionsCount();
        setCurrentSuggestion(getSuggestion(next));
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Enhanced Header with Active Listening Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 backdrop-blur-sm bg-slate-800/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">AI Voice Mode</h1>
          {activeListening.enabled && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Active Listening</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleActiveListening}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              activeListening.enabled 
                ? 'bg-green-600/20 text-green-300 hover:bg-green-600/30' 
                : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
            }`}
            title={activeListening.enabled ? 'Disable active listening' : 'Enable active listening'}
          >
            {activeListening.enabled ? 'Active ON' : 'Active OFF'}
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="px-3 py-1 text-sm bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors"
          >
            Help
          </button>
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="md:hidden p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Command Detection Display */}
      {detectedCommands.length > 0 && (
        <div className="bg-slate-800/50 border-b border-slate-700/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <CommandLineIcon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Last Detected Commands:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedCommands.slice(0, 3).map((cmd, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded text-xs">
                <span className={cmd.isSlashCommand ? 'text-blue-300' : 'text-green-300'}>
                  {cmd.isSlashCommand ? '/' : 'NLU'}
                </span>
                <span className="text-slate-200">{cmd.command}</span>
                <span className="text-slate-400">({Math.round(cmd.confidence * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Status Display */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${getStatusColor()}`}>
              {status.toUpperCase()}
            </div>
            <div className="text-slate-400 text-lg">{currentAction}</div>
            {activeListening.enabled && status === 'monitoring' && (
              <div className="text-slate-500 text-sm mt-2">
                Wake words: {activeListening.wakeWords.join(', ')}
              </div>
            )}
            
            {/* New Voice System Status */}
            <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/20">
              <div className="text-sm text-slate-300 mb-2">🚀 New Voice System Status:</div>
              <div className="flex items-center gap-4 text-xs">
                <span className={`px-2 py-1 rounded ${voiceState === 'listening' ? 'bg-green-600/20 text-green-300' : 'bg-slate-600/20 text-slate-400'}`}>
                  State: {voiceState}
                </span>
                <span className={`px-2 py-1 rounded ${isVoiceSupported ? 'bg-blue-600/20 text-blue-300' : 'bg-red-600/20 text-red-300'}`}>
                  {isVoiceSupported ? '✅ Supported' : '❌ Not Supported'}
                </span>
                {voiceError && (
                  <span className="px-2 py-1 rounded bg-red-600/20 text-red-300">
                    Error: {voiceError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Voice Activity Visualization */}
          <div className="mb-8">
            <AudioWaveform 
              audioStream={audioStream}
              isActive={status === 'listening' || status === 'monitoring'}
              mode={status === 'speaking' ? 'output' : status === 'listening' || status === 'monitoring' ? 'input' : 'idle'}
              intensity={status === 'speaking' ? 0.8 : voiceActivityLevel}
            />
          </div>

          {/* Enhanced Control Buttons */}
          <div className="flex items-center space-x-4">
            {/* Demo: New Voice System */}
            <button
              onClick={toggleVoiceInput}
              disabled={!isVoiceSupported}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 transform ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white scale-105'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
              } disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100 shadow-lg`}
            >
              {!isVoiceSupported ? '❌ Voice Not Supported' : isListening ? '🛑 Stop New Voice System' : '🎤 Start New Voice System'}
            </button>
            
            <button
              onClick={togglePause}
              className={`p-4 rounded-full transition-colors shadow-lg ${
                status === 'analyzing' || status === 'speaking' 
                  ? 'bg-slate-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={status === 'analyzing' || status === 'speaking'}
              title={
                status === 'listening' || status === 'waiting' || status === 'monitoring'
                  ? 'Stop listening' 
                  : 'Start listening'
              }
            >
              {getStatusIcon()}
            </button>

            <button
              onClick={resetVoiceSystem}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Reset voice system"
            >
              <MicrophoneIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Settings */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400">Smart Listening</span>
              <button
                onClick={() => setIsSmartListening(!isSmartListening)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSmartListening ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                title={isSmartListening ? 'Disable smart listening' : 'Enable smart listening'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSmartListening ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {activeListening.enabled && (
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">Sensitivity</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.05"
                  value={activeListening.sensitivity}
                  onChange={(e) => setActiveListening(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-slate-400 text-sm">{Math.round(activeListening.sensitivity * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Side Panel */}
        <div className={`w-80 border-l border-slate-700/50 bg-slate-800/30 backdrop-blur-sm ${showMobilePanel ? 'block' : 'hidden md:block'}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Voice Timeline</h3>
            <VoiceStatusTimeline events={events} />
            
            {/* Command Examples */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3 text-slate-300">Try These Commands:</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-slate-700/30 rounded border-l-2 border-blue-500">
                  <div className="text-blue-300">Slash Commands:</div>
                  <div className="text-slate-400">"/help", "/status", "/projects"</div>
                </div>
                <div className="p-2 bg-slate-700/30 rounded border-l-2 border-green-500">
                  <div className="text-green-300">Natural Language:</div>
                  <div className="text-slate-400">"Create a new project", "Run tests"</div>
                </div>
                <div className="p-2 bg-slate-700/30 rounded border-l-2 border-purple-500">
                  <div className="text-purple-300">Wake Words:</div>
                  <div className="text-slate-400">"Hey Labnex", "Computer"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Gestures */}
      <MobileVoiceGestures 
        onDoubleTap={togglePause}
        onSwipeUp={() => setShowMobilePanel(!showMobilePanel)}
        onSwipeDown={resetVoiceSystem}
        onLongPress={toggleActiveListening}
      >
        <div className="absolute inset-0" />
      </MobileVoiceGestures>

      {/* AI Preview Panel */}
      <AIPreviewPanel 
        currentAction={currentAction}
        status={status === 'monitoring' ? 'listening' : status as "idle" | "listening" | "analyzing" | "speaking" | "paused" | "waiting" | "error"}
      />

      {/* Tutorial Modal */}
      {showTutorial && (
        <AIVoiceTutorial 
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}

      {/* Memory Panel */}
      {isDebugMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <MemoryPanel />
          <div className="mt-2 text-slate-300 text-xs text-center">{currentSuggestion}</div>
        </div>
      )}
    </div>
  );
};

export default AIVoiceMode; 