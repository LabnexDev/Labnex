import React from 'react';

interface VoiceStatusPanelProps {
  status: string;
  contextInfo?: string;
}

const VoiceStatusPanel: React.FC<VoiceStatusPanelProps> = ({ status, contextInfo }) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs select-none">
      <div className="bg-neutral-900/60 backdrop-blur-md shadow-lg rounded-xl px-4 py-3 transition-opacity duration-300 text-white/90">
        <p className="text-sm font-medium leading-snug">{status}</p>
        {contextInfo && <p className="text-xs text-white/60 mt-1">{contextInfo}</p>}
      </div>
    </div>
  );
};

export default VoiceStatusPanel; 