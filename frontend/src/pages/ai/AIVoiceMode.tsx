import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceInput, type VoiceInputOptions } from '../../hooks/useVoiceInput';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { aiChatApi } from '../../api/aiChat';
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

type Status = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const AIVoiceMode: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { speak, isSpeaking } = useOpenAITTS();

  const handleListenResult = useCallback(async (transcript: string) => {
    setStatus('processing');
    setTranscript(transcript);

    const commandKeywords = ["create", "update", "assign", "edit", "delete"];
    const hasCommandKeyword = commandKeywords.some(keyword =>
      transcript.toLowerCase().includes(keyword)
    );

    if (hasCommandKeyword) {
      setResponse("I'll open the AI chat to continue.");
      setStatus('speaking');
      await speak("I'll open the AI chat to continue.");
      navigate('/ai');
      return;
    }

    const systemContext = "You are assisting with a QA project called 'Labnex CLI'. The user has tasks and test cases currently active. Respond concisely and naturally to voice queries.";
    const prompt = `${systemContext}\n\nUser: ${transcript}`;

    try {
      const { reply } = await aiChatApi.sendMessage(prompt);
      setResponse(reply);
      setStatus('speaking');
      await speak(reply, () => {
        // When speaking finishes, go back to listening
        setStatus('listening');
        setTranscript('');
        setResponse('');
        startListening();
      });
    } catch (apiError: any) {
      console.error("AI API Error:", apiError);
      setError('Sorry, I had trouble getting a response.');
      setStatus('error');
    }
  }, [navigate, speak]);

  const voiceInputOptions: VoiceInputOptions = {
    enabled: false,
    onResult: handleListenResult,
    onError: (err) => {
      setError(err);
      setStatus('error');
    },
    continuous: false,
    autoRestart: false,
  };

  const { start: startListening, stop: stopListening, isListening, isSupported } = useVoiceInput(voiceInputOptions);

  const handleToggleListening = () => {
    if (!isSupported) {
      setStatus('error');
      setError('Voice input is not supported by your browser.');
      return;
    }

    if (isListening || isSpeaking) {
      stopListening();
      setStatus('idle');
      setTranscript('');
      setResponse('');
    } else {
      setError(null);
      setStatus('listening');
      setTranscript('');
      setResponse('');
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    console.log('Attempting to detect SpeechRecognition API...');
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('SpeechRecognition API not found on window object.');
      console.log('window.SpeechRecognition:', window.SpeechRecognition);
      console.log('window.webkitSpeechRecognition:', (window as any).webkitSpeechRecognition);
    } else {
      console.log('SpeechRecognition API is available!');
    }
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return error || 'An error occurred';
      default:
        return 'Tap to start conversation';
    }
  };

  const getDisplayContent = () => {
    if (status === 'processing' || status === 'listening') {
      return transcript;
    }
    if (status === 'speaking') {
      return response;
    }
    return '';
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-light text-white mb-4 tracking-wide">
            Labnex
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-medium ml-4">
              AI
            </span>
          </h1>
          <div className="h-8 flex items-center justify-center">
            <p className="text-lg md:text-xl text-slate-300 font-light">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Central Microphone Area */}
        <div className="relative mb-12">
          {/* Outer ripple rings */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping scale-150"></div>
              <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping scale-125 delay-75"></div>
              <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-ping scale-110 delay-150"></div>
            </>
          )}
          
          {/* Microphone button */}
          <button
            onClick={handleToggleListening}
            className={`relative group w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/30 ${
              isListening 
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl shadow-purple-500/25' 
                : isSpeaking
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/25'
                : status === 'error'
                ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-2xl shadow-red-500/25'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl shadow-slate-900/50 hover:from-slate-600 hover:to-slate-700'
            }`}
            disabled={status === 'processing'}
          >
            {/* Inner glow effect */}
            <div className={`absolute inset-2 rounded-full transition-all duration-500 ${
              isListening 
                ? 'bg-gradient-to-br from-purple-400/20 to-transparent' 
                : isSpeaking
                ? 'bg-gradient-to-br from-cyan-400/20 to-transparent'
                : 'bg-gradient-to-br from-slate-600/20 to-transparent'
            }`}></div>
            
            {/* Icon */}
            {isSpeaking ? (
              <SpeakerWaveIcon className="w-16 h-16 md:w-20 md:h-20 text-white relative z-10" />
            ) : (
              <MicrophoneIcon className="w-16 h-16 md:w-20 md:h-20 text-white relative z-10" />
            )}
            
            {/* Processing spinner */}
            {status === 'processing' && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
            )}
          </button>
        </div>

        {/* Content Display */}
        <div className="w-full max-w-4xl mx-auto text-center min-h-[120px] flex items-center justify-center">
          {getDisplayContent() && (
            <div className={`transition-all duration-700 transform ${
              getDisplayContent() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl px-8 py-6 border border-slate-700/50 shadow-2xl">
                <p className="text-xl md:text-2xl text-slate-100 leading-relaxed font-light">
                  {getDisplayContent()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4">
            {/* Voice activity indicator */}
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isListening ? 'bg-purple-400 shadow-lg shadow-purple-400/50' : 'bg-slate-600'
            }`}></div>
            
            {/* Processing indicator */}
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              status === 'processing' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-slate-600'
            }`}></div>
            
            {/* Speaking indicator */}
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isSpeaking ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-slate-600'
            }`}></div>
          </div>
        </div>

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md px-6">
            <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl px-6 py-4 text-center">
              <p className="text-red-300 text-sm">
                {error}
              </p>
              <button 
                onClick={() => {
                  setError(null);
                  setStatus('idle');
                }}
                className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIVoiceMode; 