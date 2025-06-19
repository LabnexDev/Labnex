import React from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { useAIChat } from '../../contexts/AIChatContext';

const VoiceControls: React.FC = () => {
  const { voiceInput, voiceOutput, setVoiceInput, setVoiceOutput } = useVoiceSettings();
  const { sendMessage } = useAIChat();
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
      {/* Single mic button - Enhanced for mobile */}
      <button
        onClick={handleMicClick}
        title={!voiceInput ? 'Enable voice input & speak' : listening ? 'Stop recording' : 'Speak'}
        className={`p-2 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 ${
          listening 
            ? 'bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
            : voiceInput 
              ? 'bg-slate-700 text-green-400 hover:bg-slate-600' 
              : 'text-slate-400 hover:bg-slate-700 bg-slate-800/50'
        }`}
      >
        <MicrophoneIcon className="h-5 w-5" />
      </button>

      {/* Toggle voice output - Better mobile support */}
      <button
        onClick={() => setVoiceOutput(!voiceOutput)}
        title={voiceOutput ? 'Disable voice output' : 'Enable voice output'}
        className="hidden sm:inline-flex p-2 rounded-lg hover:bg-slate-700 bg-slate-800/50 transition-all duration-200 min-w-[44px] min-h-[44px] items-center justify-center active:scale-95"
      >
        {voiceOutput ? (
          <SpeakerWaveIcon className="h-5 w-5 text-green-400" />
        ) : (
          <SpeakerXMarkIcon className="h-5 w-5 text-slate-400" />
        )}
      </button>
    </div>
  );
};

export default VoiceControls; 