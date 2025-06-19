import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PauseIcon, PlayIcon, XMarkIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import VoiceStatusTimeline, { type TimelineEvent, type TimelineEventState } from '../../components/ai-chat/VoiceStatusTimeline';
import AudioWaveform from '../../components/ai-chat/AudioWaveform';
import AIPreviewPanel from '../../components/ai-chat/AIPreviewPanel';
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

  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<AIStatus>('idle');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentAction, setCurrentAction] = useState('Initializing...');

  const { speak: speakOpenAI, isSpeaking } = useOpenAITTS();

  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    setEvents(prev => [{ id: Date.now(), label, state }, ...prev]);
  }, []);

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

  useEffect(() => {
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
            if (status === 'listening') {
                startListening();
            }
        };
        
        recognitionRef.current = recog;

        speakAndThen('Welcome to AI Voice Call. How can I help you today?', () => {
            setCurrentAction('Ready for your commands');
            startListening();
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  const handleFinalTranscript = async (text: string) => {
    if (!text || isSpeaking) return;

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
      setCurrentAction('Generating response...');
      speakAndThen(reply, () => {
          setCurrentAction('Ready for next command');
          startListening();
      });
    } catch (e: any) {
      console.error(e);
      const errorMsg = 'I apologize, but I encountered a connection issue. Please try again.';
      setCurrentAction('Connection error occurred');
      speakAndThen(errorMsg, () => {
        setCurrentAction('Ready - please try again');
        startListening();
      });
    }
  };

  const togglePause = () => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'paused' || status === 'idle') {
      startListening();
    }
  };

  const getOrbClass = () => {
    const baseClasses = 'absolute w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-full transition-all duration-700 ease-in-out shadow-2xl';
    
    switch(status) {
        case 'listening': 
          return `${baseClasses} animate-pulse scale-110 shadow-purple-400/50 ring-4 ring-purple-400/30`;
        case 'analyzing': 
          return `${baseClasses} animate-spin-slow scale-105 shadow-indigo-400/50`;
        case 'speaking': 
          return `${baseClasses} scale-110 shadow-purple-500/60`;
        case 'paused':
          return `${baseClasses} scale-95 opacity-75 shadow-slate-400/30`;
        case 'idle':
        default:
            return `${baseClasses} scale-100 shadow-purple-500/30`;
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header Controls */}
      <header className="flex items-center justify-between p-4 bg-black/10 backdrop-blur-sm z-10 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-emerald-400 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            AI Voice Call
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePause} 
            className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm border border-slate-600/30" 
            title={status === 'listening' ? 'Pause' : 'Resume'}
          >
            {status === 'listening' ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 rounded-full bg-red-900/20 hover:bg-red-800/30 transition-all duration-200 backdrop-blur-sm border border-red-600/30" 
            title="Exit"
          >
            <XMarkIcon className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 items-center justify-center p-6 gap-6">
        {/* Left: Status Timeline */}
        <div className="hidden md:flex md:flex-col justify-center h-full">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Activity Timeline</h3>
            <VoiceStatusTimeline events={events} />
          </div>
        </div>

        {/* Center: Orb and Waveform */}
        <div className="lg:col-span-2 relative flex flex-col items-center justify-center space-y-8 select-none">
          <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
            {/* Audio Waveform Visualization */}
            <div className="absolute inset-0 z-0">
              <AudioWaveform 
                audioStream={audioStream} 
                isActive={status === 'listening' && Boolean(transcript)}
              />
            </div>
            
            {/* Central Orb */}
            <div 
              className={getOrbClass()}
              style={getOrbGlowStyle()}
            >
              {/* Inner gradient overlay */}
              <div className="absolute inset-4 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
            </div>
            
            {/* Microphone Icon */}
            <MicrophoneIcon 
              className={`relative h-24 w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 text-white/90 transition-all duration-500 ${
                status === 'listening' ? 'scale-110 text-white' : ''
              } ${status === 'speaking' ? 'scale-105 animate-pulse' : ''}`} 
            />
            
            {/* Progress ring for analyzing state */}
            {status === 'analyzing' && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"></div>
            )}
          </div>
          
          {/* Transcript Display */}
          <div className="min-h-[2rem] max-w-lg text-center">
            <p className="text-lg text-slate-300 font-medium leading-relaxed">
              {transcript && (
                <span className="bg-slate-800/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-600/30">
                  "{transcript}"
                </span>
              )}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400">
              Say <span className="font-mono bg-slate-800/50 px-2 py-1 rounded text-purple-300">"exit"</span> to leave or{' '}
              <span className="font-mono bg-slate-800/50 px-2 py-1 rounded text-purple-300">"pause"</span> to stop listening
            </p>
            <p className="text-xs text-slate-500">
              Speak naturally and clearly for best results
            </p>
          </div>
        </div>

        {/* Right: AI Preview Panel */}
        <AIPreviewPanel currentAction={currentAction} status={status} />
      </main>
      
      {/* Footer Mic Status */}
      <footer className="p-4 flex justify-center items-center gap-3 bg-black/10 backdrop-blur-sm border-t border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full transition-all duration-300 ${
            status === 'listening' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 
            status === 'speaking' ? 'bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50' :
            status === 'analyzing' ? 'bg-blue-400 animate-spin' :
            'bg-yellow-400'
          }`}></span>
          <span className="font-medium text-slate-300">{getMicStatusText()}</span>
        </div>
        
        <div className="text-xs text-slate-500 ml-4 hidden md:block">
          {status === 'listening' && '🎤 Voice input active'}
          {status === 'speaking' && '🔊 AI responding'}
          {status === 'analyzing' && '🧠 Processing request'}
          {status === 'paused' && '⏸️ Voice input paused'}
          {status === 'idle' && '💤 Ready to listen'}
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
      `}</style>
    </div>
  );
};

export default AIVoiceMode; 