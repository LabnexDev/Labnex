import { useRef } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceOutput } = useVoiceSettings();

  const speak = async (text: string) => {
    if (!voiceOutput || !text) return;
    try {
      // Avoid huge payloads
      if (text.length > 500) text = text.slice(0, 500);
      const res = await api.post('/openai/tts', { input: text }, { responseType: 'arraybuffer' });
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      await audioRef.current.play();
      audioRef.current.onended = () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error('TTS failed', e);
    }
  };

  return { speak };
} 