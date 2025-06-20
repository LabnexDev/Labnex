import { useState, useEffect } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';

export default function AIVoiceMode() {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
  
  const { isListening, start: startVoice, stop: stopVoice } = useVoiceInput({
    enabled: true,
    onResult: (text) => {
      setTranscript(text);
      stopVoice();
      speak(text);
    },
  });

  const { isSpeaking, speak } = useOpenAITTS();

  const { voiceOutput, setVoiceOutput } = useVoiceSettings();
  
  // Ensure voice output is enabled
  useEffect(() => {
    if (!voiceOutput) setVoiceOutput(true);
  }, [voiceOutput, setVoiceOutput]);

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

  // Auto-restart listening after speaking
  useEffect(() => {
    if (!isSpeaking && !isListening) {
      const timer = setTimeout(() => {
        startVoice();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, isListening, startVoice]);

  // Start listening on mount
  useEffect(() => {
    startVoice();
    return () => {
      stopVoice();
    };
  }, [startVoice, stopVoice]);

  const handleOrbClick = () => {
    if (status === 'listening') {
      stopVoice();
    } else if (status === 'idle') {
      startVoice();
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">

      {/* Pulsing Orb */}
      <div
        className={`relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 transform hover:scale-105 ${
          status === 'listening' 
            ? 'bg-green-500/30 shadow-lg shadow-green-500/20' 
            : status === 'speaking'
            ? 'bg-purple-500/30 shadow-lg shadow-purple-500/20'
            : 'bg-white/10 hover:bg-white/20'
        }`}
        onClick={handleOrbClick}
      >
        {/* Outer pulse ring for active states */}
        {(status === 'listening' || status === 'speaking') && (
          <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
            status === 'listening' ? 'border-green-400/50' : 'border-purple-400/50'
          }`} />
        )}
        
        {/* Inner glow ring */}
        <div className="absolute inset-2 rounded-full border border-white/20" />
        
        {/* Microphone Icon */}
        <MicrophoneIcon className={`w-16 h-16 z-10 transition-colors duration-300 ${
          status === 'listening' 
            ? 'text-green-300' 
            : status === 'speaking'
            ? 'text-purple-300'
            : 'text-white/80'
        }`} />
        
        {/* Status indicator dot */}
        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-colors duration-300 ${
          status === 'listening' 
            ? 'bg-green-400' 
            : status === 'speaking'
            ? 'bg-purple-400'
            : 'bg-slate-400'
        }`} />
      </div>

      {/* Status Card */}
      <div className="absolute top-8 left-8 bg-slate-800/60 backdrop-blur-lg px-5 py-3 rounded-2xl border border-slate-600/30 shadow-lg">
        <p className="text-slate-200 font-medium text-sm">
          {status === 'idle' && 'Tap to speak'}
          {status === 'listening' && 'Listening...'}
          {status === 'speaking' && 'Speaking...'}
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
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
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