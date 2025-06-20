import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type FatalErrorReason = 'mic-denied' | 'sr-failed' | 'tts-failed';

interface VoiceSystem {
  srRetries: number;
  ttsRetries: number;
  fatalError?: FatalErrorReason;
  lastSystemMessage: string;
  speakStatus: (msg: string) => void;
  bumpSrRetry: () => void;
  resetSrRetry: () => void;
  bumpTtsRetry: () => void;
  resetTtsRetry: () => void;
  setFatalError: (r: FatalErrorReason) => void;
  getHealth: () => { srRetryCount: number; ttsRetryCount: number; lastFatalError?: string; lastSystemMessage: string };
}

const Ctx = createContext<VoiceSystem | undefined>(undefined);

interface Props {
  speak: (msg: string) => void;
  children: React.ReactNode;
}

export const VoiceSystemProvider: React.FC<Props> = ({ speak, children }) => {
  const [srRetries, setSrRetries] = useState(0);
  const [ttsRetries, setTtsRetries] = useState(0);
  const [fatalError, setFatal] = useState<FatalErrorReason | undefined>();
  const [lastSystemMessage, setLastSystemMessage] = useState('');

  // queue to avoid re-entrant speech
  const feedbackQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const processQueue = useCallback(() => {
    if (isSpeakingRef.current) return;
    const next = feedbackQueueRef.current.shift();
    if (!next) return;
    isSpeakingRef.current = true;
    Promise.resolve(speak(next)).finally(() => {
      isSpeakingRef.current = false;
      processQueue();
    });
  }, [speak]);

  const speakStatus = useCallback(
    (msg: string) => {
      setLastSystemMessage(msg);
      feedbackQueueRef.current.push(msg);
      processQueue();
    },
    [processQueue]
  );

  const bumpSrRetry = useCallback(() => {
    setSrRetries(n => n + 1);
  }, []);
  const resetSrRetry = useCallback(() => setSrRetries(0), []);

  const bumpTtsRetry = useCallback(() => {
    setTtsRetries(n => n + 1);
  }, []);
  const resetTtsRetry = useCallback(() => setTtsRetries(0), []);

  const setFatalError = useCallback((r: FatalErrorReason) => {
    setFatal(r);
  }, []);

  return (
    <Ctx.Provider
      value={{
        srRetries,
        ttsRetries,
        fatalError,
        lastSystemMessage,
        speakStatus,
        bumpSrRetry,
        resetSrRetry,
        bumpTtsRetry,
        resetTtsRetry,
        setFatalError,
        getHealth: () => ({ srRetryCount: srRetries, ttsRetryCount: ttsRetries, lastFatalError: fatalError, lastSystemMessage }),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useVoiceSystem = (): VoiceSystem => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useVoiceSystem must be used within VoiceSystemProvider');
  return ctx;
};

// Optional version that returns undefined instead of throwing
export const useVoiceSystemOptional = (): VoiceSystem | undefined => {
  return useContext(Ctx);
}; 