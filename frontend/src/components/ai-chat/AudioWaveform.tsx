import React, { useRef, useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioStream: MediaStream | null;
  isActive?: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioStream, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!audioStream || !canvasRef.current || !isActive) {
      // Clear canvas when inactive
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Set canvas size to match container
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;
      
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Calculate audio level for additional effects
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const level = sum / dataArray.length / 255;
      setAudioLevel(level);

      // Clear canvas
      canvasCtx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      // Draw circular waveform
      const centerX = canvas.width / window.devicePixelRatio / 2;
      const centerY = canvas.height / window.devicePixelRatio / 2;
      const radius = Math.min(centerX, centerY) * 0.6;

      // Create gradient
      const gradient = canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius + 50);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${0.8 * level})`);
      gradient.addColorStop(0.5, `rgba(147, 51, 234, ${0.6 * level})`);
      gradient.addColorStop(1, `rgba(79, 70, 229, ${0.3 * level})`);

      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineWidth = 3;

      // Draw waveform as expanding circles
      for (let i = 0; i < bufferLength; i += 4) {
        const amplitude = dataArray[i] / 255;
        const angle = (i / bufferLength) * Math.PI * 2;
        const waveRadius = radius + amplitude * 30;

        const x = centerX + Math.cos(angle) * waveRadius;
        const y = centerY + Math.sin(angle) * waveRadius;

        if (i === 0) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
      }

      canvasCtx.closePath();
      canvasCtx.stroke();

      // Add pulsing effect for high audio levels
      if (level > 0.1) {
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, radius * (1 + level * 0.3), 0, Math.PI * 2);
        canvasCtx.strokeStyle = `rgba(168, 85, 247, ${level * 0.3})`;
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
      }
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
      audioContext.close();
    };
  }, [audioStream, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      style={{ filter: `blur(${audioLevel > 0.05 ? 0 : 1}px)` }}
    />
  );
};

export default AudioWaveform; 