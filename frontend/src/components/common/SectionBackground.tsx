import React from 'react';
import { motion } from 'framer-motion';

interface SectionBackgroundProps {
  color: string; // e.g., 'purple-600', 'blue-500'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number; // 0 to 1, e.g., 0.2 for opacity-20
  size?: string; // e.g., 'w-[600px] h-[600px]' or 'w-1/2 h-1/2'
  animation?: 'pulse-slow' | 'drift' | 'none'; // Add more as needed
  className?: string; // Allow additional custom classes
}

const SectionBackground: React.FC<SectionBackgroundProps> = ({
  color,
  position,
  opacity = 0.2,
  size = 'w-[700px] h-[700px]',
  animation = 'pulse-slow',
  className = ''
}) => {
  const positionClasses: Record<typeof position, string> = {
    'top-left': '-top-1/4 -left-1/4',
    'top-right': '-top-1/4 -right-1/4',
    'bottom-left': '-bottom-1/4 -left-1/4',
    'bottom-right': '-bottom-1/4 -right-1/4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const animationClasses: Record<typeof animation, string> = {
    'pulse-slow': 'animate-pulse-slow',
    'drift': 'animate-drift', // Assuming animate-drift is defined in global CSS or Tailwind config
    'none': ''
  };

  // Convert opacity number (0-1) to Tailwind opacity class (e.g., 0.2 -> opacity-20)
  const opacityClass = `opacity-${Math.round(opacity * 100)}`;

  const bgClass = `bg-${color}`; // Assumes color is like 'purple-600'

  return (
    <motion.div
      className={`absolute ${size} ${bgClass} rounded-full ${opacityClass} blur-3xl ${positionClasses[position]} ${animationClasses[animation]} ${className} pointer-events-none`}
      // Example motion props if needed for entry/exit, but mostly CSS animation driven
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: opacity, scale: 1 }}
      transition={{ duration: 1.5, ease: "circOut" }}
    />
  );
};

export default SectionBackground; 