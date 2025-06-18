import React from 'react';

const OrbBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Central pulsing orb */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/3 bg-gradient-to-br from-brand-500/30 via-indigo-500/30 to-purple-600/30 rounded-full filter blur-3xl opacity-50 animate-pulse-slow" />

      {/* Bottom-right drifting orb */}
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] translate-x-1/3 translate-y-1/3 bg-gradient-to-br from-sky-500/20 via-blue-600/20 to-indigo-600/20 rounded-full filter blur-3xl opacity-40 animate-drift" />

      {/* Left mid-level orb */}
      <div className="absolute bottom-1/3 -left-1/4 w-[320px] h-[320px] bg-emerald-500/15 rounded-full filter blur-3xl opacity-30 animate-drift" />
    </div>
  );
};

export default OrbBackground; 