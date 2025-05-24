import React from 'react';

const GlobalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Subtle static gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(120,119,198,0.08),transparent_50%)] opacity-30" />
      
      {/* Minimal vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-950/20" />
    </div>
  );
};

export default GlobalBackground; 