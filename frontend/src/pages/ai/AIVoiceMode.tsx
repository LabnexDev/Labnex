import { useState, useEffect } from 'react';
import { MicrophoneIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { aiChatApi } from '../../api/aiChat';

export default function AIVoiceMode() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [microphonePaused, setMicrophonePaused] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false); // Prevent concurrent requests
  
  // Stable particle positions to prevent re-rendering glitches
  const [particles] = useState(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 4,
    }))
  );
  
  const { voiceOutput, setVoiceOutput } = useVoiceSettings();
  
  // Ensure voice output is enabled
  useEffect(() => {
    if (!voiceOutput) setVoiceOutput(true);
  }, [voiceOutput, setVoiceOutput]);

  const { isListening, start: startVoice, stop: stopVoice } = useVoiceInput({
    enabled: true,
    onResult: async (text) => {
      // Prevent multiple simultaneous requests
      if (isProcessingRequest) {
        console.log('Already processing request, ignoring duplicate');
        return;
      }
      
      // Immediately pause microphone and set processing status
      setIsProcessingRequest(true);
      setMicrophonePaused(true);
      stopVoice();
      setTranscript(text);
      setStatus('processing');
      
      try {
        const chatRes = await aiChatApi.sendMessage(text, { page: window.location.pathname });
        await speak(chatRes.reply);
      } catch (err) {
        console.error('AI chat failed', err);
        await speak("Sorry, I couldn't get a response.");
      } finally {
        // Always clear processing flag
        setIsProcessingRequest(false);
      }
    },
  });

  const { isSpeaking, speak } = useOpenAITTS();

  // Update status based on voice states
  useEffect(() => {
    if (isSpeaking) {
      setStatus('speaking');
    } else if (isListening) {
      setStatus('listening');
    } else {
      setStatus('idle');
    }
  }, [isSpeaking, isListening]);

  // Comprehensive echo prevention system
  useEffect(() => {
    if (isSpeaking) {
      // TTS started - immediately pause microphone
      setMicrophonePaused(true);
      if (isListening) {
        stopVoice();
      }
    } else if (microphonePaused && !isSpeaking && !isProcessingRequest) {
      // TTS ended - wait before resuming microphone (only if not processing)
      const resumeTimeout = setTimeout(() => {
        setMicrophonePaused(false);
        // Only resume if we're truly idle and not already listening or processing
        if (!isListening && status === 'idle' && !isProcessingRequest) {
          startVoice();
        }
      }, 500); // Longer delay to ensure TTS audio has completely finished

      return () => clearTimeout(resumeTimeout);
    }
  }, [isSpeaking, microphonePaused, isListening, status, startVoice, stopVoice, isProcessingRequest]);

  // Prevent microphone from starting if we're paused
  useEffect(() => {
    if (microphonePaused && isListening) {
      stopVoice();
    }
  }, [microphonePaused, isListening, stopVoice]);

  // Start listening on mount (only if not paused)
  useEffect(() => {
    if (!microphonePaused) {
      startVoice();
    }
    return () => {
      stopVoice();
    };
  }, [startVoice, stopVoice, microphonePaused]);

  const handleOrbClick = () => {
    if (microphonePaused || isProcessingRequest) {
      // If microphone is paused or processing request, don't allow manual override
      return;
    }
    
    if (status === 'listening') {
      stopVoice();
    } else if (status === 'idle') {
      startVoice();
    }
  };



  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">

      {/* Back Button */}
      <button
        onClick={() => navigate('/ai/chat')}
        className="absolute top-8 right-8 bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-105 group"
      >
        <ArrowLeftIcon className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
      </button>

      {/* Main Orb */}
      <div className="relative">
        {/* Main Orb */}
        <div
          className={`relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out transform hover:scale-105 z-10 backdrop-blur-sm border border-white/20 ${
            status === 'listening' 
              ? 'bg-gradient-to-br from-green-400/40 to-green-600/20 shadow-2xl shadow-green-500/30' 
              : status === 'speaking'
              ? 'bg-gradient-to-br from-purple-400/40 to-purple-600/20 shadow-2xl shadow-purple-500/30'
              : status === 'processing'
              ? 'bg-gradient-to-br from-blue-400/40 to-blue-600/20 shadow-2xl shadow-blue-500/30'
              : 'bg-gradient-to-br from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 shadow-2xl shadow-white/10'
          }`}
          onClick={handleOrbClick}
        >
          {/* Outer pulse ring for active states */}
          {(status === 'listening' || status === 'speaking' || status === 'processing') && (
            <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
              status === 'listening' ? 'border-green-400/50' : 
              status === 'speaking' ? 'border-purple-400/50' :
              'border-blue-400/50'
            }`} />
          )}
          
          {/* Inner glow ring */}
          <div className="absolute inset-3 rounded-full border border-white/30 shadow-inner" />
          
          {/* Subtle inner highlight */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          
          {/* Microphone Icon */}
          <MicrophoneIcon className={`w-16 h-16 z-10 transition-colors duration-500 ease-in-out ${
            status === 'listening' 
              ? 'text-green-300' 
              : status === 'speaking'
              ? 'text-purple-300'
              : status === 'processing'
              ? 'text-blue-300'
              : 'text-white/80'
          }`} />
          
          {/* Status indicator dot */}
          <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-colors duration-500 ease-in-out ${
            status === 'listening' 
              ? 'bg-green-400' 
              : status === 'speaking'
              ? 'bg-purple-400'
              : status === 'processing'
              ? 'bg-blue-400'
              : 'bg-slate-400'
          }`} />
        </div>
      </div>

      {/* Status Card */}
      <div className="absolute top-8 left-8 bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 shadow-2xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            status === 'listening' ? 'bg-green-400 animate-pulse' :
            status === 'speaking' ? 'bg-purple-400 animate-pulse' :
            status === 'processing' ? 'bg-blue-400 animate-pulse' :
            'bg-slate-400'
          }`} />
          <p className="text-white font-medium text-sm tracking-wide">
            {status === 'idle' && 'Tap to speak'}
            {status === 'listening' && 'Listening...'}
            {status === 'speaking' && 'Speaking...'}
            {status === 'processing' && 'Processing...'}
          </p>
        </div>
      </div>

      {/* Transcript Card */}
      {transcript && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-lg w-full mx-4 bg-gradient-to-br from-slate-800/90 to-slate-900/70 backdrop-blur-xl px-8 py-6 rounded-3xl border border-white/20 shadow-2xl shadow-black/30 transition-all duration-500 animate-in slide-in-from-bottom-4">
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 animate-pulse" />
            <div className="flex-1">
              <p className="text-slate-300 text-xs font-medium mb-2 uppercase tracking-wider">Last transcript</p>
              <p className="text-white text-base leading-relaxed font-medium">{transcript}</p>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Gradient Overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      
      {/* Subtle animated background light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse pointer-events-none opacity-50" style={{ animationDelay: '2s' }} />
    </div>
  );
}