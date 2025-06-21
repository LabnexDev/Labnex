import React from 'react';
import { ArrowLeftIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { Orb } from '../../components/visual';

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    error,
    permissionError,
    lastTranscript,
    voiceActivity,
    toggleVoiceMode,
  } = useVoiceAssistant();

  const getStatusText = () => {
    if (error) return 'Error';
    if (permissionError) return 'Mic Permission Needed';
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'idle':
        return 'Tap to Speak';
      default:
        return 'Ready';
    }
  };

  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Go back"
      >
        <ArrowLeftIcon className="w-8 h-8" />
      </button>

      {/* Main Voice Orb */}
      <div className="relative flex flex-col items-center justify-center gap-8">
        <Orb
          isListening={isListening}
          isSpeaking={isSpeaking}
          voiceActivity={voiceActivity}
        />
        
        <button
          onClick={toggleVoiceMode}
          className="w-48 h-48 rounded-full flex items-center justify-center focus:outline-none transition-all duration-300 ease-in-out"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            boxShadow: '0 0 20px rgba(128, 90, 213, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.1)',
          }}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <MicrophoneIcon className={`w-16 h-16 text-white transition-all duration-300 ${isListening ? 'scale-110 text-purple-300' : ''}`} />
        </button>

        <div className="text-center h-16 flex flex-col justify-center">
          <p className="text-2xl font-medium text-gray-200">{getStatusText()}</p>
          {status === 'processing' && lastTranscript && (
            <p className="text-lg text-gray-400 mt-2 italic">"{lastTranscript}"</p>
          )}
        </div>
      </div>
      
      {/* Error Display */}
      {(error || permissionError) && (
        <div className="absolute bottom-8 bg-red-500/20 text-white p-4 rounded-lg shadow-lg text-center max-w-md">
          <p className="font-bold">An Error Occurred</p>
          <p>{error || permissionError}</p>
        </div>
      )}
    </div>
  );
};

export default AIVoiceMode;