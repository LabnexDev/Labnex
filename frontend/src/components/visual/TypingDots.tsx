import React from 'react';
import { motion } from 'framer-motion';

interface TypingDotsProps {
  staticRender?: boolean;
}

const TypingDots: React.FC<TypingDotsProps> = ({ staticRender = false }) => {
  const dotTransition = (delay: number) => ({
    duration: 0.8,
    repeat: Infinity,
    ease: 'easeInOut',
    delay: staticRender ? 0 : delay,
  });

  const Tag = staticRender ? 'div' : motion.div;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <p className="text-xs text-slate-400 mb-2 font-mono tracking-tight">
        Labnex AI is typing...
      </p>
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((i) => (
          <Tag
            key={i}
            className="w-2 h-2 bg-slate-500 rounded-full"
            initial={{ y: '0%', opacity: 0.5 }}
            animate={staticRender ? { y: '0%', opacity: 0.5 } : { // Static state if staticRender is true
              y: ['-20%', '20%', '-20%'],
              opacity: [0.5, 1, 0.5],
            }}
            transition={dotTransition(i * 0.2) as any}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingDots; 