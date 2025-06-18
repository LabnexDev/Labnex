import { useRef, useCallback } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceOutput } = useVoiceSettings();

  const speak = useCallback(async (text: string) => {
    if (!voiceOutput || !text) return;
    try {
      // Avoid huge payloads
      if (text.length > 500) text = text.slice(0, 500);
      const res = await api.post('/openai/tts', { input: text, voice: 'shimmer' }, { responseType: 'arraybuffer' });
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current = new Audio(url);
      audioRef.current.play().catch(err => console.error('Audio play blocked/error', err));
      audioRef.current.onended = () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error('TTS failed', e);
    }
  }, [voiceOutput]);

  return { speak };
} 