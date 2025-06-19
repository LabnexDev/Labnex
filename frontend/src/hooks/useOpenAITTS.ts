import { useRef, useCallback, useState } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceOutput } = useVoiceSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!voiceOutput || !text?.trim()) {
      onEnd?.();
      return;
    }

    try {
      setIsSpeaking(true);
      // Strip code blocks & trim length
      text = text.replace(/```[\s\S]*?```/g, '').trim().slice(0, 500);
      
      const res = await api.post(
        '/openai/tts',
        { model: 'tts-1', input: text, voice: 'shimmer', format: 'mp3' },
        { responseType: 'arraybuffer' }
      );

      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) audioRef.current.pause();
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay  = () => console.log('✅ TTS Audio started');
      audio.onerror = (e) => {
        console.error('❌ TTS Audio playback error', e);
        setIsSpeaking(false);
        onEnd?.();
      };
      audio.onended = () => {
        console.log('✅ TTS Audio ended');
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        onEnd?.();
      };

      await audio.play().catch(err => {
        console.error('❌ TTS play() rejected', err);
        setIsSpeaking(false);
        onEnd?.();
      });

    } catch (err: any) {
      console.error('[TTS] Request failed', err.response?.status, err.message);
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [voiceOutput]);

  return { speak, isSpeaking };
} 