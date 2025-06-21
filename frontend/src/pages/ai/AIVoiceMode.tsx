import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MicrophoneIcon, ExclamationTriangleIcon, ArrowLeftIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { parseMultiCommand } from '../../utils/parseNLUCommand';
import { executeCommandQueue, formatCommandResult } from '../../utils/slashCommandHandler';
import { aiChatApi } from '../../api/aiChat';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useCurrentProjectId } from '../../hooks/useCurrentProjectId';
import { useMicrophone } from '../../hooks/useMicrophone';

type AIStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { speak, isSpeaking, stopSpeaking } = useOpenAITTS();
  const { voiceOutput } = useVoiceSettings();
  const { permissionError, startMicrophone, stopMicrophone, voiceActivity } = useMicrophone();
  
  const [status, setStatus] = useState<AIStatus>('idle');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currentProjectId = useCurrentProjectId();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mountedRef = useRef(true);

  const handleVoiceInput = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setStatus('processing');
    
    try {
      // Parse commands
      const parsedIntents = parseMultiCommand(transcript);
      
      if (parsedIntents.length > 0) {
        // Execute commands
        const results = await executeCommandQueue(parsedIntents, {
          currentProjectId,
          navigate: (path: string) => navigate(path),
        });
        
        const response = formatCommandResult(results[0] || { success: false, message: 'No results' });
        if (response && voiceOutput) {
          setStatus('speaking');
          speak(response);
        }
      } else {
        // Send to AI if no commands found
        const response = await aiChatApi.sendMessage(transcript);
        
        if (response?.reply && voiceOutput) {
          setStatus('speaking');
          speak(response.reply);
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage = 'Sorry, I had trouble processing that.';
      if (voiceOutput) {
        setStatus('speaking');
        speak(errorMessage);
      }
      toast.error(errorMessage);
    }
  }, [currentProjectId, navigate, voiceOutput, speak]);

  // Initialize microphone on mount
  useEffect(() => {
    const init = async () => {
      await startMicrophone();
      setIsInitialized(true);
    };
    init();
    
    return () => {
      mountedRef.current = false;
      stopMicrophone();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startMicrophone, stopMicrophone]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim();
      
      if (transcript) {
        setTranscript(transcript);
        handleVoiceInput(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setStatus('error');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
  }, [status, handleVoiceInput]);

  // Update status when TTS finishes
  useEffect(() => {
    if (!isSpeaking && status === 'speaking') {
      setStatus('idle');
    }
  }, [isSpeaking, status]);

  // Voice control functions
  const startVoice = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    stopSpeaking();
  }, [isListening, stopSpeaking]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [isListening, startVoice, stopVoice]);

  // Get status info
  const getStatusInfo = () => {
    switch (status) {
      case 'listening': 
        return {
          color: 'from-blue-500 to-cyan-500',
          shadowColor: 'shadow-blue-500/30',
          text: 'Listening...',
          description: 'Speak clearly into your microphone',
          icon: MicrophoneIcon,
          animate: 'animate-pulse scale-105'
        };
      case 'processing': 
        return {
          color: 'from-amber-400 to-orange-500',
          shadowColor: 'shadow-amber-500/30',
          text: 'Processing...',
          description: 'Understanding your request',
          icon: MicrophoneIcon,
          animate: 'animate-spin'
        };
      case 'speaking': 
        return {
          color: 'from-emerald-500 to-green-500',
          shadowColor: 'shadow-emerald-500/30',
          text: 'Speaking...',
          description: 'AI is responding',
          icon: SpeakerWaveIcon,
          animate: 'animate-bounce'
        };
      case 'error': 
        return {
          color: 'from-red-500 to-pink-500',
          shadowColor: 'shadow-red-500/30',
          text: 'Error',
          description: 'Something went wrong',
          icon: ExclamationTriangleIcon,
          animate: 'animate-pulse'
        };
      default: 
        return {
          color: 'from-slate-600 to-slate-700',
          shadowColor: 'shadow-slate-500/20',
          text: 'Ready',
          description: 'Click the button to start',
          icon: MicrophoneIcon,
          animate: 'hover:scale-105 transition-transform duration-200'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Setting up Voice Mode</h2>
          <p className="text-gray-300 text-lg">Requesting microphone access...</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show permission error if microphone access denied
  if (permissionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <ExclamationTriangleIcon className="h-20 w-20 text-red-500 mx-auto drop-shadow-lg" />
            <div className="absolute inset-0 h-20 w-20 bg-red-500/20 rounded-full animate-ping mx-auto"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Microphone Access Required</h2>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">{permissionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-3 text-white/80 hover:text-white transition-all duration-200 group"
        >
          <ArrowLeftIcon className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to AI Chat</span>
        </button>
        
        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium border border-white/20">
          Voice Mode
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
        {/* Voice Orb */}
        <div className="relative mb-12">
          {/* Outer glow rings */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${statusInfo.color} opacity-20 ${statusInfo.animate} blur-xl scale-150`}></div>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${statusInfo.color} opacity-30 ${statusInfo.animate} blur-lg scale-125`}></div>
          
          {/* Main orb */}
          <div className={`relative w-64 h-64 rounded-full bg-gradient-to-r ${statusInfo.color} flex items-center justify-center ${statusInfo.shadowColor} shadow-2xl ${statusInfo.animate} backdrop-blur-sm border border-white/20`}>
            <statusInfo.icon className="h-32 w-32 text-white drop-shadow-lg" />
            
            {/* Voice activity indicator */}
            {voiceActivity > 0 && status === 'listening' && (
              <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"></div>
            )}
          </div>

          {/* Pulse rings for listening state */}
          {status === 'listening' && (
            <>
              <div className="absolute inset-0 w-64 h-64 rounded-full border-2 border-blue-400/30 animate-ping"></div>
              <div className="absolute inset-0 w-64 h-64 rounded-full border-2 border-cyan-400/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </>
          )}
        </div>

        {/* Status Section */}
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            {statusInfo.text}
          </h1>
          <p className="text-xl text-gray-300 mb-6 leading-relaxed">
            {statusInfo.description}
          </p>
          
          {/* Transcript Display */}
          {transcript && (
            <div className="mt-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <p className="text-lg text-white font-medium italic">
                "{transcript}"
              </p>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 backdrop-blur-md rounded-xl border border-red-500/30">
              <p className="text-red-200 text-sm">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-6 mb-8">
          <button
            onClick={toggleVoice}
            className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm border ${
              isListening 
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-500/30' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500/30'
            }`}
          >
            {isListening ? (
              <div className="flex items-center gap-3">
                <StopIcon className="h-6 w-6" />
                Stop Listening
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <MicrophoneIcon className="h-6 w-6" />
                Start Listening
              </div>
            )}
          </button>
          
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-2xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm border border-orange-500/30"
            >
              <div className="flex items-center gap-3">
                <StopIcon className="h-6 w-6" />
                Stop Speaking
              </div>
            </button>
          )}
        </div>

        {/* Help Section */}
        <div className="text-center max-w-lg">
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">How to use Voice Mode</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Click "Start Listening" and speak naturally. I can help with projects, tasks, notes, and answer general questions. 
              Try saying things like "Create a new project" or "What's the weather like?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVoiceMode;