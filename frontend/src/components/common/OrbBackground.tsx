import React from 'react';

const OrbBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Orb 1: Drifting */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600 rounded-full opacity-30 blur-3xl top-[-200px] left-[-200px] animate-drift [animation-delay:0s]" />
      {/* Orb 2: Drifting with delay */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full opacity-20 blur-3xl top-[-100px] right-[-150px] animate-drift [animation-delay:-5s]" /> 
      {/* Orb 3: Drifting with different delay */}
      <div className="absolute w-[700px] h-[700px] bg-pink-500 rounded-full opacity-10 blur-3xl bottom-[-300px] left-[25%] animate-drift [animation-delay:-10s]" />
      {/* Orb 4: Drifting with another delay */}
      <div 
        className="absolute w-[800px] h-[800px] bg-indigo-400 rounded-full opacity-[0.07] blur-3xl animate-drift [animation-delay:-15s] top-1/2 left-1/2"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export default OrbBackground; 