import React, { useRef, useEffect, useCallback } from 'react';

interface VoiceRingWaveformProps {
  volume?: number; // 0 to 1
  size?: number;   // Canvas size (default 300)
  isActive?: boolean; // Whether to animate
}

export const VoiceRingWaveform: React.FC<VoiceRingWaveformProps> = ({
  volume = 0.6,
  size = 300,
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.3; // Base ring radius
    const waveAmplitude = 20 * volume; // How much the wave varies
    const numPoints = 128; // More points for smoother curves
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw multiple flowing lines for the effect
    const numLines = 3;
    
    for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
      const lineOffset = (lineIndex / numLines) * Math.PI * 0.5;
      const lineOpacity = 0.8 - (lineIndex * 0.2);
      const lineWidth = 3 - (lineIndex * 0.5);
      
      // Create gradient for this line
      const gradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius - 30, 
        centerX, centerY, baseRadius + 30
      );
      
      if (lineIndex === 0) {
        // Main line - brightest
        gradient.addColorStop(0, `rgba(255, 255, 255, ${lineOpacity})`);
        gradient.addColorStop(0.3, `rgba(168, 85, 247, ${lineOpacity})`); // Purple-500
        gradient.addColorStop(0.7, `rgba(147, 51, 234, ${lineOpacity})`); // Purple-600
        gradient.addColorStop(1, `rgba(126, 34, 206, ${lineOpacity * 0.5})`); // Purple-700
      } else {
        // Secondary lines - more purple
        gradient.addColorStop(0, `rgba(196, 181, 253, ${lineOpacity * 0.6})`); // Purple-200
        gradient.addColorStop(0.5, `rgba(147, 51, 234, ${lineOpacity})`); // Purple-600
        gradient.addColorStop(1, `rgba(88, 28, 135, ${lineOpacity * 0.3})`); // Purple-800
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Add glow effect
      ctx.shadowColor = lineIndex === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(147, 51, 234, 0.3)';
      ctx.shadowBlur = lineIndex === 0 ? 12 : 6;
      
      // Generate smooth flowing points
      const points: { x: number; y: number }[] = [];
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        
        // Create flowing waves with different frequencies and phases
        const wave1 = Math.sin(angle * 2 + time * 0.002 + lineOffset) * 0.6;
        const wave2 = Math.sin(angle * 3 - time * 0.003 + lineOffset) * 0.4;
        const wave3 = Math.sin(angle * 5 + time * 0.001 + lineOffset) * 0.3;
        const wave4 = Math.cos(angle * 4 - time * 0.0025 + lineOffset) * 0.2;
        
        // Combine waves for complex, flowing pattern
        const combinedWave = (wave1 + wave2 + wave3 + wave4) / 4;
        
        // Add some randomness for organic feel
        const noise = Math.sin(angle * 7 + time * 0.004 + lineOffset) * 0.1;
        
        // Calculate radius with wave distortion
        const radiusOffset = (combinedWave + noise) * waveAmplitude;
        const radius = baseRadius + radiusOffset + (lineIndex * 3);
        
        // Convert to cartesian coordinates
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        points.push({ x, y });
      }
      
      // Draw smooth curve using quadratic curves
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        
        // Calculate control point for smooth curve
        const controlX = (currentPoint.x + nextPoint.x) / 2;
        const controlY = (currentPoint.y + nextPoint.y) / 2;
        
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
      }
      
      // Close the path smoothly
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y);
      
      ctx.stroke();
    }
    
    // Add subtle inner glow
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 15, 0, Math.PI * 2);
    ctx.stroke();
    
  }, [size, volume]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    timeRef.current += 16; // ~60fps
    draw(ctx, timeRef.current);
    
    if (isActive) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [draw, isActive]);

  useEffect(() => {
    if (isActive) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isActive]);

  // Initial draw when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    draw(ctx, 0);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: size,
        height: size,
      }}
    />
  );
};

export default VoiceRingWaveform; 