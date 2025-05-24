import React from 'react';

const OrbBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Static gradient orbs - no animations */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-blue-600/8 rounded-full filter blur-3xl" />
    </div>
  );
};

export default OrbBackground; 