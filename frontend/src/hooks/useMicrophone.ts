import { useState, useCallback, useRef } from 'react';

export function useMicrophone() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMicrophone = useCallback(async () => {
    if (streamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setAudioStream(stream);
      setPermissionError(null);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone permission denied. Please enable it in your browser settings and refresh.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please connect a microphone and try again.');
      } else {
        setPermissionError('An error occurred while accessing the microphone.');
        console.error('getUserMedia error:', err);
      }
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setAudioStream(null);
    }
  }, []);

  return { audioStream, permissionError, startMicrophone, stopMicrophone };
} 