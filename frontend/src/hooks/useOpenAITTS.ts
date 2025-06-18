import { useRef, useCallback } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceOutput } = useVoiceSettings();

  const speak = useCallback(async (text: string) => {
    if (!voiceOutput || !text?.trim()) {
      console.log('[TTS] Skipped – voiceOutput:', voiceOutput, 'text len:', text?.length);
      return;
    }

    try {
      // Strip code blocks & trim length
      text = text.replace(/```[\s\S]*?```/g, '').trim().slice(0, 500);

      console.log('[TTS] Fetching audio…');
      const res = await api.post(
        '/openai/tts',
        { model: 'tts-1', input: text, voice: 'shimmer', format: 'mp3' },
        { responseType: 'arraybuffer' }
      );

      console.log('[TTS] Response', res.status, 'bytes', res.data.byteLength);
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      console.log('[TTS] Blob type', blob.type, 'size', blob.size);

      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);

      audio.onplay  = () => console.log('✅ Audio started');
      audio.onerror = (e) => console.error('❌ Audio playback error', e);
      audio.onended = () => { console.log('🔁 Audio ended'); URL.revokeObjectURL(url); };

      await audio.play().catch(err => console.error('❌ play() rejected', err));
      audioRef.current = audio;
    } catch (err: any) {
      console.error('[TTS] Request failed', err.response?.status, err.message);
    }
  }, [voiceOutput]);

  return { speak };
} 