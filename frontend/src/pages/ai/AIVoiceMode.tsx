import { useState, useEffect } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { aiChatApi } from '../../api/aiChat';
import VoiceRingWaveform from '../../components/voice/VoiceRingWaveform';

export default function AIVoiceMode() {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [microphonePaused, setMicrophonePaused] = useState(false);
  
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
      // Immediately pause microphone and set processing status
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
    } else if (microphonePaused && !isSpeaking) {
      // TTS ended - wait before resuming microphone
      const resumeTimeout = setTimeout(() => {
        setMicrophonePaused(false);
        // Only resume if we're truly idle and not already listening
        if (!isListening && status === 'idle') {
          startVoice();
        }
      }, 500); // Longer delay to ensure TTS audio has completely finished

      return () => clearTimeout(resumeTimeout);
    }
  }, [isSpeaking, microphonePaused, isListening, status, startVoice, stopVoice]);

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
    if (microphonePaused) {
      // If microphone is paused, don't allow manual override during TTS
      return;
    }
    
    if (status === 'listening') {
      stopVoice();
    } else if (status === 'idle') {
      startVoice();
    }
  };



  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">

      {/* Pulsing Orb with Waveform */}
      <div className="relative">
        {/* Animated Ring Waveform */}
        <div className="absolute inset-0 flex items-center justify-center">
          <VoiceRingWaveform 
            isActive={status !== 'idle'}
            status={status}
          />
        </div>
        
        {/* Main Orb */}
        <div
          className={`relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out transform hover:scale-105 z-10 ${
            status === 'listening' 
              ? 'bg-green-500/30 shadow-lg shadow-green-500/20' 
              : status === 'speaking'
              ? 'bg-purple-500/30 shadow-lg shadow-purple-500/20'
              : status === 'processing'
              ? 'bg-blue-500/30 shadow-lg shadow-blue-500/20'
              : 'bg-white/10 hover:bg-white/20'
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
          <div className="absolute inset-2 rounded-full border border-white/20" />
          
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
      <div className="absolute top-8 left-8 bg-slate-800/60 backdrop-blur-lg px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
        <p className="text-slate-200 font-medium text-sm">
          {status === 'idle' && 'Tap to speak'}
          {status === 'listening' && 'Listening...'}
          {status === 'speaking' && 'Speaking...'}
          {status === 'processing' && 'Processing...'}
        </p>
      </div>

      {/* Transcript Card */}
      {transcript && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 bg-slate-800/70 backdrop-blur-lg px-6 py-4 rounded-2xl border border-slate-600/30 shadow-lg">
          <p className="text-slate-300 text-sm font-medium mb-1">Last transcript:</p>
          <p className="text-white text-base">{transcript}</p>
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

      {/* Gradient Overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-indigo-900/10 pointer-events-none" />
    </div>
  );
}