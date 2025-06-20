import { useRef, useCallback, useState, useEffect } from 'react';
import api from '../api/axios';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';
import { useVoiceSystemOptional } from '../contexts/VoiceSystemContext';

export function useOpenAITTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const { voiceOutput } = useVoiceSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceSys = useVoiceSystemOptional();
  const bumpTts = () => voiceSys?.bumpTtsRetry();
  const resetTts = () => voiceSys?.resetTtsRetry();
  const speakStatus = (m:string)=> voiceSys?.speakStatus(m);
  const setFatal = (r:any)=> voiceSys?.setFatalError(r);
  const ttsRetryRef = useRef<Record<string,number>>({});

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

  const speak = useCallback(async (text: string, onEnd?: () => void): Promise<void> => {
    if (!voiceOutput || !text?.trim()) {
      onEnd?.();
      return Promise.resolve();
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
      
      // We'll resolve this promise when playback ends or errors
      let resolvePromise: () => void;
      const playbackPromise = new Promise<void>(res => { resolvePromise = res; });
      
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

      const finish = () => {
        cleanupBlobUrl();
        setIsSpeaking(false);
        resetTts();
        onEnd?.();
        resolvePromise();
      };

      const handleError = (e: any) => {
        // Log error only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('TTS Audio playback error:', e);
        }
        bumpTts();
        const count = (ttsRetryRef.current[text] = (ttsRetryRef.current[text] || 0) + 1);
        if (count === 2) {
          speakStatus?.('Sorry, my voice system encountered a glitch. Retrying…');
        }
        if (count >= 3) {
          speakStatus?.("I'm still unable to speak right now. Please report this issue to the Labnex team.");
          setFatal?.('tts-failed');
          ttsRetryRef.current[text]=0;
          onEnd?.();
          return;
        }
        cleanupBlobUrl();
        setIsSpeaking(false);
        onEnd?.();
        // retry once automatically
        speak(text, onEnd);
      };

      const handleEnd = finish;

      audio.onplay  = () => {
        // Audio started playing successfully
      };
      audio.onerror = handleError;
      audio.onended = handleEnd;

      // Handle interrupted playback
      audio.onpause = () => {
        if (isSpeaking) {
          finish();
        }
      };

      await audio.play().catch(err => {
        handleError(err);
      });

      // Wait until playback completes or errors
      await playbackPromise;

      return;

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
      
      bumpTts();
      const count = (ttsRetryRef.current[text] = (ttsRetryRef.current[text] || 0) + 1);
      if (count === 2) {
        speakStatus?.('Sorry, my voice system encountered a glitch. Retrying…');
      }
      if (count >= 3) {
        speakStatus?.("I'm still unable to speak right now. Please report this issue to the Labnex team.");
        setFatal?.('tts-failed');
        ttsRetryRef.current[text]=0;
        onEnd?.();
        return;
      }
      cleanupBlobUrl();
      setIsSpeaking(false);
      onEnd?.();
      // retry once automatically
      await speak(text, onEnd);
      return;
    }
  }, [voiceOutput, cleanupBlobUrl, isSpeaking, speakStatus, setFatal, bumpTts, resetTts]);

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cleanupBlobUrl();
    setIsSpeaking(false);
    speakStatus?.('Go ahead.');
  }, [cleanupBlobUrl, speakStatus]);

  return { speak, isSpeaking, stopSpeaking };
} 