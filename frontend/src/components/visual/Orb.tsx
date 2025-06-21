import React from 'react';

interface OrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  voiceActivity: number;
}

export const Orb: React.FC<OrbProps> = ({ isListening, isSpeaking, voiceActivity }) => {
  const activityScale = isListening ? 1 + voiceActivity * 1.5 : 1;

  const orbStyle: React.CSSProperties = {
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    position: 'relative',
    transition: 'transform 0.1s ease-out, box-shadow 0.3s ease-in-out',
    transform: `scale(${activityScale})`,
  };

  return (
    <div style={orbStyle} className="orb-container">
      <div className={`orb-pulse-speaking ${isSpeaking ? 'animate-pulse-speaking' : ''}`} />
      <div className={`orb-pulse-listening ${isListening ? 'animate-pulse-listening' : ''}`} />
      <div className="orb-glow" />
      <div className="orb-core" />
      <style>{`
        .orb-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .orb-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(120, 81, 219, 0.6) 0%, rgba(30, 2, 80, 0.8) 70%);
          box-shadow: inset 0 0 40px rgba(193, 168, 255, 0.7), 0 0 20px rgba(120, 81, 219, 0.5);
          position: absolute;
        }
        .orb-glow {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: absolute;
          box-shadow: 0 0 50px 10px rgba(128, 90, 213, 0.4);
          opacity: 0.8;
        }
        .orb-pulse-listening, .orb-pulse-speaking {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            position: absolute;
            border: 2px solid transparent;
        }
        .animate-pulse-listening {
          animation: pulse-listen 2s infinite;
        }
        .animate-pulse-speaking {
          animation: pulse-speak 1.5s infinite;
        }
        @keyframes pulse-listen {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(138, 43, 226, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 10px 15px rgba(138, 43, 226, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(138, 43, 226, 0); }
        }
        @keyframes pulse-speak {
          0% { transform: scale(1); opacity: 0.7; border-color: rgba(12, 233, 149, 0.7); }
          50% { transform: scale(1.05); opacity: 0; border-color: rgba(12, 233, 149, 0); }
          100% { transform: scale(1); opacity: 0.7; border-color: rgba(12, 233, 149, 0.7); }
        }
      `}</style>
    </div>
  );
}; 