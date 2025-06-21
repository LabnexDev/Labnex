import React, { useEffect, useRef } from "react";

const SIZE = 300;
const CENTER = SIZE / 2;
const BASE_RADIUS = 110; // Base radius for the waveform rings

interface VoiceRingWaveformProps {
  isActive?: boolean;
}

export const VoiceRingWaveform: React.FC<VoiceRingWaveformProps> = ({
  isActive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      time += 0.015;

      // Perfect constant amplitude for smooth visual flow
      const amp = 20; // Fixed amplitude for consistent beautiful animation

      // Clear canvas
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      
      // Center the drawing
      ctx.translate(CENTER, CENTER);
      
      // Draw multiple flowing rings like in reference image
      const rings = [
        { radius: BASE_RADIUS, thickness: 3, opacity: 0.9, speed: 1 },
        { radius: BASE_RADIUS - 15, thickness: 2, opacity: 0.6, speed: 0.7 },
        { radius: BASE_RADIUS + 20, thickness: 2, opacity: 0.4, speed: 1.3 }
      ];
      
      rings.forEach((ring, ringIndex) => {
        ctx.beginPath();
        
        const numPoints = 120;
        const rotationOffset = time * ring.speed;
        
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2 + rotationOffset;
          
          // Create organic flowing waves
          const wave1 = Math.sin(angle * 3 + time * 1.2) * amp * 0.6;
          const wave2 = Math.sin(angle * 7 + time * 0.8) * amp * 0.25;
          const wave3 = Math.cos(angle * 5 + time * 1.5) * amp * 0.35;
          const wave4 = Math.sin(angle * 9 + time * 0.6) * amp * 0.15;
          
          const waveOffset = wave1 + wave2 + wave3 + wave4;
          const radius = ring.radius + waveOffset;
          
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        
        // Create beautiful gradients for each ring
        const gradient = ctx.createRadialGradient(0, 0, ring.radius - 40, 0, 0, ring.radius + 40);
        
        if (ringIndex === 0) {
          // Main ring - brightest
          gradient.addColorStop(0, `rgba(255, 255, 255, ${ring.opacity * 0.8})`);
          gradient.addColorStop(0.3, `rgba(168, 85, 247, ${ring.opacity})`);
          gradient.addColorStop(0.7, `rgba(139, 92, 246, ${ring.opacity * 0.8})`);
          gradient.addColorStop(1, `rgba(168, 85, 247, ${ring.opacity * 0.2})`);
        } else {
          // Secondary rings - more purple
          gradient.addColorStop(0, `rgba(196, 181, 253, ${ring.opacity * 0.6})`);
          gradient.addColorStop(0.4, `rgba(147, 51, 234, ${ring.opacity})`);
          gradient.addColorStop(1, `rgba(126, 34, 206, ${ring.opacity * 0.3})`);
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = ring.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Add glow effect
        ctx.shadowBlur = ringIndex === 0 ? 25 : 15;
        ctx.shadowColor = ringIndex === 0 ? "rgba(168, 85, 247, 0.8)" : "rgba(147, 51, 234, 0.5)";
        
        ctx.stroke();
      });
      
      ctx.restore();
    };

    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

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