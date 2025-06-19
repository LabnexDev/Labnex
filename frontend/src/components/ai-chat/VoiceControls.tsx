import React from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { useAIChat } from '../../contexts/AIChatContext';

const VoiceControls: React.FC = () => {
  const { voiceInput, voiceOutput, setVoiceInput, setVoiceOutput } = useVoiceSettings();
  const { sendMessage, isTyping } = useAIChat();
  const { listening, start, stop } = useSpeechInput({ enabled: voiceInput, onResult: (txt) => sendMessage(txt) });

  const handleMicClick = () => {
    if (!voiceInput) {
      // Enable voice input & start recording
      setVoiceInput(true);
      start();
    } else if (listening) {
      // Stop recording
      stop();
    } else {
      // Already enabled, start recording again
      start();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Single mic button - Enhanced for mobile with NO ROTATION */}
      <button
        onClick={handleMicClick}
        disabled={isTyping}
        title={
          isTyping ? 'AI is responding...' :
          !voiceInput ? 'Enable voice input & speak' : 
          listening ? 'Stop recording' : 'Speak'
        }
        className={`p-2 rounded-xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          isTyping
            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50'
            : listening 
              ? 'bg-red-600/90 shadow-lg shadow-red-500/50 text-white animate-pulse' 
              : voiceInput 
                ? 'bg-slate-700/80 text-green-400 hover:bg-slate-600/80 border border-green-500/30' 
                : 'text-slate-400 hover:bg-slate-700/60 bg-slate-800/50 border border-slate-600/30'
        }`}
        aria-pressed={listening}
        aria-describedby="voice-status"
      >
        <MicrophoneIcon className="h-5 w-5" />
      </button>

      {/* Toggle voice output - Better mobile support */}
      <button
        onClick={() => setVoiceOutput(!voiceOutput)}
        title={voiceOutput ? 'Disable voice output' : 'Enable voice output'}
        className="hidden sm:inline-flex p-2 rounded-xl hover:bg-slate-700/60 bg-slate-800/50 transition-all duration-200 min-w-[44px] min-h-[44px] items-center justify-center active:scale-95 border border-slate-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-pressed={voiceOutput}
        aria-label={voiceOutput ? 'Disable voice output' : 'Enable voice output'}
      >
        {voiceOutput ? (
          <SpeakerWaveIcon className="h-5 w-5 text-green-400" />
        ) : (
          <SpeakerXMarkIcon className="h-5 w-5 text-slate-400" />
        )}
      </button>
      
      {/* Screen reader status indicator */}
      <div id="voice-status" className="sr-only" aria-live="polite">
        {listening ? 'Voice input active, listening for speech' : 
         voiceInput ? 'Voice input enabled, click microphone to start' : 
         'Voice input disabled'}
      </div>
    </div>
  );
};

export default VoiceControls; 