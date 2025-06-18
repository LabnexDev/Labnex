import { useRef, useCallback } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceOutput } = useVoiceSettings();

  const speak = useCallback(async (text: string) => {
    if (!voiceOutput || !text) {
      console.log('[TTS] Skipped - voiceOutput:', voiceOutput, 'text present:', !!text);
      return;
    }
    try {
      if (text.length > 500) text = text.slice(0, 500);
      console.log('[TTS] Sending request …');
      const res = await api.post('/openai/tts', { input: text, voice: 'shimmer' }, { responseType: 'arraybuffer' });
      console.log('[TTS] Response status', res.status, 'size', res.data?.byteLength);
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      console.log('[TTS] Got blob', blob);
      const url = URL.createObjectURL(blob);
      console.log('[TTS] Blob URL', url);
      const audio = new Audio(url);
      audio.onplay = () => console.log('✅ Audio started');
      audio.onerror = (e) => console.error('❌ Audio playback error', e);
      audio.onended = () => { console.log('🔁 Audio ended'); URL.revokeObjectURL(url); };
      await audio.play().catch(err => console.error('❌ play() rejected', err));
      audioRef.current = audio;
    } catch (e: any) {
      console.error('[TTS] request error', e.response?.status, e.response?.data || e.message);
    }
  }, [voiceOutput]);

  return { speak };
} 