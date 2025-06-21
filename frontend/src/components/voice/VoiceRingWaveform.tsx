import React, { useEffect, useRef } from "react";
import { useMicrophoneVolume } from "../../hooks/useMicrophoneVolume";

const SIZE = 300; // Reduced size to fit better with the orb
const RADIUS = SIZE / 3;

interface VoiceRingWaveformProps {
  isActive?: boolean;
  status?: 'idle' | 'listening' | 'speaking' | 'processing';
}

export const VoiceRingWaveform: React.FC<VoiceRingWaveformProps> = ({
  isActive = true,
  status = 'idle'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const micVolume = useMicrophoneVolume();
  const smoothedVolume = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  // Determine which volume to use based on status 
  const getActiveVolume = () => {
    if (status === 'listening') {
      return micVolume; // Use microphone volume when listening
    } else if (status === 'speaking' || status === 'processing') {
      // For speaking/processing, create synthetic volume for visual feedback
      return 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
    }
    return 0.1; // Minimal activity when idle
  };

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      time += 0.02;

      // Smooth volume for fluid animation
      const currentVolume = getActiveVolume();
      smoothedVolume.current += (currentVolume - smoothedVolume.current) * 0.05;
      const amp = 10 + smoothedVolume.current * 30;

      // Clear canvas
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      
      // Center the drawing
      ctx.translate(SIZE / 2, SIZE / 2);
      
      // Draw smooth waveform rings
      const layers = 2; // Reduced layers for cleaner look
      
      for (let layer = 0; layer < layers; layer++) {
        const layerOpacity = 0.8 - (layer * 0.3);
        const layerRadius = RADIUS + (layer * 15);
        const layerAmp = amp * (0.8 - layer * 0.3);
        
        ctx.beginPath();
        
        const points = 64; // Fewer points for smoother curves
        const coordinates: { x: number; y: number }[] = [];
        
        // Calculate all points first
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Create smoother, more organic wave pattern
          const wave1 = Math.sin(angle * 3 + time * 1.5) * layerAmp * 0.6;
          const wave2 = Math.sin(angle * 5 + time * 2) * layerAmp * 0.3;
          const wave3 = Math.cos(angle * 2 + time * 1.2) * layerAmp * 0.4;
          
          const offset = wave1 + wave2 + wave3;
          const r = layerRadius + offset;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          
          coordinates.push({ x, y });
        }
        
        // Draw smooth curves using quadratic curves
        if (coordinates.length > 0) {
          ctx.moveTo(coordinates[0].x, coordinates[0].y);
          
          for (let i = 0; i < coordinates.length; i++) {
            const current = coordinates[i];
            const next = coordinates[(i + 1) % coordinates.length];
            const controlX = (current.x + next.x) / 2;
            const controlY = (current.y + next.y) / 2;
            
            ctx.quadraticCurveTo(current.x, current.y, controlX, controlY);
          }
          
          // Close the path smoothly
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          const finalControlX = (last.x + first.x) / 2;
          const finalControlY = (last.y + first.y) / 2;
          ctx.quadraticCurveTo(last.x, last.y, finalControlX, finalControlY);
        }
        
        ctx.closePath();
        
        // Create smooth gradient for organic look
        const gradient = ctx.createRadialGradient(0, 0, layerRadius - 30, 0, 0, layerRadius + 30);
        
        if (layer === 0) {
          // Main layer - bright and smooth
          gradient.addColorStop(0, `rgba(168, 85, 247, ${layerOpacity * 0.9})`); // Purple-500
          gradient.addColorStop(0.5, `rgba(139, 92, 246, ${layerOpacity})`); // Purple-400  
          gradient.addColorStop(1, `rgba(168, 85, 247, ${layerOpacity * 0.4})`); // Purple-500 fade
        } else {
          // Secondary layer - softer purple
          gradient.addColorStop(0, `rgba(196, 181, 253, ${layerOpacity * 0.6})`); // Purple-200
          gradient.addColorStop(0.5, `rgba(147, 51, 234, ${layerOpacity * 0.8})`); // Purple-600
          gradient.addColorStop(1, `rgba(147, 51, 234, ${layerOpacity * 0.2})`); // Purple-600 fade
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = layer === 0 ? 4 : 3; // Slightly thicker for smoother appearance
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Enhanced glow effect for smooth organic look
        ctx.shadowBlur = layer === 0 ? 25 : 15;
        ctx.shadowColor = layer === 0 ? "rgba(168, 85, 247, 0.8)" : "rgba(147, 51, 234, 0.5)";
        
        ctx.stroke();
      }
      
      // Add subtle inner ring
      ctx.beginPath();
      ctx.arc(0, 0, RADIUS - 20, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + smoothedVolume.current * 0.2})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
      ctx.stroke();
      
      ctx.restore();
    };

    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [micVolume, isActive, status]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        width={SIZE} 
        height={SIZE}
        className="block"
        style={{
          width: `${SIZE}px`,
          height: `${SIZE}px`,
        }}
      />
    </div>
  );
};

export default VoiceRingWaveform; 