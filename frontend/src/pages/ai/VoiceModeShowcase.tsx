import React from 'react';
import './AIVoiceMode.css';

const VoiceModeShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-indigo-900/30 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-black text-white mb-8 status-shimmer">
          AI VOICE MODE
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
          {/* Listening State Demo */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
            <div className="w-32 h-32 mx-auto mb-6 voice-orb listening bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-4xl">🎤</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Listening</h3>
            <p className="text-slate-400">Enhanced orb animations with breathing effects</p>
          </div>
          
          {/* Speaking State Demo */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
            <div className="w-32 h-32 mx-auto mb-6 voice-orb speaking bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-4xl">🗣️</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Speaking</h3>
            <p className="text-slate-400">Dynamic glow effects and smooth transitions</p>
          </div>
          
          {/* Analyzing State Demo */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30 shadow-2xl hover-glow voice-transition hover-lift">
            <div className="w-32 h-32 mx-auto mb-6 voice-orb analyzing bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-600 rounded-full flex items-center justify-center animate-spin-slow">
              <span className="text-white text-4xl">🧠</span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Analyzing</h3>
            <p className="text-slate-400">Rotating animations with enhanced shadows</p>
          </div>
        </div>
        
        <div className="mt-12">
          <button className="btn-voice-mode px-8 py-4 text-white font-bold rounded-full hover-lift">
            Experience AI Voice Mode
          </button>
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full particle ${
              i % 3 === 0 ? 'w-2 h-2 bg-purple-400/20' :
              i % 3 === 1 ? 'w-1 h-1 bg-cyan-400/30' :
              'w-1.5 h-1.5 bg-indigo-400/15'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceModeShowcase; 