import React from 'react';

interface MicWaveProps {
  listening: boolean;
}

// A very lightweight visualizer that shows three bars pulsing while listening.
// Tailwind custom keyframes are not available by default, so we embed inline
// style animations.

const barStyle = {
  display: 'inline-block',
  width: '4px',
  marginRight: '2px',
  backgroundColor: 'currentColor',
  animation: 'micWave 1.2s infinite ease-in-out',
} as React.CSSProperties;

const MicWave: React.FC<MicWaveProps> = ({ listening }) => {
  if (!listening) return null;

  return (
    <div
      className="text-green-400"
      style={{ fontSize: 0, lineHeight: 0 }}
      aria-label="listening waveform"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            ...barStyle,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      {/* keyframes injected once */}
      <style>
        {`@keyframes micWave {
          0%, 40%, 100% { transform: scaleY(0.4); }
          20% { transform: scaleY(1); }
        }`}
      </style>
    </div>
  );
};

export default MicWave; 