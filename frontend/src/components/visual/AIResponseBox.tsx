import React, { useState, useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIResponseBoxProps {
  message: string;
  className?: string;
  staticRender?: boolean;
  charDelay?: number; // Milliseconds per character
  lineDelay?: number; // Milliseconds between lines
}

const AIResponseBox: React.FC<AIResponseBoxProps> = ({
  message,
  className = '',
  staticRender = false,
  charDelay = 30, // Slightly faster for a better feel
  lineDelay = 300,
}) => {
  // Memoize sourceLines to prevent re-triggering useEffect unnecessarily
  const sourceLines = useMemo(() => message.split('\n'), [message]);
  const [displayedText, setDisplayedText] = useState('');
  const controls = useAnimation();

  useEffect(() => {
    if (staticRender) {
      setDisplayedText(message);
      return;
    }

    let currentTextAggregator = '';
    let lineIndex = 0;
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null; // For cleanup

    const type = () => {
      if (lineIndex < sourceLines.length) {
        const currentLine = sourceLines[lineIndex];
        if (charIndex < currentLine.length) {
          currentTextAggregator += currentLine[charIndex];
          setDisplayedText(currentTextAggregator);
          charIndex++;
          timeoutId = setTimeout(type, charDelay); // Use timeoutId for cleanup
        } else {
          // End of line
          currentTextAggregator += '\n'; // Add the newline character back
          setDisplayedText(currentTextAggregator);
          lineIndex++;
          charIndex = 0;
          timeoutId = setTimeout(type, lineDelay); // Use timeoutId for cleanup
        }
      } else {
        // All lines typed
        controls.start({ opacity: 1 }); // Ensure final visibility
      }
    };

    // Initial animation for the box itself
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1], delay: 0.2 }
    }).then(() => {
      setDisplayedText(''); // Clear before starting typing animation
      type(); // Start typing after box animation
    });

    // Cleanup function to cancel timeouts if the component unmounts or dependencies change
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, staticRender, charDelay, lineDelay, controls, sourceLines]);

  const Tag = staticRender ? 'div' : motion.div;
  const containerProps = staticRender
    ? { style: { opacity: 1, y: 0, scale: 1 } }
    : { initial: { opacity: 0, y: 40, scale: 0.95 }, animate: controls };

  return (
    <Tag
      className={`p-4 sm:p-6 rounded-xl border text-left text-sm sm:text-base 
                  bg-slate-800/60 backdrop-filter backdrop-blur-lg border-slate-700/70 
                  shadow-[0_8px_32px_rgba(0,0,0,0.3),_inset_0_0_0_1px_rgba(255,255,255,0.05)] 
                  ${className}`}
      {...containerProps}
    >
      {staticRender ? (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
        </div>
      ) : (
        displayedText.split('\n').map((line, index) => (
          <p key={index} className={`whitespace-pre-wrap min-h-[1em] ${line.startsWith('#') ? 'text-slate-400 text-xs sm:text-sm' : 'text-slate-200'}`}>
            {line === '' && index < displayedText.split('\n').length - 1 ? '\u00A0' : line}
          </p>
        ))
      )}
    </Tag>
  );
};

export default AIResponseBox;