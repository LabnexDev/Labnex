import { useRef, useCallback, useState, useEffect } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const { voiceOutput } = useVoiceSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup function for blob URLs
  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupBlobUrl();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cleanupBlobUrl]);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!voiceOutput || !text?.trim()) {
      onEnd?.();
      return;
    }

    try {
      // Cleanup previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      cleanupBlobUrl();

      setIsSpeaking(true);
      // Strip code blocks & trim length
      text = text.replace(/```[\s\S]*?```/g, '').trim().slice(0, 500);
      
      const res = await api.post(
        '/openai/tts',
        { model: 'tts-1', input: text, voice: 'shimmer', format: 'mp3' },
        { responseType: 'arraybuffer', timeout: 30000 } // Add timeout
      );

      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      currentBlobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      // Enhanced error handling with cleanup
      const handleError = (e: any) => {
        // Log error only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('TTS Audio playback error:', e);
        }
        cleanupBlobUrl();
        setIsSpeaking(false);
        onEnd?.();
      };

      const handleEnd = () => {
        cleanupBlobUrl();
        setIsSpeaking(false);
        onEnd?.();
      };

      audio.onplay  = () => {
        // Audio started playing successfully
      };
      audio.onerror = handleError;
      audio.onended = handleEnd;

      // Handle interrupted playback
      audio.onpause = () => {
        if (isSpeaking) {
          cleanupBlobUrl();
          setIsSpeaking(false);
          onEnd?.();
        }
      };

      await audio.play().catch(err => {
        handleError(err);
      });

    } catch (err: any) {
      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.error('[TTS] Request failed', err.response?.status, err.message);
        
        // Provide user feedback for specific errors
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          console.warn('[TTS] Request timed out - audio generation may be slow');
        } else if (err.response?.status === 429) {
          console.warn('[TTS] Rate limited - please wait before trying again');
        }
      }
      
      cleanupBlobUrl();
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [voiceOutput, cleanupBlobUrl, isSpeaking]);

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cleanupBlobUrl();
    setIsSpeaking(false);
  }, [cleanupBlobUrl]);

  return { speak, isSpeaking, stopSpeaking };
} 