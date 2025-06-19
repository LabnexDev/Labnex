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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const isInitialized = useRef(false);

  // Check if device is mobile for performance optimization
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Set canvas size to match container with device pixel ratio
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Limit DPR on mobile for better performance
      const limitedDpr = isMobile ? Math.min(dpr, 2) : dpr;
      
      // Reset canvas size and clear any previous scaling
      canvas.width = rect.width * limitedDpr;
      canvas.height = rect.height * limitedDpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Apply scaling once and reset transform to prevent drift
      canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
      canvasCtx.scale(limitedDpr, limitedDpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize audio context for input mode with mobile compatibility
    const initializeAudioContext = async () => {
      if (audioStream && mode === 'input' && isActive && !isInitialized.current) {
        try {
          // Create audio context with mobile-friendly settings
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Web Audio API not supported');
            }
            return;
          }

          audioContextRef.current = new AudioContextClass({
            sampleRate: isMobile ? 16000 : 44100, // Lower sample rate for mobile
          });

          // Handle audio context state on mobile (requires user interaction)
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          const source = audioContextRef.current.createMediaStreamSource(audioStream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          
          // Optimize FFT size for mobile
          analyserRef.current.fftSize = isMobile ? 256 : 512;
          analyserRef.current.smoothingTimeConstant = 0.8;
          
          source.connect(analyserRef.current);
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
          isInitialized.current = true;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error setting up audio context:', error);
          }
        }
      }
    };

    initializeAudioContext();

    const drawInputWaveform = () => {
      if (!analyserRef.current || !dataArrayRef.current || !isActive) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Calculate audio level with mobile optimization
      const samples = isMobile ? 32 : 64; // Fewer samples on mobile
      const sum = dataArrayRef.current.slice(0, samples).reduce((a, b) => a + b, 0);
      const level = sum / samples / 255;
      setAudioLevel(level);

      // Create wave data for drawing
      const newWaveData = [];
      const waveDataLength = isMobile ? 32 : 64;
      for (let i = 0; i < waveDataLength; i++) {
        const index = Math.floor((i / waveDataLength) * dataArrayRef.current.length);
        newWaveData.push(dataArrayRef.current[index] / 255);
      }

      // Clear canvas using internal dimensions
      const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;
      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw input waveform (circular with reactive colors)
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const baseRadius = Math.min(centerX, centerY) * (isMobile ? 0.4 : 0.5);

      // Create dynamic gradient based on audio level with mobile optimization
      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, baseRadius + (isMobile ? 40 : 60)
      );
      gradient.addColorStop(0, `rgba(34, 197, 94, ${0.9 * level})`); // Green for input
      gradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.7 * level})`); // Blue
      gradient.addColorStop(0.8, `rgba(147, 51, 234, ${0.5 * level})`); // Purple
      gradient.addColorStop(1, `rgba(79, 70, 229, ${0.2 * level})`);

      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineWidth = 2 + level * (isMobile ? 2 : 3);

      // Draw reactive circular waveform
      canvasCtx.beginPath();
      for (let i = 0; i < newWaveData.length; i++) {
        const angle = (i / newWaveData.length) * Math.PI * 2;
        const amplitude = newWaveData[i];
        const radius = baseRadius + amplitude * (isMobile ? 25 : 40);
        
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

      // Add inner glow effect with mobile optimization
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

      const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;
      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const baseRadius = Math.min(centerX, centerY) * (isMobile ? 0.35 : 0.4);

      // Create purple/indigo gradient for AI output
      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius + (isMobile ? 60 : 80)
      );
      gradient.addColorStop(0, `rgba(168, 85, 247, ${0.9 * intensity})`); // Purple for AI
      gradient.addColorStop(0.5, `rgba(147, 51, 234, ${0.7 * intensity})`);
      gradient.addColorStop(1, `rgba(79, 70, 229, ${0.3 * intensity})`);

      // Draw multiple concentric circles with varying intensity
      const ringCount = isMobile ? 3 : 4;
      for (let ring = 0; ring < ringCount; ring++) {
        const ringRadius = baseRadius + ring * (isMobile ? 12 : 15);
        const ringIntensity = intensity * (1 - ring * 0.2);
        
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = 1 + ringIntensity * 2;
        canvasCtx.globalAlpha = ringIntensity;
        
        canvasCtx.beginPath();
        // Create pulsing effect with reduced complexity on mobile
        const pulseRadius = ringRadius + Math.sin(Date.now() * 0.005 + ring) * (isMobile ? 3 : 5) * intensity;
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
      const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;
      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const baseRadius = Math.min(centerX, centerY) * (isMobile ? 0.25 : 0.3);

      // Subtle ambient animation
      const time = Date.now() * 0.001;
      const pulseIntensity = 0.1 + Math.sin(time) * 0.05;

      const gradient = canvasCtx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius + 30
      );
      gradient.addColorStop(0, `rgba(100, 116, 139, ${pulseIntensity})`);
      gradient.addColorStop(1, 'rgba(100, 116, 139, 0)');

      canvasCtx.fillStyle = gradient;
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, baseRadius + Math.sin(time * 0.5) * 5, 0, Math.PI * 2);
      canvasCtx.fill();
    };

    const animate = () => {
      if (!canvasCtx) return;

      switch (mode) {
        case 'input':
          drawInputWaveform();
          break;
        case 'output':
          drawOutputWaveform();
          break;
        default:
          drawIdleWaveform();
          break;
      }

      if (isActive) {
        // Reduce frame rate on mobile for better performance
        const frameRate = isMobile ? 30 : 60;
        setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(animate);
        }, 1000 / frameRate);
      }
    };

    animate();

    return () => {
      // Remove event listeners
      window.removeEventListener('resize', updateCanvasSize);
      
      // Cancel animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
      }
      
      // Clean up audio context properly
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('AudioContext cleanup error:', err);
          }
        });
      }
      
      // Reset refs to prevent memory leaks
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
      isInitialized.current = false;
    };
  }, [audioStream, isActive, mode, intensity, isMobile]);

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
          transformOrigin: 'center center',
          position: 'absolute',
          top: '0',
          left: '0',
          willChange: 'transform',
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