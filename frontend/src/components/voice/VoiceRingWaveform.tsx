import React, { useEffect, useRef } from "react";
import { useMicrophoneVolume } from "../../hooks/useMicrophoneVolume";

const SIZE = 400;
const RADIUS = SIZE / 3;

interface VoiceRingWaveformProps {
  isActive?: boolean;
}

export const VoiceRingWaveform: React.FC<VoiceRingWaveformProps> = ({
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const volume = useMicrophoneVolume();
  const smoothedVolume = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

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
      smoothedVolume.current += (volume - smoothedVolume.current) * 0.05;
      const amp = 10 + smoothedVolume.current * 30;

      // Clear canvas
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      
      // Center the drawing
      ctx.translate(SIZE / 2, SIZE / 2);
      
      // Draw multiple ring layers for depth
      const layers = 3;
      
      for (let layer = 0; layer < layers; layer++) {
        const layerOpacity = 0.9 - (layer * 0.2);
        const layerRadius = RADIUS + (layer * 8);
        const layerAmp = amp * (1 - layer * 0.2);
        
        ctx.beginPath();
        
        const points = 128;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Create complex wave pattern
          const wave1 = Math.sin(i * 0.4 + time * 2) * layerAmp;
          const wave2 = Math.sin(i * 0.8 + time * 1.5) * (layerAmp * 0.5);
          const wave3 = Math.cos(i * 0.2 + time * 3) * (layerAmp * 0.3);
          
          const offset = wave1 + wave2 + wave3;
          const r = layerRadius + offset;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        
        // Create gradient for each layer
        const gradient = ctx.createRadialGradient(0, 0, layerRadius - 20, 0, 0, layerRadius + 20);
        
        if (layer === 0) {
          // Main layer - brightest
          gradient.addColorStop(0, `rgba(255, 255, 255, ${layerOpacity * 0.8})`);
          gradient.addColorStop(0.5, `rgba(168, 85, 247, ${layerOpacity})`); // Purple-500
          gradient.addColorStop(1, `rgba(139, 92, 246, ${layerOpacity * 0.6})`); // Purple-400
        } else {
          // Secondary layers - more purple
          gradient.addColorStop(0, `rgba(196, 181, 253, ${layerOpacity * 0.4})`); // Purple-200
          gradient.addColorStop(0.5, `rgba(147, 51, 234, ${layerOpacity})`); // Purple-600
          gradient.addColorStop(1, `rgba(126, 34, 206, ${layerOpacity * 0.3})`); // Purple-700
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = layer === 0 ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Add glow effect
        ctx.shadowBlur = layer === 0 ? 20 : 10;
        ctx.shadowColor = layer === 0 ? "rgba(139, 92, 246, 0.6)" : "rgba(147, 51, 234, 0.3)";
        
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
  }, [volume, isActive]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <canvas 
        ref={canvasRef} 
        width={SIZE} 
        height={SIZE}
        className="block"
        style={{
          width: SIZE,
          height: SIZE,
        }}
      />
    </div>
  );
};

export default VoiceRingWaveform; 