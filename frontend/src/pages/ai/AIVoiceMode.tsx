import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MicrophoneIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceInput, type VoiceState } from '../../hooks/useVoiceInput';
import { parseMultiCommand } from '../../utils/parseNLUCommand';
import { executeCommandQueue, formatCommandResult } from '../../utils/slashCommandHandler';
import { aiChatApi } from '../../api/aiChat';
import { type TimelineEvent, type TimelineEventState } from '../../components/ai-chat/VoiceStatusTimeline';
import AudioWaveform from '../../components/ai-chat/AudioWaveform';
import MobileVoiceGestures from '../../components/ai-chat/MobileVoiceGestures';
import { getMemory, clearInterrupted, setIsSpeaking } from '../../utils/voiceContext';
import './AIVoiceMode.css';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useCurrentProjectId } from '../../hooks/useCurrentProjectId';
import VoiceDebugOverlay from '../../components/VoiceDebugOverlay';
import { useVoiceAutoTuning } from '../../hooks/useVoiceAutoTuning';
import { VoiceSystemProvider, useVoiceSystemOptional } from '../../contexts/VoiceSystemContext';
import { useVoiceHealthMonitor } from '../../hooks/useVoiceHealthMonitor';
import { useMicrophone } from '../../hooks/useMicrophone';

type AIStatus = VoiceState | 'analyzing' | 'speaking' | 'paused' | 'waiting';

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { speak: baseSpeakOpenAI, isSpeaking: isTTSSpeaking, stopSpeaking } = useOpenAITTS();
  const { user } = useAuth();
  const { voiceOutput, setVoiceOutput, similarityThreshold: baseSim, amplitudeThreshold: baseAmp } = useVoiceSettings();
  const { audioStream, permissionError, startMicrophone, stopMicrophone } = useMicrophone();

  const { similarityThreshold, amplitudeThreshold, feed } = useVoiceAutoTuning(baseSim, baseAmp);

  const ttsQueueRef = useRef<string[]>([]);
  const ttsWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  const processTTSQueue = useCallback(() => {
    if (isTTSSpeaking) return;
    if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);

    const next = ttsQueueRef.current.shift();
    if (!next) return;
    
    lastSpokenRef.current = next;
    ttsStartRef.current = Date.now();

    ttsWatchdogRef.current = setTimeout(() => {
      console.warn('TTS watchdog triggered. Skipping to next item.');
      toast.error('Voice output timed out.');
      stopSpeaking();
      processTTSQueue();
    }, 20000);

    baseSpeakOpenAI(next, () => {
      if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
      processTTSQueue();
    });
  }, [isTTSSpeaking, baseSpeakOpenAI, stopSpeaking]);

  const speakOpenAI = useCallback(async (text: string) => {
    ttsQueueRef.current.push(text);
    processTTSQueue();
  }, [processTTSQueue]);

  const safeNavigate = useCallback((dest: string | number) => {
    if (typeof dest === 'string') {
      const allowed = ['/', '/dashboard', '/projects', '/tasks', '/notes', '/ai', '/settings', '/login', '/register', '/contact', '/snippets'];
      if (!allowed.includes(dest)) {
        toast.error('Unknown page');
        return;
      }
    }
    navigate(dest as any);
  }, [navigate]);

  useEffect(() => {
    setIsSpeaking(isTTSSpeaking);
  }, [isTTSSpeaking]);

  useEffect(() => {
    if (!voiceOutput) setVoiceOutput(true);
  }, [voiceOutput, setVoiceOutput]);

  const [status, setStatus] = useState<AIStatus>('idle');
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isDebugMode] = useState(localStorage.getItem('devMode') === 'true');
  const [liveCaption, setLiveCaption] = useState<string>('');
  const [showHelp, setShowHelp] = useState(() => localStorage.getItem('voiceHelpSeen') !== 'true');
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<{ lastTranscript: string; similarity: number; echoSuppressed: boolean }>({ lastTranscript: '', similarity: 0, echoSuppressed: false });
  const [isPaused, setIsPaused] = useState(false);
  const [lastTranscriptAt, setLastTranscriptAt] = useState(Date.now());
  
  const currentProjectId = useCurrentProjectId();
  const lastSpokenRef = useRef<string>('');
  const ttsStartRef = useRef<number>(0);

  const statusRef = useRef(status);
  const isPausedRef = useRef(isPaused);
  
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  type ListeningMode = 'push' | 'handsfree';
  const [listeningMode, setListeningMode] = useState<ListeningMode>('push');
  const [isMuted, setIsMuted] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    startMicrophone();
    return () => { 
      mountedRef.current = false;
      stopMicrophone();
    };
  }, [startMicrophone, stopMicrophone]);

  const pushEvent = useCallback((label: string, state: TimelineEventState) => {
    if (!mountedRef.current) return;
    setEvents(prev => [{ id: Date.now(), label, state, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  }, []);

  const getSimilarity = (a: string, b: string): number => {
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();
    if (!a || !b) return 0;
    if (a === b) return 1;
    const aWords = a.split(' ');
    const bWords = b.split(' ');
    if (aWords.length === 0 || bWords.length === 0) return 0;
    const maxLen = Math.max(aWords.length, bWords.length);
    let match = 0;
    for (let i = 0; i < Math.min(aWords.length, bWords.length); i++) {
      if (aWords[i] === bWords[i]) match++;
      else break;
    }
    return match / maxLen;
  };

  const handleVoiceResult = useCallback(async (transcript: string, confidence = 1) => {
    if (!transcript.trim() || !mountedRef.current) return;
    setLastTranscriptAt(Date.now());

    if (confidence < 0.45) return;

    if (statusRef.current === 'speaking' && voiceActivityLevel > amplitudeThreshold) {
      return;
    }

    const lower = transcript.trim().toLowerCase();
    
    if (lower === 'pause' || lower === 'computer sleep') {
      stopVoice();
      setIsPaused(true);
      pushEvent('Paused', 'idle');
      toast('⏸️ Paused');
      return;
    }
    if (lower === 'resume' || lower === 'computer wake up') {
      if (isPausedRef.current) {
        setIsPaused(false);
        startVoice();
        pushEvent('Resumed', 'listening');
        toast('▶️ Resumed');
      }
      return;
    }
    if (lower === 'stop' || lower === 'cancel') {
      ttsQueueRef.current = [];
      stopSpeaking();
      pushEvent('TTS cancelled', 'idle');
      return;
    }

    const now = Date.now();
    const elapsed = now - ttsStartRef.current;
    const sim = getSimilarity(transcript, lastSpokenRef.current);

    if (elapsed < 2500 && sim > similarityThreshold) {
      setDebugData({ lastTranscript: transcript, similarity: sim, echoSuppressed: true });
      if (isDebugMode) toast('🔇 Echo suppressed', { icon: '🛑' });
      feed({ similarity: sim, confidence, vad: voiceActivityLevel, suppressed: true });
      return;
    }
    setDebugData({ lastTranscript: transcript, similarity: sim, echoSuppressed: false });
    feed({ similarity: sim, confidence, vad: voiceActivityLevel, suppressed: false });

    setLiveCaption(transcript);
    setTimeout(()=> { if (mountedRef.current) setLiveCaption(''); }, 2000);
    pushEvent(`Input: ${transcript}`, 'transcribing');

    const parsedIntents = parseMultiCommand(transcript);

    const { wasInterrupted } = getMemory();
    if (wasInterrupted) {
      toast('⏭️ Previous task discarded.', { icon: '🤚' });
      clearInterrupted();
    }

    if (isDebugMode) {
      console.log('🎤 Parsed Commands:', parsedIntents);
    }

    const allUnknown = parsedIntents.every(p => p.intent === 'unknown');

    if (allUnknown) {
      setStatus('analyzing');
      pushEvent('Chatting with AI…', 'analyzing');
      try {
        const chatRes = await aiChatApi.sendMessage(transcript, { page: window.location.pathname });
        toast(chatRes.reply, { icon: '🤖' });
        pushEvent('💬 AI replied', 'done');
        await speakOpenAI(chatRes.reply);
      } catch (err) {
        console.error('Chat fallback failed', err);
        toast.error('Failed to get AI response');
        pushEvent('Chat error', 'error');
      } finally {
        if(mountedRef.current) setStatus('idle');
      }
      return;
    }

    const results = await executeCommandQueue(parsedIntents, { navigate: safeNavigate, currentProjectId, isDebugMode });
    
    for (const result of results) {
        const msg = formatCommandResult(result, isDebugMode);
        if (result.success) {
            toast.success(msg);
            pushEvent(`✅ ${result.action || 'command'}`, 'done');
            await speakOpenAI(msg);
        } else {
            toast.error(msg);
            pushEvent(`❌ ${result.action || 'command'}`, 'error');
        }
    }
  }, [safeNavigate, currentProjectId, isDebugMode, speakOpenAI, pushEvent, voiceActivityLevel, amplitudeThreshold, similarityThreshold, stopSpeaking, feed]);

  const handleVoiceError = useCallback((error: string) => {
    if (!mountedRef.current) return;
    console.warn('Voice input error:', error);
    if (error.includes('No speech')) {
      toast(`🤔 I didn't catch that, try again`, { icon: '🎤' });
    } else {
      toast.error(error);
    }
    pushEvent(`Voice Error: ${error}`, 'error');
  }, [pushEvent]);

  const handleVoiceStateChange = useCallback((newState: VoiceState) => {
    if (!mountedRef.current) return;
    setStatus(newState);
    
    const eventStates: Record<VoiceState, TimelineEventState> = {
      idle: 'idle',
      listening: 'listening', 
      processing: 'analyzing',
      error: 'error'
    };
    
    pushEvent(`Voice ${newState}`, eventStates[newState]);
  }, [pushEvent]);

  const {
    isListening,
    start: startVoice,
    stop: stopVoice,
    toggle: toggleVoiceInput,
    isSupported: isVoiceSupported,
    isRunning: isSRRunning
  } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
    onStateChange: handleVoiceStateChange,
    enabled: !isPaused && (listeningMode === 'handsfree' ? !isMuted : true) && !isTTSSpeaking,
    continuous: listeningMode === 'handsfree',
    autoRestart: listeningMode === 'handsfree',
  });

  useVoiceHealthMonitor({
    isListening,
    isSpeaking: isTTSSpeaking,
    voiceActivityLevel,
    lastTranscriptTime: lastTranscriptAt,
  });

  const voiceSys = useVoiceSystemOptional();
  useEffect(() => {
    if (!voiceSys?.fatalError) return;
    voiceSys.speakStatus("Voice Mode isn't working right now. Redirecting to chat.");
    toast.error('Voice system offline. Redirecting to AI Chat...');
    const id = setTimeout(() => navigate('/ai?voiceSession=failover'), 2000);
    return () => clearTimeout(id);
  }, [voiceSys, navigate]);

  const handleModeToggle = useCallback((enabled: boolean) => {
    setListeningMode(enabled ? 'handsfree' : 'push');
    setIsMuted(false);
  }, []);

  useEffect(() => {
    if (listeningMode === 'handsfree' && !isMuted && !isSRRunning && !isPaused) {
      startVoice();
    } else if (listeningMode === 'push' || isMuted || isPaused) {
      stopVoice();
    }
  }, [listeningMode, isMuted, isSRRunning, isPaused, startVoice, stopVoice]);

  const toggleMute = useCallback(() => {
    if (listeningMode !== 'handsfree') return;
    setIsMuted(prev => !prev);
  }, [listeningMode]);

  useEffect(() => {
    if (listeningMode === 'handsfree') return;
    if (isTTSSpeaking) stopVoice();
  }, [isTTSSpeaking, listeningMode, stopVoice]);

  const resetVoiceSystem = useCallback(() => {
    stopVoice();
    stopSpeaking();
    ttsQueueRef.current = [];
    if (ttsWatchdogRef.current) clearTimeout(ttsWatchdogRef.current);
    if (mountedRef.current) {
        setStatus('idle');
        setEvents([]);
    }
    pushEvent('System reset', 'done');
  }, [stopVoice, stopSpeaking, pushEvent]);

  const togglePause = useCallback(() => setIsPaused(p => !p), []);

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

  const [hasWelcomed, setHasWelcomed] = useState(false);
  useEffect(() => {
    if (hasWelcomed || isTTSSpeaking || status !== 'idle' ) return;
    const firstName = user?.name?.split(' ')[0] || 'there';
    const hasSeen = localStorage.getItem('voice_welcome_shown');
    const message = hasSeen
      ? `Welcome back, ${firstName}!`
      : `Hello ${firstName}, welcome to Labnex Voice Mode. How can I help?`;

    speakOpenAI(message);
    localStorage.setItem('voice_welcome_shown', 'true');
    setHasWelcomed(true);
    pushEvent('🎉 Welcome message played', 'done');
  }, [hasWelcomed, status, isTTSSpeaking, user, speakOpenAI, pushEvent]);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && !e.repeat && listeningMode === 'push' && !isListening) {
        startVoice();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && listeningMode === 'push' && isListening) {
        stopVoice();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [listeningMode, startVoice, stopVoice, isListening]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      switch (e.code) {
        case 'Escape': navigate('/ai'); break;
        case 'KeyH': handleModeToggle(listeningMode !== 'handsfree'); break;
        case 'KeyM': if (listeningMode === 'handsfree') toggleMute(); break;
        case 'KeyD': setShowDebug(prev => !prev); break;
        case 'Slash': if (e.shiftKey) setShowHelp(true); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, listeningMode, handleModeToggle, toggleMute]);

  const closeHelp = () => {
    setShowHelp(false);
    localStorage.setItem('voiceHelpSeen', 'true');
  };

  if (!isVoiceSupported) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-8">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Browser Not Supported</h1>
        <p className="text-slate-400 text-center mb-6 max-w-md">
          Your browser doesn't support the required features for AI Voice Mode. 
          Please use a modern browser like Chrome or Firefox.
        </p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-8">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Microphone Access Required</h1>
        <p className="text-slate-400 text-center mb-6 max-w-md">{permissionError}</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Retry
          </button>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <VoiceSystemProvider speak={speakOpenAI}>
    <div className="voice-mode-container overflow-hidden font-sans text-slate-100 bg-gradient-to-br from-slate-900 via-purple-900/20 to-indigo-900/30">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-indigo-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-600/5 to-cyan-600/10 animate-pulse opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"></div>
      </div>
      
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
        onLongPress={() => handleModeToggle(listeningMode !== 'handsfree')}
      >
        <div className="relative h-full">
          {/* Top Status Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 animate-slide-in-top">
            <div className="flex items-center justify-between p-8">
              <button onClick={() => navigate('/ai')} className="mr-4 text-slate-400 hover:text-white focus:outline-none" title="Back">
                <ArrowLeftIcon className="w-6 h-6" />
              </button>

              {/* Status Indicator */}
              <div className="flex items-center gap-4">
                <div className={`relative w-4 h-4 rounded-full transition-all duration-500 ${
                  status === 'listening' ? 'bg-green-400 shadow-green-400/50' :
                  status === 'speaking' ? 'bg-purple-400 shadow-purple-400/50' :
                  status === 'analyzing' ? 'bg-blue-400 shadow-blue-400/50' :
                  status === 'error' ? 'bg-red-400 shadow-red-400/50' : 'bg-slate-400 shadow-slate-400/50'
                } shadow-lg`}>
                  {(status === 'listening' || status === 'speaking' || status === 'analyzing') && (
                    <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-30"></div>
                  )}
                </div>
                <div className="text-white">
                  <h3 className="font-bold text-lg tracking-wide">LABNEX AI</h3>
                  <p className="text-slate-300 text-sm opacity-80">{
                    status === 'listening' ? 'Listening...' :
                    status === 'speaking' ? 'Responding...' :
                    status === 'analyzing' ? 'Processing...' :
                    status === 'paused' ? 'Paused' :
                    status === 'error' ? 'Error' :
                    'Ready'
                  }</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span>Online</span></div>
                <div className="flex items-center gap-2"><span>{events.length}</span><span>Events</span></div>
                <div className="flex items-center gap-2"><span>{listeningMode === 'handsfree' ? 'Auto' : 'Manual'}</span><span>Mode</span></div>
              </div>
            </div>
          </div>

          <div className="flex h-full">
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
                    {events.slice(0, 12).map((event) => (
                      <div key={event.id} className="group flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-600/20 hover:bg-slate-700/50 hover:border-slate-500/30 transition-all duration-300 hover-lift">
                        <div className="relative timeline-connector">
                          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            event.state === 'done' ? 'bg-green-400 shadow-green-400/50' :
                            event.state === 'error' ? 'bg-red-400 shadow-red-400/50' :
                            event.state === 'listening' ? 'bg-blue-400 shadow-blue-400/50' :
                            event.state === 'analyzing' ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-slate-400 shadow-slate-400/50'
                          } shadow-lg group-hover:scale-110`}></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm leading-relaxed group-hover:text-slate-100 transition-colors">{event.label}</p>
                          <p className="text-slate-400 text-xs mt-1 font-mono">{event.timestamp}</p>
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-slate-400">🔇</span></div>
                        <p className="text-sm">No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="mb-12 animate-fade-in-scale">
                <div className={`text-6xl md:text-8xl font-black tracking-wider transition-all duration-500 text-center status-shimmer ${getStatusColor()}`}>
                  {isPaused ? 'PAUSED' : status.toUpperCase()}
                </div>
                <div className="text-center mt-4"><div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-current to-transparent opacity-50 rounded-full"></div></div>
              </div>

              <div className="relative mb-12 animate-fade-in-scale">
                <div className="absolute inset-0 flex items-center justify-center">
                  {(status === 'listening') && (
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

                <div className={`voice-orb voice-transition relative w-56 h-56 md:w-72 md:h-72 rounded-full shadow-2xl transition-all duration-700 ${
                  isPaused ? 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700' :
                  status === 'listening' ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 listening' :
                  status === 'speaking' ? 'bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 speaking' :
                  status === 'analyzing' ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-600 animate-spin-slow' :
                  status === 'error' ? 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600' :
                  'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700'
                }`}>
                  
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                  
                  <div className="absolute inset-0 rounded-full overflow-hidden opacity-70">
                    <AudioWaveform
                      audioStream={audioStream}
                      isActive={status === 'listening'}
                      mode={status === 'speaking' ? 'output' : 'input'}
                      intensity={status === 'speaking' ? 0.8 : voiceActivityLevel}
                    />
                  </div>
                  
                  {liveCaption && (
                    <div className="absolute inset-4 flex items-center justify-center text-center px-4 text-white text-sm animate-fade-in-scale">
                      <span className="drop-shadow-lg">{liveCaption}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={listeningMode === 'push' ? toggleVoiceInput : (isPaused ? () => setIsPaused(false) : toggleMute)}
                    disabled={!isVoiceSupported}
                    className="absolute inset-0 flex items-center justify-center focus:outline-none group transition-all duration-300 hover:scale-105"
                  >
                    <div className="relative">
                      <MicrophoneIcon className={`w-24 h-24 md:w-32 md:h-32 transition-all duration-300 ${
                        !isVoiceSupported ? 'text-gray-500' :
                        isPaused ? 'text-yellow-200' :
                        listeningMode === 'handsfree' && !isMuted ? 'text-cyan-100 drop-shadow-2xl' :
                        isListening ? 'text-white drop-shadow-2xl' :
                        'text-white/90 group-hover:text-white group-hover:scale-110'
                      }`} />
                      
                      {listeningMode === 'handsfree' && !isMuted && !isPaused && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-cyan-200">AUTO</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex w-80 flex-col animate-slide-in-right">
              <div className="flex-1 p-8 pt-32">
                <div className="space-y-6">
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center"><span className="text-white text-sm">⚙️</span></div>
                      Voice Mode
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-600/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center"><span className="text-white text-lg">∞</span></div>
                          <div>
                            <h5 className="text-white font-semibold">Always-on</h5>
                            <p className="text-slate-400 text-sm">Hands-free mode</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleModeToggle(listeningMode === 'push')}
                          className={`btn-voice-mode relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 hover-lift ${listeningMode === 'handsfree' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50' : 'bg-slate-600'} shadow-lg`}
                        >
                          <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${listeningMode === 'handsfree' ? 'translate-x-10 shadow-cyan-200/50' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"><span className="text-white text-sm">🎤</span></div>
                      Voice Activity
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Level</span>
                        <span className="text-white font-mono activity-pulse">{Math.round(voiceActivityLevel * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-150 rounded-full" style={{ width: `${voiceActivityLevel * 100}%`, boxShadow: voiceActivityLevel > 0.1 ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-20 animate-slide-in-top">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-full px-8 py-4 border border-slate-700/50 shadow-2xl hover-glow voice-transition">
              <div className="flex items-center gap-6 text-slate-300">
                <div className="flex items-center gap-3 hover-lift voice-transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"><span className="text-white text-sm">👆</span></div>
                  <span className="text-sm font-medium">Tap orb</span>
                </div>
                <div className="w-px h-6 bg-gradient-to-b from-slate-600 to-transparent"></div>
                <div className="flex items-center gap-3 hover-lift voice-transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg"><span className="text-white text-sm">⬆️</span></div>
                  <span className="text-sm font-medium">Swipe up</span>
                </div>
              </div>
            </div>
          </div>

          {showHelp && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in">
              <div className="bg-slate-900 w-full max-w-lg mx-4 rounded-2xl p-8 border border-slate-700 relative shadow-2xl">
                <button onClick={closeHelp} className="absolute top-4 right-4 text-slate-400 hover:text-white focus:outline-none">✕</button>
                <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2"><span>🗣️</span> Voice-Mode Shortcuts</h2>
                <ul className="space-y-3 text-slate-300 text-sm list-disc list-inside">
                  <li><kbd className="kbd">Space</kbd> Hold to speak (push-to-talk mode)</li>
                  <li><kbd className="kbd">H</kbd> Toggle hands-free / push-to-talk</li>
                  <li><kbd className="kbd">M</kbd> Mute / un-mute mic in hands-free</li>
                  <li><kbd className="kbd">Esc</kbd> Exit Voice-Mode</li>
                  <li><kbd className="kbd">Shift</kbd> + <kbd className="kbd">?</kbd> Show this help</li>
                </ul>
                <div className="mt-6 text-right">
                  <button onClick={closeHelp} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm focus:outline-none">Got it</button>
                </div>
              </div>
            </div>
          )}

          <VoiceDebugOverlay
            show={showDebug}
            lastTranscript={debugData.lastTranscript}
            similarityScore={debugData.similarity}
            echoSuppressed={debugData.echoSuppressed}
            voiceActivityLevel={voiceActivityLevel}
            isSpeaking={isTTSSpeaking}
            isListening={isListening}
          />
        </div>
      </MobileVoiceGestures>
    </div>
    </VoiceSystemProvider>
  );
};

export default AIVoiceMode;