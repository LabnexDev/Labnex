import { useEffect, useRef, useState, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceInputOptions {
  onResult: (text: string, confidence?: number) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: VoiceState) => void;
  enabled: boolean;
  continuous?: boolean;
  autoRestart?: boolean;
  silenceTimeout?: number; // ms
  language?: string;
  detectWakeWord?: boolean;
  wakeWords?: string[];
  inactivityTimeout?: number; // ms
}

export interface VoiceInputReturn {
  state: VoiceState;
  isListening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  isSupported: boolean;
  wakeWordDetected: boolean;
  isRunning: boolean;
}

export function useVoiceInput({
  onResult,
  onError,
  onStateChange,
  enabled,
  continuous = true,
  autoRestart = true,
  silenceTimeout = 3000,
  language = 'en-US',
  detectWakeWord = false,
  wakeWords = [],
  inactivityTimeout = 10000 // ms
}: VoiceInputOptions): VoiceInputReturn {
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyStoppedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isRunningRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  // Update state and notify parent
  const updateState = useCallback((newState: VoiceState) => {
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Handle errors with retry logic
  const handleError = useCallback((errorMessage: string, shouldRetry = false) => {
    setError(errorMessage);
    updateState('error');
    onError?.(errorMessage);

    if (shouldRetry && autoRestart && retryCountRef.current < maxRetries && !isManuallyStoppedRef.current) {
      retryCountRef.current++;
      setTimeout(() => {
        if (!isManuallyStoppedRef.current && enabled && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.warn('Auto-retry failed:', err);
          }
        }
      }, 1000 * retryCountRef.current); // Exponential backoff
    }
  }, [autoRestart, enabled, onError, updateState]);

  // Clear timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      handleError('Speech recognition not supported in this browser');
      return;
    }

    setIsSupported(true);
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      clearTimeouts();
      updateState('listening');
      setError(null);
      retryCountRef.current = 0;
      isRunningRef.current = true;
      lastActivityRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      updateState('processing');
      lastActivityRef.current = Date.now();

      const result = event.results[event.results.length - 1];
      const cleaned = result[0].transcript.trim();
      const confidence = result[0].confidence ?? 1;

      // Wake-word logic
      if (cleaned) {
        if (detectWakeWord && wakeWords.length > 0) {
          const matched = wakeWords.find(w => cleaned.toLowerCase().includes(w.toLowerCase()));
          if (!matched) {
            // Ignore speech without wake word
            updateState('idle');
            return;
          }
          setWakeWordDetected(true);
        }

        onResult(cleaned, confidence);
        setWakeWordDetected(false);
      }

      // Auto-restart if continuous and not manually stopped
      if (continuous && autoRestart && !isManuallyStoppedRef.current && enabled) {
        setTimeout(() => {
          if (!isManuallyStoppedRef.current && enabled) {
            try {
              recognition.start();
            } catch (err) {
              // Recognition might already be running
              console.warn('Recognition restart failed:', err);
            }
          } else {
            updateState('idle');
          }
        }, 500);
      } else {
        updateState('idle');
      }
    };

    recognition.onerror = (event: any) => {
      isRunningRef.current = false;
      const errorType = event.error;
      let errorMessage = 'Speech recognition error';
      let shouldRetry = false;

      switch (errorType) {
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected';
          shouldRetry = autoRestart;
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or audio capture failed';
          break;
        case 'network':
          errorMessage = 'Network error during speech recognition';
          shouldRetry = autoRestart;
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted';
          shouldRetry = autoRestart && !isManuallyStoppedRef.current;
          break;
        default:
          errorMessage = `Speech recognition error: ${errorType}`;
          shouldRetry = autoRestart;
      }

      handleError(errorMessage, shouldRetry);
      lastActivityRef.current = Date.now();
    };

    recognition.onend = () => {
      isRunningRef.current = false;
      // If we're supposed to be listening continuously and haven't been manually stopped
      if (continuous && autoRestart && !isManuallyStoppedRef.current && enabled && state === 'listening') {
        // Set a timeout to restart
        timeoutRef.current = setTimeout(() => {
          if (!isManuallyStoppedRef.current && enabled) {
            try {
              recognition.start();
            } catch (err) {
              handleError('Failed to restart speech recognition', true);
            }
          }
        }, 100);
      } else if (!isManuallyStoppedRef.current) {
        updateState('idle');
      }
      lastActivityRef.current = Date.now();
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeouts();
      if (recognition && isRunningRef.current) {
        try {
          recognition.stop();
        } catch (err) {
          console.warn('Error stopping recognition:', err);
        }
      }
    };
  }, [continuous, language, autoRestart, enabled, onResult, handleError, updateState, clearTimeouts, state, detectWakeWord, wakeWords]);

  // Start listening
  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current || !enabled) {
      handleError('Speech recognition not available');
      return;
    }

    if (isRunningRef.current) {
      updateState('listening');
      return;
    }

    isManuallyStoppedRef.current = false;
    clearTimeouts();
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        updateState('listening');
      } else {
        handleError(`Failed to start speech recognition: ${err.message}`);
      }
    }
  }, [isSupported, enabled, handleError, updateState, clearTimeouts]);

  // Stop listening
  const stop = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearTimeouts();

    if (recognitionRef.current && isRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }

    updateState('idle');
    setError(null);
    retryCountRef.current = 0;
  }, [updateState, clearTimeouts]);

  // Toggle listening
  const toggle = useCallback(() => {
    if (state === 'listening' || state === 'processing') {
      stop();
    } else {
      start();
    }
  }, [state, start, stop]);

  // Handle silence timeout
  useEffect(() => {
    if (state === 'listening' && silenceTimeout > 0) {
      timeoutRef.current = setTimeout(() => {
        if (autoRestart && !isManuallyStoppedRef.current && enabled) {
          // Restart recognition
          try {
            recognitionRef.current?.stop();
            setTimeout(() => {
              if (!isManuallyStoppedRef.current && enabled) {
                start();
              }
            }, 100);
          } catch (err) {
            handleError('Silence timeout restart failed', true);
          }
        }
      }, silenceTimeout);

      return () => clearTimeouts();
    }
  }, [state, silenceTimeout, autoRestart, enabled, start, handleError, clearTimeouts]);

  // Inactivity watchdog – restart recognition if no activity for inactivityTimeout
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (isRunningRef.current && state === 'listening' && now - lastActivityRef.current > inactivityTimeout) {
        // Force restart if stuck
        try {
          recognitionRef.current?.stop();
          // Will auto-restart via onend logic (autoRestart) or start manually
          if (!autoRestart) {
            setTimeout(() => {
              if (enabled && !isManuallyStoppedRef.current) {
                recognitionRef.current?.start();
              }
            }, 200);
          }
        } catch (err) {
          console.warn('Watchdog restart failed:', err);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [enabled, inactivityTimeout, autoRestart, state]);

  return {
    state,
    isListening: state === 'listening',
    error,
    start,
    stop,
    toggle,
    isSupported,
    wakeWordDetected,
    isRunning: isRunningRef.current,
  };
} 