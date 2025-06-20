import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PauseIcon, PlayIcon, XMarkIcon, MicrophoneIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
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
  const { speak: speakOpenAI, isSpeaking: isTTSSpeaking } = useOpenAITTS();

  // State management
  const [status, setStatus] = useState<AIStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentAction, setCurrentAction] = useState<string>('Starting voice mode...');
  const [isSmartListening, setIsSmartListening] = useState(true);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Refs for managing voice recognition and audio processing
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const vadDataArrayRef = useRef<Uint8Array | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVoiceActivityRef = useRef<number>(Date.now());
  const isManuallyPausedRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  const welcomeSpokenRef = useRef<boolean>(false);

  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state }, ...prev]);
  }, []);

  const vadLoop = useCallback(() => {
    if (!analyserRef.current || !vadDataArrayRef.current || status !== 'listening') return;

    analyserRef.current.getByteFrequencyData(vadDataArrayRef.current);
    const average = vadDataArrayRef.current.reduce((sum, value) => sum + value, 0) / vadDataArrayRef.current.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setVoiceActivityLevel(normalizedLevel);

    const VOICE_THRESHOLD = 0.1;
    const SILENCE_TIMEOUT = 2000;

    if (normalizedLevel > VOICE_THRESHOLD) {
      lastVoiceActivityRef.current = Date.now();
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      if (!silenceTimeoutRef.current && isSmartListening) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastVoiceActivityRef.current > SILENCE_TIMEOUT) {
            setStatus('waiting');
            pushEvent('Waiting for voice input', 'waiting');
          }
        }, SILENCE_TIMEOUT);
      }
    }

    vadTimeoutRef.current = setTimeout(vadLoop, 100);
  }, [status, isSmartListening, pushEvent]);

  const startListening = useCallback(async () => {
    try {
      if (!audioStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setAudioStream(stream);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        vadDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setStatus('listening');
        setCurrentAction('Listening for your voice...');
        pushEvent('Started listening', 'listening');
        isManuallyPausedRef.current = false;
        vadLoop();
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast.error('Failed to start voice recognition');
      handleMicrophoneError();
    }
  }, [vadLoop, pushEvent]);

  const stopListening = useCallback(() => {
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
  }, [pushEvent]);

  const handleFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isTTSSpeaking) return;

    setTranscript('');
    setStatus('analyzing');
    setCurrentAction('Processing your request...');
    pushEvent(`You said: "${text}"`, 'transcribing');

    try {
      const response = await aiChatApi.sendMessage(text);
      
      if (response.reply) {
        setStatus('speaking');
        setCurrentAction('AI is responding...');
        pushEvent('AI responding', 'executing');
        
        await speakOpenAI(response.reply);
        
        setStatus('waiting');
        setCurrentAction('Listening for your next input...');
        pushEvent('Ready for next input', 'waiting');
        
        if (!isManuallyPausedRef.current && isSmartListening) {
          setTimeout(() => {
            if (!isManuallyPausedRef.current) {
              startListening();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process your request');
      setStatus('idle');
      setCurrentAction('Ready to start');
      pushEvent('Error processing request', 'error');
    }
  }, [isTTSSpeaking, speakOpenAI, isSmartListening, startListening, pushEvent]);

  const handleMicrophoneError = useCallback(() => {
    toast.error('Microphone access denied or unavailable');
    setStatus('idle');
    setCurrentAction('Microphone access required');
    pushEvent('Microphone error', 'error');
  }, [pushEvent]);

  const resetVoiceSystem = useCallback(() => {
    stopListening();
    setStatus('idle');
    setTranscript('');
    setCurrentAction('Voice system reset');
    setEvents([]);
    pushEvent('System reset', 'done');
  }, [stopListening, pushEvent]);

  const cleanupVoiceSystem = useCallback(() => {
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioStream(null);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      pushEvent('Recognition started', 'listening');
    };

    recognition.onend = () => {
      if (status === 'listening' && !isManuallyPausedRef.current) {
        setTimeout(() => {
          if (!isManuallyPausedRef.current && status === 'listening') {
            recognition.start();
          }
        }, 100);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        handleMicrophoneError();
      }
    };

    recognitionRef.current = recognition;

    // Welcome message
    if (!welcomeSpokenRef.current) {
      welcomeSpokenRef.current = true;
      setTimeout(() => {
        speakOpenAI("Welcome to Labnex AI Voice Mode! I'm ready to help you. Just start speaking when you're ready.");
        setCurrentAction('Welcome! Start speaking when ready...');
      }, 1000);
    }

    return cleanupVoiceSystem;
  }, [status, pushEvent, handleMicrophoneError, speakOpenAI, cleanupVoiceSystem]);

  // Handle speech recognition results
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const handleResult = (event: any) => {
      if (isTTSSpeaking || status === 'analyzing') return;

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          handleFinalTranscript(result[0].transcript.trim());
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onresult = handleResult;

    return () => {
      if (recognition) {
        recognition.onresult = null;
      }
    };
  }, [isTTSSpeaking, status, handleFinalTranscript]);

  const togglePause = () => {
    if (status === 'listening' || status === 'waiting') {
      stopListening();
    } else if (status === 'paused' || status === 'idle') {
      startListening();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'text-green-400';
      case 'analyzing': return 'text-blue-400';
      case 'speaking': return 'text-purple-400';
      case 'paused': return 'text-yellow-400';
      case 'waiting': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    if (status === 'listening' || status === 'waiting') {
      return <PauseIcon className="w-8 h-8" />;
    }
    return <PlayIcon className="w-8 h-8" />;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 backdrop-blur-sm bg-slate-800/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">AI Voice Mode</h1>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Status Display */}
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${getStatusColor()}`}>
              {status.toUpperCase()}
            </div>
            <div className="text-slate-400 text-lg">{currentAction}</div>
          </div>

          {/* Voice Activity Visualization */}
          <div className="mb-8">
            <AudioWaveform 
              audioStream={audioStream}
              isActive={status === 'listening'}
              mode={status === 'speaking' ? 'output' : status === 'listening' ? 'input' : 'idle'}
              intensity={status === 'speaking' ? 0.8 : voiceActivityLevel}
            />
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 max-w-2xl">
              <div className="text-slate-300 text-sm mb-1">You're saying:</div>
              <div className="text-slate-100">{transcript}</div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePause}
              className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
              disabled={status === 'analyzing' || status === 'speaking'}
            >
              {getStatusIcon()}
            </button>

            <button
              onClick={resetVoiceSystem}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <MicrophoneIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Smart Listening Toggle */}
          <div className="mt-6 flex items-center space-x-3">
            <span className="text-slate-400">Smart Listening</span>
            <button
              onClick={() => setIsSmartListening(!isSmartListening)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isSmartListening ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSmartListening ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div className={`w-80 border-l border-slate-700/50 bg-slate-800/30 backdrop-blur-sm ${showMobilePanel ? 'block' : 'hidden md:block'}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Voice Timeline</h3>
            <VoiceStatusTimeline events={events} />
          </div>
        </div>
      </div>

      {/* Mobile Gestures */}
      <MobileVoiceGestures 
        onDoubleTap={() => togglePause()}
        onSwipeUp={() => setIsSmartListening(!isSmartListening)}
        onSwipeDown={() => resetVoiceSystem()}
      >
        <div className="absolute inset-0" />
      </MobileVoiceGestures>

      {/* AI Preview Panel */}
      <AIPreviewPanel 
        currentAction={currentAction}
        status={status}
      />

      {/* Tutorial Modal */}
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