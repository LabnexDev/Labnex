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
import { aiChatApi } from '../../api/aiChat';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type AIStatus = 'idle' | 'listening' | 'analyzing' | 'speaking' | 'paused';

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { pageContext, setPageContext } = useAIChat();
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const initializedRef = useRef(false);
  const welcomeSpokenRef = useRef(false);

  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<AIStatus>('idle');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentAction, setCurrentAction] = useState('Initializing...');
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [aiSpeechIntensity, setAiSpeechIntensity] = useState(0);

  const { speak: speakOpenAI, isSpeaking } = useOpenAITTS();

  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state }, ...prev]);
  }, []);

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

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (status !== 'paused') {
        setStatus('paused');
        setCurrentAction('Voice recognition paused');
        pushEvent('Paused', 'idle');
    }
  }, [status, pushEvent]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && status !== 'listening') {
      recognitionRef.current.start();
      setStatus('listening');
      setCurrentAction('Listening for your voice...');
      pushEvent('Listening...', 'listening');
    }
  }, [status, pushEvent]);

  const speakAndThen = useCallback(async (text: string, onEnd?: () => void) => {
    stopListening();
    setStatus('speaking');
    setCurrentAction('AI responding...');
    pushEvent('Responding', 'executing');
    await speakOpenAI(text, onEnd);
  }, [stopListening, pushEvent, speakOpenAI]);

  const handleFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isSpeaking || status === 'analyzing') return;

    setTranscript('');
    setCurrentAction(`Processing: "${text}"`);
    pushEvent(`You: "${text}"`, 'transcribing');
    
    const lower = text.toLowerCase().trim();

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
    
    setStatus('analyzing');
    setCurrentAction('Analyzing your request...');
    pushEvent('Analyzing...', 'analyzing');

    try {
      const { reply } = await aiChatApi.sendMessage(text, pageContext);
      if (reply) {
        setCurrentAction('Generating response...');
        speakAndThen(reply, () => {
            setCurrentAction('Ready for next command');
            setStatus('idle');
            setTimeout(() => {
              if (recognitionRef.current && status !== 'paused') {
                startListening();
              }
            }, 100);
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
      setStatus('idle');
      speakAndThen(errorMsg, () => {
        setCurrentAction('Ready - please try again');
        setTimeout(() => startListening(), 1000);
      });
    }
  }, [isSpeaking, status, pushEvent, speakAndThen, stopListening, startListening, navigate, pageContext]);

  // Main initialization effect - only run once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    setPageContext({ ...pageContext, voiceMode: true });
    
    const init = async () => {
        try {
            setCurrentAction('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            setAudioStream(stream);
            setCurrentAction('Microphone access granted');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setCurrentAction('Microphone access denied');
            toast.error('Microphone access denied. Please enable it in your browser settings.');
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
            // Only restart if we're supposed to be listening and not analyzing/speaking
            if (status === 'listening' && !isSpeaking) {
                setTimeout(() => {
                  if (recognitionRef.current && status === 'listening' && !isSpeaking) {
                    try {
                      recognitionRef.current.start();
                    } catch (e) {
                      console.log('Restart recognition failed:', e);
                    }
                  }
                }, 100);
            }
        };
        
        recognitionRef.current = recog;

        // Only speak welcome message once
        if (!welcomeSpokenRef.current) {
          welcomeSpokenRef.current = true;
          setTimeout(() => {
            speakAndThen('Welcome to AI Voice Call. How can I help you today?', () => {
                setCurrentAction('Ready for your commands');
                startListening();
            });
          }, 500);
        }
    };

    init();

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
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
    if (status === 'listening') {
      stopListening();
    } else if (status === 'paused' || status === 'idle') {
      startListening();
    }
  };

  // Enhanced orb handling for mobile
  const handleOrbTap = () => {
    if (status === 'paused' || status === 'idle') {
      startListening();
    } else if (status === 'listening') {
      stopListening();
    }
  };

  const getOrbClass = () => {
    const baseClasses = 'w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-full transition-all duration-700 ease-in-out shadow-2xl cursor-pointer active:scale-95';
    
    switch(status) {
        case 'listening': 
          return `${baseClasses} animate-pulse scale-105 sm:scale-110 shadow-purple-400/50 ring-4 ring-purple-400/30`;
        case 'analyzing': 
          return `${baseClasses} animate-spin-slow scale-100 sm:scale-105 shadow-indigo-400/50`;
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
    return {};
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Enhanced Mobile Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-md z-20 border-b border-slate-700/30 safe-area-top">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent truncate">
            AI Voice Call
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
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
            title={status === 'listening' ? 'Pause' : 'Resume'}
          >
            {status === 'listening' ? <PauseIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
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
                    isActive={status === 'listening' || status === 'speaking' || status === 'idle'}
                    mode={
                      status === 'listening' ? 'input' :
                      status === 'speaking' ? 'output' :
                      'idle'
                    }
                    intensity={status === 'speaking' ? aiSpeechIntensity : 0}
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
                  }}
                  aria-label={status === 'listening' ? 'Tap to pause listening' : 'Tap to start listening'}
                >
                  {/* Inner gradient overlay */}
                  <div className="absolute inset-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full pointer-events-none"></div>
                  
                  {/* Microphone Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MicrophoneIcon 
                      className={`h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 text-white/90 transition-all duration-500 pointer-events-none ${
                        status === 'listening' ? 'scale-110 text-white' : ''
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
                 status === 'speaking' ? '🔊 AI is responding...' : 
                 status === 'analyzing' ? '🧠 Processing your request...' :
                 status === 'paused' ? '⏸️ Voice recognition paused' :
                 '💬 Tap the orb to start voice conversation'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-slate-500">
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Say "exit" to leave</span>
                <span className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 px-3 py-1 rounded-full border border-slate-600/20">Say "pause" to stop</span>
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
            status === 'listening' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 
            status === 'speaking' ? 'bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50' :
            status === 'analyzing' ? 'bg-blue-400 animate-spin' :
            'bg-yellow-400'
          }`}></span>
          <span className="font-medium text-slate-300 text-sm sm:text-base">{getMicStatusText()}</span>
          
          {/* Status emoji for mobile */}
          <span className="text-sm">
            {status === 'listening' && '🎤'}
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
    </div>
  );
};

export default AIVoiceMode; 