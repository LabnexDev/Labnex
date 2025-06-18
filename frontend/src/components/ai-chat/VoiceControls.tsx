import React from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { useAIChat } from '../../contexts/AIChatContext';

const VoiceControls: React.FC = () => {
  const { voiceInput, voiceOutput, setVoiceInput, setVoiceOutput } = useVoiceSettings();
  const { sendMessage } = useAIChat();
  const { listening, start, stop } = useSpeechInput({ enabled: voiceInput, onResult: (txt) => sendMessage(txt) });

  return (
    <div className="flex items-center gap-2">
      {/* Toggle voice input */}
      <button
        onClick={() => setVoiceInput(!voiceInput)}
        title={voiceInput ? 'Disable voice input' : 'Enable voice input'}
        className="hidden sm:inline-flex p-1 rounded hover:bg-slate-700"
      >
        {voiceInput ? <MicrophoneIcon className="h-5 w-5 text-green-400" /> : <MicrophoneIcon className="h-5 w-5 text-slate-400 opacity-50" />}
      </button>

      {/* Record button */}
      {voiceInput && (
        <button
          onClick={listening ? stop : start}
          title={listening ? 'Stop recording' : 'Speak'}
          className={`p-1 rounded ${listening ? 'bg-red-600 animate-pulse' : 'hover:bg-slate-700'}`}
        >
          <MicrophoneIcon className="h-5 w-5" />
        </button>
      )}

      {/* Toggle voice output */}
      <button
        onClick={() => setVoiceOutput(!voiceOutput)}
        title={voiceOutput ? 'Disable voice output' : 'Enable voice output'}
        className="hidden sm:inline-flex p-1 rounded hover:bg-slate-700"
      >
        {voiceOutput ? <SpeakerWaveIcon className="h-5 w-5 text-green-400" /> : <SpeakerXMarkIcon className="h-5 w-5 text-slate-400" />}
      </button>
    </div>
  );
};

export default VoiceControls; 