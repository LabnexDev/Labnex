import { useState, useEffect, useRef, useCallback } from 'react';
import { useMicrophone } from './useMicrophone';
import { useOpenAITTS } from './useOpenAITTS';
import { createMultiTurnVoiceProcessor, type MultiTurnVoiceResult } from '../utils/multiTurnVoiceHandler';
import { useCurrentProjectId } from './useCurrentProjectId';
import { useNavigate } from 'react-router-dom';

type VoiceAssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceAssistantStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  
  const { permissionError, startMicrophone, stopMicrophone, voiceActivity } = useMicrophone();
  const { speak, isSpeaking, stopSpeaking } = useOpenAITTS();
  const currentProjectId = useCurrentProjectId();
  const navigate = useNavigate();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processorRef = useRef(createMultiTurnVoiceProcessor({
    navigate: (path: string) => navigate(path),
    currentProjectId: currentProjectId,
  }));
  const isListeningRef = useRef(false);

  const processTranscript = useCallback(async (transcript: string) => {
    setLastTranscript(transcript);
    setStatus('processing');
    
    const result: MultiTurnVoiceResult = await processorRef.current.processVoiceTranscript(transcript);

    if (result.response) {
      setStatus('speaking');
      await speak(result.response);
    }
    
    if (result.isComplete) {
      processorRef.current.reset();
      setStatus('idle');
    } else {
        // If more input is needed, we can either prompt or just go back to listening
        setStatus('listening');
    }
  }, [speak]);


  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
        isListeningRef.current = false;
    }
  }, []);
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
        try {
            recognitionRef.current.start();
            isListeningRef.current = true;
        } catch(e) {
            console.error("Could not start recognition", e)
        }
    }
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // Process after each utterance
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript) {
        processTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
        setStatus('error');
      }
    };

    recognition.onend = () => {
        if (status === 'listening') {
            setStatus('idle');
        }
    };
    
    recognitionRef.current = recognition;

  }, [processTranscript, status]);


  // Automatically start listening when AI stops speaking
  useEffect(() => {
    if (!isSpeaking && status === 'speaking') {
      if(processorRef.current.isProcessing()) {
        startListening();
      } else {
        setStatus('idle');
      }
    }
  }, [isSpeaking, status, startListening]);


  const toggleVoiceMode = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
      stopListening();
    } else {
      startListening();
    }
  }, [isListeningRef, isSpeaking, startListening, stopListening, stopSpeaking]);

  useEffect(() => {
    startMicrophone();
    return () => {
      stopMicrophone();
      stopListening();
    }
  }, [startMicrophone, stopMicrophone, stopListening]);

  return {
    status,
    error,
    permissionError,
    lastTranscript,
    voiceActivity,
    isSpeaking,
    toggleVoiceMode,
  };
} 