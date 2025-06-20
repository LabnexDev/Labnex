import { useEffect, useRef } from 'react';
import { useVoiceSystemOptional } from '../contexts/VoiceSystemContext';

interface Params {
  isListening: boolean;
  isSpeaking: boolean;
  voiceActivityLevel: number;
  lastTranscriptTime: number; // timestamp updated on each transcript
}

export function useVoiceHealthMonitor({ isListening, isSpeaking, voiceActivityLevel, lastTranscriptTime }: Params) {
  const voiceSys = useVoiceSystemOptional();
  const srStallRef = useRef<number | null>(null);
  const ttsStartRef = useRef<number | null>(null);

  // Speech recognition stall
  useEffect(() => {
    if (!voiceSys) return;
    if (isListening && voiceActivityLevel > 0.2) {
      if (!srStallRef.current) srStallRef.current = Date.now();
      const elapsed = Date.now() - (srStallRef.current || Date.now());
      if (elapsed > 10_000) {
        voiceSys.speakStatus("I think the microphone got stuck. Restarting it now.");
        voiceSys.bumpSrRetry();
        srStallRef.current = null;
        voiceSys.speakStatus('');
        // Parent responsible for restarting via onerror path
      }
    } else {
      srStallRef.current = null;
    }
  }, [isListening, voiceActivityLevel, voiceSys]);

  // Reset SR stall timer when transcript arrives
  useEffect(() => {
    if (lastTranscriptTime) srStallRef.current = null;
  }, [lastTranscriptTime]);

  // TTS stall detection
  useEffect(() => {
    if (!voiceSys) return;
    if (isSpeaking) {
      if (!ttsStartRef.current) ttsStartRef.current = Date.now();
      const elapsed = Date.now() - (ttsStartRef.current || Date.now());
      if (elapsed > 7_000) {
        voiceSys.speakStatus("Voice output seems stuck. Trying to fix it.");
        voiceSys.bumpTtsRetry();
        window.speechSynthesis.cancel();
        ttsStartRef.current = null;
      }
    } else {
      ttsStartRef.current = null;
    }
  }, [isSpeaking, voiceSys]);
} 