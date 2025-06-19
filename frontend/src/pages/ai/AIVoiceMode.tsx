import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PauseIcon, PlayIcon, XMarkIcon, MicrophoneIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import VoiceStatusTimeline, { type TimelineEvent, type TimelineEventState } from '../../components/ai-chat/VoiceStatusTimeline';
import AudioWaveform from '../../components/ai-chat/AudioWaveform';
import AIPreviewPanel from '../../components/ai-chat/AIPreviewPanel';
import MobileVoiceGestures from '../../components/ai-chat/MobileVoiceGestures';
import AIVoiceTutorial from '../../components/onboarding/AIVoiceTutorial';
import { aiChatApi } from '../../api/aiChat';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type AIStatus = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'paused' | 'waiting';

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { pageContext, setPageContext } = useAIChat();
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const initializedRef = useRef(false);
  const welcomeSpokenRef = useRef(false);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadDataArrayRef = useRef<Uint8Array | null>(null);
  const lastVoiceActivityRef = useRef<number>(0);
  const isManuallyPausedRef = useRef(false);

  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<AIStatus>('idle');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentAction, setCurrentAction] = useState('Initializing...');
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [aiSpeechIntensity, setAiSpeechIntensity] = useState(0);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [isSmartListening, setIsSmartListening] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user has seen the voice tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('labnex_ai_voice_tutorial_completed');
    if (!hasSeenTutorial) {
      // Show tutorial after a delay to let the page load
      const timer = setTimeout(() => setShowTutorial(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const { speak: speakOpenAI, isSpeaking } = useOpenAITTS();

  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state }, ...prev]);
  }, []);



  // Voice Activity Detection (VAD) system
  const detectVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !vadDataArrayRef.current || isSpeaking || status === 'speaking' || status === 'analyzing') {
      return false;
    }

    try {
      analyserRef.current.getByteFrequencyData(vadDataArrayRef.current);

      // Calculate average volume across frequency bins with noise filtering
      const frequencyData = Array.from(vadDataArrayRef.current);
      
      // Focus on human voice frequency range (85-255 Hz mapped to array indices)
      const voiceRange = frequencyData.slice(Math.floor(frequencyData.length * 0.1), Math.floor(frequencyData.length * 0.6));
      const voiceSum = voiceRange.reduce((a, b) => a + b, 0);
      const voiceAverage = voiceSum / voiceRange.length;
      
      // Calculate overall average for comparison
      const totalSum = frequencyData.reduce((a, b) => a + b, 0);
      const totalAverage = totalSum / frequencyData.length;
      
      const normalizedLevel = Math.max(voiceAverage, totalAverage) / 255;
      setVoiceActivityLevel(normalizedLevel);

      // Adaptive threshold with noise floor detection
      const baseThreshold = 0.05; // Increased from 0.03 for better noise rejection
      const voiceThreshold = Math.max(baseThreshold, totalAverage / 255 * 2); // Dynamic noise floor
      
      return normalizedLevel > voiceThreshold && voiceAverage > totalAverage * 1.2; // Voice must be significantly louder than background
    } catch (error) {
      console.warn('VAD detection error:', error);
      return false;
    }
  }, [isSpeaking, status]);

  // Smart listening management
  const startSmartListening = useCallback(() => {
    if (!isSmartListening || isSpeaking || status === 'speaking' || status === 'analyzing' || isManuallyPausedRef.current) {
      return;
    }

    if (recognitionRef.current && status !== 'listening') {
      try {
        recognitionRef.current.start();
        setStatus('listening');
        setCurrentAction('Smart listening activated - speak naturally');
        pushEvent('Smart Listening Active', 'listening');
              } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            if (process.env.NODE_ENV === 'development') {
              console.error('Start recognition error:', e);
            }
            // Handle specific recognition errors
            if (e.name === 'NotAllowedError') {
              setCurrentAction('Microphone access denied');
              pushEvent('Microphone Access Denied', 'error');
            }
          }
        }
    }
  }, [isSmartListening, isSpeaking, status, pushEvent]);

  const stopSmartListening = useCallback(() => {
    if (recognitionRef.current && status === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Stop recognition error:', e);
        }
      }
      setStatus('waiting');
      setCurrentAction('Waiting for voice activity...');
    }
  }, [status]);

  // Enhanced Voice Activity Detection loop with state management
  const vadLoop = useCallback(() => {
    if (!isSmartListening || !audioStreamRef.current || isManuallyPausedRef.current) {
      return;
    }

    try {
      const hasVoiceActivity = detectVoiceActivity();
      const now = Date.now();

      if (hasVoiceActivity) {
        lastVoiceActivityRef.current = now;
        
        // Start listening if we detect voice and we're not already listening/processing
        if ((status === 'waiting' || status === 'idle') && !isSpeaking) {
          startSmartListening();
        }
        
        // Clear any pending silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else if (status === 'listening' && !isSpeaking) {
        // If we're listening but no voice activity for a while, go to waiting mode
        const silenceDuration = now - lastVoiceActivityRef.current;
        
        if (silenceDuration > 3000 && !silenceTimeoutRef.current) { // Increased to 3 seconds for better stability
          silenceTimeoutRef.current = setTimeout(() => {
            // Double-check conditions before stopping
            if (status === 'listening' && !isSpeaking && isSmartListening && !isManuallyPausedRef.current) {
              stopSmartListening();
              setCurrentAction('No voice detected - waiting...');
              pushEvent('Silence Detected', 'idle');
            }
            silenceTimeoutRef.current = null;
          }, 1500); // Additional 1.5 second buffer
        }
      }

      // Schedule next VAD check with error recovery
      if (isSmartListening && !isManuallyPausedRef.current) {
        if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = setTimeout(vadLoop, 150); // Slightly slower for better performance
      }
    } catch (error) {
      console.error('VAD loop error:', error);
      // Retry after longer delay on error
      if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = setTimeout(vadLoop, 1000);
    }
  }, [isSmartListening, detectVoiceActivity, status, startSmartListening, stopSmartListening, isSpeaking, pushEvent]);

  // Initialize Voice Activity Detection with proper error handling
  const initializeVAD = useCallback(async () => {
    if (!audioStreamRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      audioContextRef.current = new AudioContextClass({
        sampleRate: 44100, // Standard sample rate for better voice detection
        latencyHint: 'interactive' // Lower latency for real-time detection
      });

      // Ensure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Optimized settings for voice activity detection
      analyserRef.current.fftSize = 512; // Higher resolution for better frequency analysis
      analyserRef.current.smoothingTimeConstant = 0.2; // More responsive for VAD
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      source.connect(analyserRef.current);
      vadDataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      // Initialize voice activity detection
      lastVoiceActivityRef.current = Date.now();
      
      // Start VAD loop only if smart listening is enabled
      if (isSmartListening) {
        vadLoop();
      }
      
      pushEvent('Voice Detection Ready', 'listening');
      setCurrentAction('Voice activity detection initialized');
      
    } catch (error) {
      console.error('Error setting up VAD:', error);
      setIsSmartListening(false);
      setCurrentAction('Voice detection failed - manual mode only');
      pushEvent('VAD Setup Failed', 'error');
      
      // Fallback to manual mode
      toast.error('Smart listening unavailable. Using manual mode.');
    }
  }, [vadLoop, pushEvent, isSmartListening]);

  // AI Speech Intensity Effect for waveform visualization
  useEffect(() => {
    if (!isSpeaking) {
      setAiSpeechIntensity(0);
      return;
    }

    // Simulate AI speech intensity with randomized patterns
    const intensityInterval = setInterval(() => {
      // Generate more realistic speech intensity patterns
      const baseIntensity = 0.3 + Math.random() * 0.4; // 0.3-0.7 base
      const speechPattern = Math.sin(Date.now() * 0.01) * 0.3; // Sinusoidal variation
      const randomSpike = Math.random() > 0.8 ? Math.random() * 0.3 : 0; // Occasional spikes
      
      const finalIntensity = Math.min(1, Math.max(0, baseIntensity + speechPattern + randomSpike));
      setAiSpeechIntensity(finalIntensity);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(intensityInterval);
  }, [isSpeaking]);

  // Enhanced stop listening with smart mode awareness
  const stopListening = useCallback(() => {
    isManuallyPausedRef.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear VAD timeouts
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    setStatus('paused');
    setCurrentAction('Voice recognition manually paused');
    pushEvent('Manually Paused', 'idle');
  }, [pushEvent]);

  // Enhanced start listening with smart mode
  const startListening = useCallback(() => {
    isManuallyPausedRef.current = false;
    
    if (isSmartListening) {
      setStatus('waiting');
      setCurrentAction('Smart listening enabled - speak naturally');
      pushEvent('Smart Mode Enabled', 'listening');
      vadLoop(); // Restart VAD loop
    } else {
      // Manual mode - start immediately
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setStatus('listening');
        setCurrentAction('Listening for your voice...');
        pushEvent('Manual Listening...', 'listening');
      }
    }
  }, [isSmartListening, vadLoop, pushEvent]);

  const speakAndThen = useCallback(async (text: string, onEnd?: () => void) => {
    // Stop all listening activity when AI starts speaking
    if (recognitionRef.current && status === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition before speaking:', e);
      }
    }
    
    // Clear VAD timeouts to prevent interference
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    setStatus('speaking');
    setCurrentAction('AI responding...');
    pushEvent('AI Speaking', 'executing');
    
    await speakOpenAI(text, () => {
      // After AI finishes speaking, resume smart listening
      if (!isManuallyPausedRef.current) {
        setTimeout(() => {
          if (isSmartListening) {
            setStatus('waiting');
            setCurrentAction('Waiting for your voice...');
            pushEvent('Ready for Input', 'listening');
            vadLoop(); // Resume VAD after AI speech
          } else {
            startListening(); // Manual mode - start immediately
          }
        }, 500); // Brief pause after AI speech
      }
      
      if (onEnd) onEnd();
    });
  }, [status, pushEvent, speakOpenAI, isSmartListening, vadLoop, startListening]);

  const handleFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isSpeaking || status === 'analyzing') return;

    setTranscript('');
    setCurrentAction(`Processing: "${text}"`);
    pushEvent(`You: "${text}"`, 'transcribing');
    
    const lower = text.toLowerCase().trim();

    // Handle voice mode control commands first
    if (lower === 'exit' || lower === 'close voice' || lower === 'goodbye') {
      setCurrentAction('Ending voice session...');
      speakAndThen('Goodbye! Thanks for using AI Voice Call.', () => navigate(-1));
      return;
    }

    if (lower === 'pause' || lower === 'pause listening') {
      stopListening();
      return;
    }

    if (lower === 'resume' || lower === 'resume listening') {
      startListening();
      return;
    }

    if (lower.includes('smart mode') || lower.includes('automatic listening')) {
      setIsSmartListening(true);
      setCurrentAction('Smart listening mode enabled');
      pushEvent('Smart Mode Enabled', 'listening');
      speakAndThen('Smart listening mode enabled', () => {
        setCurrentAction('Smart listening active');
        vadLoop();
      });
      return;
    }

    if (lower.includes('manual mode') || lower.includes('tap to talk')) {
      setIsSmartListening(false);
      setCurrentAction('Manual listening mode enabled');
      pushEvent('Manual Mode Enabled', 'idle');
      speakAndThen('Manual mode enabled. Tap the orb to speak.', () => {
        setCurrentAction('Manual mode - tap to talk');
        stopListening();
      });
      return;
    }

    // Handle structured voice commands with NLU patterns
    if (await processVoiceCommand(text)) {
      return; // Command was handled
    }
    
    setStatus('analyzing');
    setCurrentAction('Analyzing your request...');
    pushEvent('Analyzing...', 'analyzing');

    try {
      const { reply } = await aiChatApi.sendMessage(text, pageContext);
      if (reply) {
        setCurrentAction('Generating response...');
        speakAndThen(reply, () => {
            setCurrentAction('Ready for next command');
        });
      } else {
        setCurrentAction('No response received');
        setStatus('idle');
        setTimeout(() => startListening(), 1000);
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = 'I apologize, but I encountered a connection issue. Please try again.';
      setCurrentAction('Connection error occurred');
      speakAndThen(errorMsg, () => {
        setCurrentAction('Ready - please try again');
      });
    }
  }, [isSpeaking, status, pushEvent, speakAndThen, stopListening, startListening, navigate, pageContext]);

  // Enhanced voice command processor with NLU patterns
  const processVoiceCommand = useCallback(async (text: string): Promise<boolean> => {
    const lower = text.toLowerCase().trim();
    
    try {
      // Project commands
      if (lower.includes('create project') || lower.includes('new project') || lower.includes('make project')) {
        setStatus('analyzing');
        setCurrentAction('Creating new project...');
        pushEvent('Creating Project', 'analyzing');
        
        // Extract project name from voice command
        const projectMatch = text.match(/(?:create|new|make)\s+(?:a\s+)?project\s+(?:called\s+|named\s+)?['"]?([^'"]+?)['"]?(?:\s+|$)/i);
        const projectName = projectMatch ? projectMatch[1].trim() : null;
        
        if (projectName) {
          const { reply } = await aiChatApi.sendMessage(`Create a new project called "${projectName}"`, pageContext);
          speakAndThen(reply || 'Project creation started', () => {
            setCurrentAction('Ready for next command');
          });
        } else {
          speakAndThen('What would you like to name your project?', () => {
            setCurrentAction('Waiting for project name...');
          });
        }
        return true;
      }

      // Task commands
      if (lower.includes('create task') || lower.includes('new task') || lower.includes('add task')) {
        setStatus('analyzing');
        setCurrentAction('Creating new task...');
        pushEvent('Creating Task', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'Task creation started', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Note commands
      if (lower.includes('create note') || lower.includes('new note') || lower.includes('add note') ||
          lower.includes('make note') || lower.includes('take note')) {
        setStatus('analyzing');
        setCurrentAction('Creating note...');
        pushEvent('Creating Note', 'analyzing');
        
        // Extract note content
        const noteMatch = text.match(/(?:create|new|add|make|take)\s+(?:a\s+)?note\s+(?:about\s+|saying\s+)?['"]?(.+?)['"]?$/i);
        const noteContent = noteMatch ? noteMatch[1].trim() : text;
        
        const { reply } = await aiChatApi.sendMessage(`Create a note: ${noteContent}`, pageContext);
        speakAndThen(reply || 'Note created successfully', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // List commands
      if (lower.includes('list projects') || lower.includes('show projects') || lower.includes('my projects')) {
        setStatus('analyzing');
        setCurrentAction('Fetching your projects...');
        pushEvent('Listing Projects', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage('List my projects', pageContext);
        speakAndThen(reply || 'Here are your projects', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      if (lower.includes('list tasks') || lower.includes('show tasks') || lower.includes('my tasks')) {
        setStatus('analyzing');
        setCurrentAction('Fetching your tasks...');
        pushEvent('Listing Tasks', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage('List my tasks', pageContext);
        speakAndThen(reply || 'Here are your tasks', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      if (lower.includes('list notes') || lower.includes('show notes') || lower.includes('my notes')) {
        setStatus('analyzing');
        setCurrentAction('Fetching your notes...');
        pushEvent('Listing Notes', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage('List my notes', pageContext);
        speakAndThen(reply || 'Here are your notes', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      if (lower.includes('list snippets') || lower.includes('show snippets') || lower.includes('my snippets')) {
        setStatus('analyzing');
        setCurrentAction('Fetching your code snippets...');
        pushEvent('Listing Snippets', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage('List my code snippets', pageContext);
        speakAndThen(reply || 'Here are your code snippets', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Snippet commands
      if (lower.includes('create snippet') || lower.includes('new snippet') || lower.includes('add snippet')) {
        setStatus('analyzing');
        setCurrentAction('Creating code snippet...');
        pushEvent('Creating Snippet', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'Code snippet creation started', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Status update commands
      if (lower.includes('mark task') || lower.includes('update task') || lower.includes('task status')) {
        setStatus('analyzing');
        setCurrentAction('Updating task status...');
        pushEvent('Updating Task', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'Task status updated', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Test case commands
      if (lower.includes('create test') || lower.includes('new test') || lower.includes('add test') ||
          lower.includes('test case')) {
        setStatus('analyzing');
        setCurrentAction('Creating test case...');
        pushEvent('Creating Test Case', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'Test case creation started', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Project details command
      if (lower.includes('show project') || lower.includes('project details') || lower.includes('project info')) {
        setStatus('analyzing');
        setCurrentAction('Fetching project details...');
        pushEvent('Getting Project Details', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'Here are the project details', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Code assistance commands
      if (lower.includes('help with code') || lower.includes('fix code') || lower.includes('review code') ||
          lower.includes('code help')) {
        setStatus('analyzing');
        setCurrentAction('Analyzing code...');
        pushEvent('Code Assistance', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'I can help with code. Please provide the code you need help with.', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // General assistance patterns
      if (lower.includes('how do i') || lower.includes('how to') || lower.includes('can you help')) {
        setStatus('analyzing');
        setCurrentAction('Providing assistance...');
        pushEvent('General Help', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage(text, pageContext);
        speakAndThen(reply || 'I\'d be happy to help you with that.', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Help and information commands
      if (lower.includes('help') || lower.includes('what can you do') || lower.includes('commands')) {
        setStatus('analyzing');
        setCurrentAction('Getting help information...');
        pushEvent('Help Request', 'analyzing');
        
        const helpText = `I can help you with voice commands. You can say:
          - Create project called "project name"
          - Create task for "task description"  
          - Create note about "your note"
          - List my projects, tasks, notes, or snippets
          - Create code snippet
          - Summarize my work
          - Switch to smart mode or manual mode
          - Pause or resume listening
          - Exit or goodbye to end the session`;
        
        speakAndThen(helpText, () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Summarize command
      if (lower.includes('summarize') || lower.includes('summary') || lower.includes('overview')) {
        setStatus('analyzing');
        setCurrentAction('Generating summary...');
        pushEvent('Creating Summary', 'analyzing');
        
        const { reply } = await aiChatApi.sendMessage('Summarize my current project activity and provide key insights', pageContext);
        speakAndThen(reply || 'Here is your summary', () => {
          setCurrentAction('Ready for next command');
        });
        return true;
      }

      // Navigation commands
      if (lower.includes('open chat') || lower.includes('go to chat') || lower.includes('switch to chat')) {
        setCurrentAction('Opening chat mode...');
        speakAndThen('Switching to chat mode', () => {
          navigate('/ai');
        });
        return true;
      }

      if (lower.includes('open dashboard') || lower.includes('go to dashboard')) {
        setCurrentAction('Opening dashboard...');
        speakAndThen('Opening dashboard', () => {
          navigate('/dashboard');
        });
        return true;
      }

      return false; // Command not recognized
    } catch (error) {
      console.error('Voice command processing error:', error);
      speakAndThen('Sorry, I had trouble processing that command. Please try again.', () => {
        setCurrentAction('Ready for next command');
      });
      return true; // Consider it handled to prevent further processing
    }
  }, [aiChatApi, pageContext, navigate, speakAndThen, pushEvent, vadLoop, stopListening, setStatus, setCurrentAction]);

  // Add voice feedback for better user experience
  const provideVoiceFeedback = useCallback((action: string) => {
    const feedbackMessages = {
      'listening': 'I\'m listening...',
      'analyzing': 'Let me process that...',
      'creating': 'Creating that for you...',
      'fetching': 'Getting that information...',
      'error': 'Something went wrong, please try again.',
      'success': 'Done!',
      'waiting': 'Waiting for your voice...'
    };
    
    const message = feedbackMessages[action as keyof typeof feedbackMessages] || 'Processing...';
    return message;
  }, []);





  // Main initialization effect - only run once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    setPageContext({ ...pageContext, voiceMode: true });
    
    const init = async () => {
        try {
            setCurrentAction('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 1
              }
            });
            audioStreamRef.current = stream;
            setAudioStream(stream);
            setCurrentAction('Microphone access granted');
            pushEvent('Microphone Access Granted', 'idle');
        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            
            // Handle different error types with specific messaging
            if (err.name === 'NotAllowedError') {
                setCurrentAction('Microphone access denied');
                toast.error('Microphone access denied. Please enable microphone permissions and refresh.');
                pushEvent('Microphone Access Denied', 'error');
            } else if (err.name === 'NotFoundError') {
                setCurrentAction('No microphone found');
                toast.error('No microphone found. Please connect a microphone and refresh.');
                pushEvent('No Microphone Found', 'error');
            } else {
                setCurrentAction('Microphone access failed');
                toast.error('Unable to access microphone. Please check your audio settings.');
                pushEvent('Microphone Access Failed', 'error');
            }
            
            // Disable smart listening on microphone failure
            setIsSmartListening(false);
            navigate(-1);
            return;
        }

        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            setCurrentAction('Speech recognition not supported');
            toast.error('Speech recognition not supported in this browser.');
            navigate(-1);
            return;
        }

        setCurrentAction('Initializing speech recognition...');
        const recog = new SpeechRecognitionCtor();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (e: any) => {
            if (isSpeaking) return;
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i];
                if (res.isFinal) {
                    handleFinalTranscript(res[0].transcript.trim());
                } else {
                    interim += res[0].transcript;
                }
            }
            setTranscript(interim);
            if (interim) {
                setCurrentAction(`Transcribing: "${interim.slice(0, 30)}${interim.length > 30 ? '...' : ''}"`);
            }
        };

        recog.onerror = (err: any) => {
            console.error('Speech recognition error:', err);
            if (err.error === 'no-speech' || err.error === 'audio-capture') {
                // Ignore this, it's common
            } else {
                setCurrentAction(`Recognition error: ${err.error}`);
                pushEvent('Recognition Error', 'error');
            }
        };

        recog.onend = () => {
            // Handle recognition end based on current mode with better state management
            if (isSpeaking || status === 'analyzing' || isManuallyPausedRef.current) {
              return; // Don't restart if AI is processing or manually paused
            }

            if (isSmartListening) {
              // In smart mode, transition to waiting and let VAD handle restart
              if (status === 'listening') {
                setStatus('waiting');
                setCurrentAction('Waiting for voice activity...');
                // Ensure VAD loop is running
                if (!vadTimeoutRef.current) {
                  vadLoop();
                }
              }
            } else if (!isSmartListening && status === 'listening') {
              // In manual mode, restart immediately with proper error handling
              setTimeout(() => {
                if (recognitionRef.current && status === 'listening' && !isSpeaking && !isManuallyPausedRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e: any) {
                    if (e.name === 'InvalidStateError') {
                      console.log('Recognition already running, ignoring restart');
                    } else {
                      console.error('Restart recognition failed:', e);
                      setCurrentAction('Recognition restart failed');
                      pushEvent('Recognition Restart Failed', 'error');
                    }
                  }
                }
              }, 200); // Slightly longer delay for better stability
            }
        };
        
        recognitionRef.current = recog;

        // Initialize Voice Activity Detection
        await initializeVAD();

        // Only speak welcome message once
        if (!welcomeSpokenRef.current) {
          welcomeSpokenRef.current = true;
          setTimeout(() => {
            speakAndThen('Welcome to AI Voice Call with smart listening. I can hear you automatically when you speak. How can I help you today?', () => {
                setCurrentAction('Smart listening ready - just speak naturally');
                if (isSmartListening) {
                  setStatus('waiting');
                  vadLoop();
                } else {
                  startListening();
                }
            });
          }, 500);
        }
    };

    init();

    return () => {
        // Cleanup all timeouts
        if (vadTimeoutRef.current) {
          clearTimeout(vadTimeoutRef.current);
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []); // Only run once on mount

  // Separate effect to handle speech recognition events when dependencies change
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recog = recognitionRef.current;
    
    recog.onresult = (e: any) => {
        if (isSpeaking || status === 'analyzing') return;
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) {
                handleFinalTranscript(res[0].transcript.trim());
            } else {
                interim += res[0].transcript;
            }
        }
        setTranscript(interim);
        if (interim) {
            setCurrentAction(`Transcribing: "${interim.slice(0, 30)}${interim.length > 30 ? '...' : ''}"`);
        }
    };
  }, [isSpeaking, status, handleFinalTranscript]);

  const togglePause = () => {
    if (status === 'listening' || status === 'waiting') {
      stopListening();
    } else if (status === 'paused' || status === 'idle') {
      startListening();
    }
  };

  const toggleSmartMode = () => {
    setIsSmartListening(!isSmartListening);
    if (!isSmartListening) {
      // Switching to smart mode
      setCurrentAction('Smart listening enabled');
      pushEvent('Smart Mode Enabled', 'listening');
      if (status === 'paused') {
        startListening();
      } else {
        vadLoop();
      }
    } else {
      // Switching to manual mode
      setCurrentAction('Manual mode enabled - tap to talk');
      pushEvent('Manual Mode Enabled', 'idle');
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = null;
      }
      stopListening();
    }
  };

  // Enhanced orb handling for mobile
  const handleOrbTap = () => {
    if (isSmartListening) {
      toggleSmartMode(); // Toggle between smart and manual mode
    } else {
      // Manual mode - toggle listening
      if (status === 'paused' || status === 'idle') {
        startListening();
      } else if (status === 'listening') {
        stopListening();
      }
    }
  };

  const getOrbClass = () => {
    const baseClasses = 'w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-full transition-all duration-700 ease-in-out shadow-2xl cursor-pointer active:scale-95';
    
    switch(status) {
        case 'listening': 
          return `${baseClasses} animate-pulse scale-105 sm:scale-110 shadow-purple-400/50 ring-4 ring-purple-400/30`;
        case 'waiting':
          return `${baseClasses} scale-100 sm:scale-105 shadow-green-400/50 ring-2 ring-green-400/30 animate-bounce`;
        case 'analyzing': 
          return `${baseClasses} scale-100 sm:scale-105 shadow-indigo-400/50`;
        case 'speaking': 
          return `${baseClasses} scale-105 sm:scale-110 shadow-purple-500/60`;
        case 'paused':
          return `${baseClasses} scale-90 sm:scale-95 opacity-75 shadow-slate-400/30`;
        case 'idle':
        default:
            return `${baseClasses} scale-95 sm:scale-100 shadow-purple-500/30 hover:scale-100 sm:hover:scale-105`;
    }
  };
  
  const getMicStatusText = () => {
    switch(status) {
        case 'listening': return 'Listening';
        case 'waiting': return isSmartListening ? 'Smart Listening Ready' : 'Waiting';
        case 'analyzing': return 'Analyzing';
        case 'speaking': return 'AI Speaking';
        case 'paused': return 'Paused';
        case 'idle': return 'Ready';
        default: return 'Connecting...';
    }
  };

  const getOrbGlowStyle = () => {
    if (status === 'speaking') {
      return {
        animation: 'glow 1.5s infinite alternate, pulse-glow 2s infinite',
        filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))',
      } as React.CSSProperties;
    }
    if (status === 'listening') {
      return {
        filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
      } as React.CSSProperties;
    }
    if (status === 'waiting') {
      return {
        filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))',
      } as React.CSSProperties;
    }
    return {};
  };



  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Enhanced Mobile Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-md z-20 border-b border-slate-700/30 safe-area-top">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full animate-pulse flex-shrink-0 ${
            isSmartListening ? 'bg-emerald-400' : 'bg-yellow-400'
          }`}></div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent truncate">
            AI Voice Call {isSmartListening ? '(Smart)' : '(Manual)'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Help Button */}
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 sm:p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm border border-slate-600/30 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Show voice mode tutorial"
          >
            <span className="text-xs font-bold text-slate-300">?</span>
          </button>

          {/* Smart Mode Toggle */}
          <button
            onClick={toggleSmartMode}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 backdrop-blur-sm border min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isSmartListening 
                ? 'bg-emerald-600/50 border-emerald-500/30 text-emerald-300' 
                : 'bg-yellow-600/50 border-yellow-500/30 text-yellow-300'
            }`}
            title={isSmartListening ? 'Smart Mode: Auto-detects voice' : 'Manual Mode: Tap to talk'}
          >
            <span className="text-xs font-bold">
              {isSmartListening ? 'AUTO' : 'TAP'}
            </span>
          </button>

          {/* Mobile Info Button */}
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="lg:hidden p-2 sm:p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm border border-slate-600/30"
            title="Show Details"
          >
            <Bars3Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          {/* Pause/Resume Button */}
          <button 
            onClick={togglePause} 
            className="p-2 sm:p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm border border-slate-600/30 min-w-[44px] min-h-[44px] flex items-center justify-center" 
            title={status === 'listening' || status === 'waiting' ? 'Pause' : 'Resume'}
          >
            {(status === 'listening' || status === 'waiting') ? <PauseIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
          
          {/* Exit Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 sm:p-3 rounded-full bg-red-900/30 hover:bg-red-800/40 transition-all duration-200 backdrop-blur-sm border border-red-600/30 min-w-[44px] min-h-[44px] flex items-center justify-center" 
            title="Exit"
          >
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
          </button>
        </div>
      </header>

      {/* Mobile Info Panel */}
      {showMobilePanel && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 z-10 p-4 max-h-[40vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Current Status</h3>
              <AIPreviewPanel currentAction={currentAction} status={status} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Voice Activity Level</h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100"
                      style={{ width: `${Math.min(voiceActivityLevel * 100 * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {(voiceActivityLevel * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Recent Activity</h3>
              <VoiceStatusTimeline events={events.slice(0, 4)} compact={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="h-full grid lg:grid-cols-4 grid-cols-1">
          {/* Desktop Sidebar - Timeline */}
          <div className="hidden lg:flex lg:flex-col justify-center h-full p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Activity Timeline</h3>
              <VoiceStatusTimeline events={events} />
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Voice Activity</h3>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100"
                      style={{ width: `${Math.min(voiceActivityLevel * 100 * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {isSmartListening ? 'Smart listening active' : 'Manual mode'} • Level: {(voiceActivityLevel * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Center: Main Interaction Area */}
          <div className="lg:col-span-2 relative flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
            <MobileVoiceGestures
              onSwipeUp={() => setShowMobilePanel(!showMobilePanel)}
              onSwipeDown={() => setShowMobilePanel(false)}
              onDoubleTap={handleOrbTap}
              onLongPress={() => navigate(-1)}
              isActive={!showMobilePanel}
            >
            {/* Orb Container */}
            <div className="relative flex items-center justify-center mb-6 sm:mb-8">
              {/* Waveform Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                  <AudioWaveform 
                    audioStream={audioStream} 
                    isActive={status === 'listening' || status === 'speaking' || status === 'waiting' || status === 'idle'}
                    mode={
                      status === 'listening' ? 'input' :
                      status === 'speaking' ? 'output' :
                      status === 'waiting' ? 'input' :
                      'idle'
                    }
                    intensity={status === 'speaking' ? aiSpeechIntensity : (status === 'waiting' ? voiceActivityLevel * 2 : 0)}
                  />
                </div>
              </div>
              
              {/* Interactive Orb */}
              <div className="relative">
                <div 
                  className={getOrbClass()}
                  style={getOrbGlowStyle()}
                  onClick={handleOrbTap}
                          role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOrbTap();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            if (status === 'listening') {
              stopListening();
            }
          }
        }}
        aria-label={
                    isSmartListening 
                      ? 'Tap to switch to manual mode' 
                      : status === 'listening' 
                        ? 'Tap to pause listening' 
                        : 'Tap to start listening'
                  }
                >
                  {/* Inner gradient overlay */}
                  <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full pointer-events-none"></div>
                  
                  {/* Microphone Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MicrophoneIcon 
                      className={`h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 text-white/90 transition-all duration-500 pointer-events-none ${
                        status === 'listening' ? 'scale-110 text-white' : 
                        status === 'waiting' ? 'scale-105 text-green-300' : ''
                      } ${status === 'speaking' ? 'scale-105 animate-pulse' : ''}`} 
                    />
                  </div>
                </div>
                
                {/* Progress ring for analyzing state */}
                {status === 'analyzing' && (
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin pointer-events-none"></div>
                )}
              </div>
            </div>
            
            {/* Transcript Display */}
            <div className="w-full max-w-2xl text-center mb-6 min-h-[3rem] flex items-center justify-center">
              {transcript && (
                <div className="bg-slate-800/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-600/30 max-w-full">
                  <p className="text-base sm:text-lg text-slate-200 font-medium break-words">
                    "{transcript}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="text-center space-y-3 px-4">
              <p className="text-sm sm:text-base text-slate-400">
                {status === 'listening' ? '🎤 Listening for your voice...' : 
                 status === 'waiting' ? '👂 Smart listening ready - just speak naturally' :
                 status === 'speaking' ? '🔊 AI is responding...' : 
                 status === 'analyzing' ? '🧠 Processing your request...' :
                 status === 'paused' ? '⏸️ Voice recognition paused' :
                 isSmartListening ? '🤖 Smart listening enabled - speak anytime' : '💬 Tap the orb to start voice conversation'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-slate-500">
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Say "exit" to leave</span>
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Say "pause" to stop</span>
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Say "smart mode" to toggle</span>
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Long press to exit</span>
              </div>
            </div>
            </MobileVoiceGestures>
          </div>

          {/* Desktop Sidebar - AI Preview */}
          <div className="hidden lg:flex lg:flex-col justify-start h-full p-6">
            <AIPreviewPanel currentAction={currentAction} status={status} />
          </div>
        </div>
      </main>
      
      {/* Enhanced Mobile Footer */}
      <footer className="p-3 sm:p-4 bg-black/20 backdrop-blur-md border-t border-slate-700/30 safe-area-bottom">
        <div className="flex items-center justify-center gap-3">
          <span className={`h-3 w-3 rounded-full transition-all duration-300 ${
            status === 'listening' ? 'bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50' : 
            status === 'waiting' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' :
            status === 'speaking' ? 'bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50' :
            status === 'analyzing' ? 'bg-blue-400 animate-spin' :
            'bg-yellow-400'
          }`}></span>
          <span className="font-medium text-slate-300 text-sm sm:text-base">{getMicStatusText()}</span>
          
          {/* Status emoji for mobile */}
          <span className="text-sm">
            {status === 'listening' && '🎤'}
            {status === 'waiting' && '👂'}
            {status === 'speaking' && '🔊'}
            {status === 'analyzing' && '🧠'}
            {status === 'paused' && '⏸️'}
            {status === 'idle' && '💤'}
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes glow {
          from { 
            box-shadow: 0 0 20px -5px rgba(168, 85, 247, 0.4), 0 0 40px -10px rgba(168, 85, 247, 0.2);
          }
          to { 
            box-shadow: 0 0 30px 5px rgba(168, 85, 247, 0.6), 0 0 60px 0px rgba(168, 85, 247, 0.3);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.05);
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        /* Safe area support for mobile devices */
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        
        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }

        /* Touch improvements */
        @media (hover: none) and (pointer: coarse) {
          button:hover {
            background-color: inherit;
          }
          
          button:active {
            transform: scale(0.95);
          }
        }

        /* Mobile Safari compatibility */
        @supports (-webkit-appearance: none) {
          .safe-area-top {
            padding-top: max(0.75rem, env(safe-area-inset-top));
          }
          
          .safe-area-bottom {
            padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
          }
        }

        /* Prevent text selection on mobile */
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        /* Smooth scrolling for mobile */
        @media (max-width: 768px) {
          html {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      {/* Tutorial Component */}
      {showTutorial && (
        <AIVoiceTutorial
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
};

export default AIVoiceMode; 