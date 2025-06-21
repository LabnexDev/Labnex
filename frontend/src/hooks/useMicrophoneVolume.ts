import { useEffect, useState } from "react";

export function useMicrophoneVolume() {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    const setupMicrophone = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;

        const data = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        const loop = () => {
          if (isCancelled) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
          setVolume(avg / 255);
          requestAnimationFrame(loop);
        };

        loop();
      } catch (error) {
        console.warn('Microphone access denied or unavailable:', error);
        setVolume(0);
      }
    };

    setupMicrophone();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, []);

  return volume;
} 