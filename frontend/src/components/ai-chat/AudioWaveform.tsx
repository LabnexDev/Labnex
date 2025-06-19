import React, { useRef, useEffect, useState } from 'react';

interface AudioWaveformProps {
  audioStream: MediaStream | null;
  isActive?: boolean;
  mode?: 'input' | 'output' | 'idle';
  intensity?: number; // 0-1 for AI output visualization
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  audioStream, 
  isActive = true, 
  mode = 'input',
  intensity = 0 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Set canvas size to match container with device pixel ratio
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      canvasCtx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    // Initialize audio context for input mode
    if (audioStream && mode === 'input' && isActive) {
      try {
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(audioStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      } catch (error) {
        console.error('Error setting up audio context:', error);
      }
    }

    const drawInputWaveform = () => {
      if (!analyser || !dataArray || !isActive) return;
      
      analyser.getByteFrequencyData(dataArray);

      // Calculate audio level
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const level = sum / dataArray.length / 255;
      setAudioLevel(level);

      // Create wave data for drawing
      const newWaveData = [];
      for (let i = 0; i < 64; i++) {
        const index = Math.floor((i / 64) * dataArray.length);
        newWaveData.push(dataArray[index] / 255);
      }

      // Clear canvas
      const rect = canvas.getBoundingClientRect();
      canvasCtx.clearRect(0, 0, rect.width, rect.height);

      // Draw input waveform (circular with reactive colors)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.5;

      // Create dynamic gradient based on audio level
      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, baseRadius + 60
      );
      gradient.addColorStop(0, `rgba(34, 197, 94, ${0.9 * level})`); // Green for input
      gradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.7 * level})`); // Blue
      gradient.addColorStop(0.8, `rgba(147, 51, 234, ${0.5 * level})`); // Purple
      gradient.addColorStop(1, `rgba(79, 70, 229, ${0.2 * level})`);

      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineWidth = 2 + level * 3;

      // Draw reactive circular waveform
      canvasCtx.beginPath();
      for (let i = 0; i < newWaveData.length; i++) {
        const angle = (i / newWaveData.length) * Math.PI * 2;
        const amplitude = newWaveData[i];
        const radius = baseRadius + amplitude * 40;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
      }
      canvasCtx.closePath();
      canvasCtx.stroke();

      // Add inner glow effect
      if (level > 0.05) {
        const innerGradient = canvasCtx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, baseRadius * 0.7
        );
        innerGradient.addColorStop(0, `rgba(34, 197, 94, ${level * 0.3})`);
        innerGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        
        canvasCtx.fillStyle = innerGradient;
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
        canvasCtx.fill();
      }
    };

    const drawOutputWaveform = () => {
      if (!isActive) return;

      const rect = canvas.getBoundingClientRect();
      canvasCtx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.4;

      // Create purple/indigo gradient for AI output
      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius + 80
      );
      gradient.addColorStop(0, `rgba(168, 85, 247, ${0.9 * intensity})`); // Purple for AI
      gradient.addColorStop(0.5, `rgba(147, 51, 234, ${0.7 * intensity})`);
      gradient.addColorStop(1, `rgba(79, 70, 229, ${0.3 * intensity})`);

      // Draw multiple concentric circles with varying intensity
      for (let ring = 0; ring < 4; ring++) {
        const ringRadius = baseRadius + ring * 15;
        const ringIntensity = intensity * (1 - ring * 0.2);
        
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = 1 + ringIntensity * 2;
        canvasCtx.globalAlpha = ringIntensity;
        
        canvasCtx.beginPath();
        // Create pulsing effect
        const pulseRadius = ringRadius + Math.sin(Date.now() * 0.005 + ring) * 5 * intensity;
        canvasCtx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        canvasCtx.stroke();
      }

      canvasCtx.globalAlpha = 1;

      // Add central glow
      if (intensity > 0.1) {
        const centralGradient = canvasCtx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, baseRadius * 0.8
        );
        centralGradient.addColorStop(0, `rgba(168, 85, 247, ${intensity * 0.4})`);
        centralGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        
        canvasCtx.fillStyle = centralGradient;
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
        canvasCtx.fill();
      }
    };

    const drawIdleWaveform = () => {
      const rect = canvas.getBoundingClientRect();
      canvasCtx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.3;

      // Subtle ambient animation
      const time = Date.now() * 0.001;
      const pulseIntensity = 0.1 + Math.sin(time) * 0.05;

      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius + 20
      );
      gradient.addColorStop(0, `rgba(100, 116, 139, ${pulseIntensity})`); // Slate for idle
      gradient.addColorStop(1, 'rgba(100, 116, 139, 0)');

      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, baseRadius + Math.sin(time * 2) * 3, 0, Math.PI * 2);
      canvasCtx.stroke();
    };

    const animate = () => {
      if (!isActive && mode !== 'idle') {
        // Clear canvas when inactive
        const rect = canvas.getBoundingClientRect();
        canvasCtx.clearRect(0, 0, rect.width, rect.height);
        return;
      }

      switch (mode) {
        case 'input':
          drawInputWaveform();
          break;
        case 'output':
          drawOutputWaveform();
          break;
        case 'idle':
          drawIdleWaveform();
          break;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioStream, isActive, mode, intensity]);

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-30'
        }`}
        style={{ 
          filter: `blur(${mode === 'input' && audioLevel > 0.05 ? 0 : mode === 'idle' ? 0.5 : 0}px)`,
          transform: `scale(${mode === 'output' && intensity > 0.3 ? 1.02 : 1})`,
        }}
      />
      
      {/* Optional overlay effects */}
      {mode === 'output' && intensity > 0.5 && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(168, 85, 247, ${intensity * 0.1}) 0%, transparent 70%)`,
            animation: 'pulse 2s infinite'
          }}
        />
      )}
    </div>
  );
};

export default AudioWaveform; 