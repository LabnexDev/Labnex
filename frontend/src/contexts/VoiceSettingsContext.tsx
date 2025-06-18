import React, { createContext, useContext, useState, useEffect } from 'react';

interface VoiceSettings {
  voiceInput: boolean;
  voiceOutput: boolean;
  setVoiceInput: (v: boolean) => void;
  setVoiceOutput: (v: boolean) => void;
}

const VoiceSettingsContext = createContext<VoiceSettings | undefined>(undefined);

const STORAGE_KEY = 'labnex-voice-settings';

export const VoiceSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voiceInput, setVoiceInputState] = useState(false);
  const [voiceOutput, setVoiceOutputState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setVoiceInputState(!!parsed.voiceInput);
        setVoiceOutputState(!!parsed.voiceOutput);
      }
    } catch {}
  }, []);

  const persist = (input: boolean, output: boolean) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ voiceInput: input, voiceOutput: output }));
  };

  const setVoiceInput = (v: boolean) => {
    setVoiceInputState(v);
    persist(v, voiceOutput);
  };
  const setVoiceOutput = (v: boolean) => {
    setVoiceOutputState(v);
    persist(voiceInput, v);
  };

  return (
    <VoiceSettingsContext.Provider value={{ voiceInput, voiceOutput, setVoiceInput, setVoiceOutput }}>
      {children}
    </VoiceSettingsContext.Provider>
  );
};

export const useVoiceSettings = (): VoiceSettings => {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) throw new Error('useVoiceSettings must be used within VoiceSettingsProvider');
  return ctx;
}; 