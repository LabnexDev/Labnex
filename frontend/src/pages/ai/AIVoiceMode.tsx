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
  const { speak: speakOpenAI, isSpeaking: isTTSSpeaking, stopSpeaking } = useOpenAITTS();

  // Keep voiceContext in sync with the TTS hook
  useEffect(() => {
    setIsSpeaking(isTTSSpeaking);
  }, [isTTSSpeaking]);

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
  
  const [, setDetectedCommands] = useState<VoiceCommand[]>([]);
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

  // Simplified user-facing control model
  type ListeningMode = 'push' | 'handsfree';
  const [listeningMode, setListeningMode] = useState<ListeningMode>('push');
  const [isMuted, setIsMuted] = useState(false);

  // ------------------------------------------------------------------
  // Event utilities and voice callback handlers (moved before useVoiceInput to avoid
  // "variable used before declaration" TypeScript errors)
  // ------------------------------------------------------------------

  // Timeline / debug event helper
  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  }, []);

  // Voice command processing (was previously below useVoiceInput)
  const handleVoiceResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

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
    const results = await executeCommandQueue(parsedIntents, { navigate, currentProjectId, isDebugMode });

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
  }, [navigate, currentProjectId, isDebugMode, isSmartListening, speakOpenAI, pushEvent]);

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
    state: _voiceState,
    isListening,
    error: _voiceError,
    start: startVoice,
    stop: stopVoice,
    toggle: toggleVoiceInput,
    isSupported: isVoiceSupported
  } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
    onStateChange: handleVoiceStateChange,
    enabled: listeningMode === 'handsfree' ? !isMuted : isSmartListening,
    continuous: true,
    autoRestart: listeningMode === 'handsfree',
    silenceTimeout: 2000,
    language: 'en-US',
    detectWakeWord: listeningMode === 'handsfree',
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center font-sans text-slate-100">
      <MobileVoiceGestures
        onDoubleTap={togglePause}
        onSwipeDown={resetVoiceSystem}
        onLongPress={toggleActiveListening}
      >
        <div className="flex flex-col items-center space-y-10 px-6 w-full max-w-md">
          {/* Waveform & Status */}
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className={`text-4xl font-bold ${getStatusColor()}`}>{status.toUpperCase()}</div>
            <AudioWaveform
              audioStream={audioStream}
              isActive={status === 'listening' || status === 'monitoring'}
              mode={status === 'speaking' ? 'output' : status === 'listening' || status === 'monitoring' ? 'input' : 'idle'}
              intensity={status === 'speaking' ? 0.8 : voiceActivityLevel}
            />
          </div>

          {/* Mic Button */}
          <button
            onClick={listeningMode === 'push' ? toggleVoiceInput : toggleMute}
            disabled={!isVoiceSupported}
            aria-label={listeningMode === 'push' ? (isListening ? 'Stop listening' : 'Start listening') : (isMuted ? 'Unmute' : 'Mute')}
            className={`relative p-8 rounded-full shadow-lg focus:outline-none transition-all duration-200 select-none
              ${!isVoiceSupported ? 'bg-gray-500 cursor-not-allowed' : listeningMode === 'push'
                ? isListening ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'
                : isMuted ? 'bg-slate-700 opacity-50' : 'bg-cyan-600 animate-pulse'}`}
          >
            <MicrophoneIcon className="w-10 h-10 text-white" />
            {listeningMode === 'handsfree' && !isMuted && (
              <span className="absolute -right-3 -bottom-3 text-cyan-300 text-2xl select-none">∞</span>
            )}
          </button>

          {/* Hands-free toggle */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm select-none">∞ Always listen</span>
            <button
              onClick={() => handleModeToggle(listeningMode === 'push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                listeningMode === 'handsfree' ? 'bg-cyan-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  listeningMode === 'handsfree' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </MobileVoiceGestures>
    </div>
  );
};

export default AIVoiceMode; 