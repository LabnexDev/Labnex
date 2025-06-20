import React, { createContext, useContext, useState, useEffect } from 'react';

interface VoiceSettings {
  voiceInput: boolean;
  voiceOutput: boolean;
  handsFreeEnabled: boolean;
  similarityThreshold: number; // 0–1
  amplitudeThreshold: number; // 0–1
  setVoiceInput: (v: boolean) => void;
  setVoiceOutput: (v: boolean) => void;
  setHandsFreeEnabled: (v: boolean) => void;
  setSimilarityThreshold: (v: number) => void;
  setAmplitudeThreshold: (v: number) => void;
}

const VoiceSettingsContext = createContext<VoiceSettings | undefined>(undefined);

const STORAGE_KEY = 'labnex-voice-settings';

export const VoiceSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voiceInput, setVoiceInputState] = useState(false);
  const [voiceOutput, setVoiceOutputState] = useState(false);
  const [handsFreeEnabled, setHandsFreeEnabledState] = useState(false);
  const [similarityThreshold, setSimilarityThresholdState] = useState(0.7);
  const [amplitudeThreshold, setAmplitudeThresholdState] = useState(0.15);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setVoiceInputState(!!parsed.voiceInput);
        setVoiceOutputState(!!parsed.voiceOutput);
        setHandsFreeEnabledState(!!parsed.handsFreeEnabled);
        setSimilarityThresholdState(parsed.similarityThreshold ?? 0.7);
        setAmplitudeThresholdState(parsed.amplitudeThreshold ?? 0.15);
      }
    } catch {}
  }, []);

  const persist = (
    input: boolean,
    output: boolean,
    handsFree: boolean,
    sim: number,
    amp: number
  ) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        voiceInput: input,
        voiceOutput: output,
        handsFreeEnabled: handsFree,
        similarityThreshold: sim,
        amplitudeThreshold: amp
      })
    );
  };

  const setVoiceInput = (v: boolean) => {
    setVoiceInputState(v);
    persist(v, voiceOutput, handsFreeEnabled, similarityThreshold, amplitudeThreshold);
  };
  const setVoiceOutput = (v: boolean) => {
    setVoiceOutputState(v);
    persist(voiceInput, v, handsFreeEnabled, similarityThreshold, amplitudeThreshold);
  };

  const setHandsFreeEnabled = (v: boolean) => {
    setHandsFreeEnabledState(v);
    persist(voiceInput, voiceOutput, v, similarityThreshold, amplitudeThreshold);
  };

  const setSimilarityThreshold = (v: number) => {
    setSimilarityThresholdState(v);
    persist(voiceInput, voiceOutput, handsFreeEnabled, v, amplitudeThreshold);
  };

  const setAmplitudeThreshold = (v: number) => {
    setAmplitudeThresholdState(v);
    persist(voiceInput, voiceOutput, handsFreeEnabled, similarityThreshold, v);
  };

  return (
    <VoiceSettingsContext.Provider
      value={{
        voiceInput,
        voiceOutput,
        handsFreeEnabled,
        similarityThreshold,
        amplitudeThreshold,
        setVoiceInput,
        setVoiceOutput,
        setHandsFreeEnabled,
        setSimilarityThreshold,
        setAmplitudeThreshold
      }}
    >
      {children}
    </VoiceSettingsContext.Provider>
  );
};

export const useVoiceSettings = (): VoiceSettings => {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) throw new Error('useVoiceSettings must be used within VoiceSettingsProvider');
  return ctx;
}; 