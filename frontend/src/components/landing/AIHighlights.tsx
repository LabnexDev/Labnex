import React from 'react';
import './LandingStyles.css';

// Interface for a single AI power item
interface AIPowerItem {
  icon: React.ElementType;
  title: string;
  description: string;
}

// Interface for the component props
interface AIHighlightsProps {
  aiHighlightsData: AIPowerItem[];
}

const AIHighlights: React.FC<AIHighlightsProps> = ({ aiHighlightsData }) => {
  if (!aiHighlightsData || aiHighlightsData.length === 0) {
    return <section className="py-16 bg-transparent"><p className="text-center text-gray-500">No AI highlights to display.</p></section>;
  }

  const cardBaseStyle = "group p-6 rounded-2xl border flex flex-col transition-all duration-300 ease-out h-full";
  const glassmorphicCardStyle = `${cardBaseStyle} bg-slate-800/40 backdrop-filter backdrop-blur-xl border-purple-600/50 shadow-[0_8px_32px_rgba(128,0,128,0.3),_inset_0_0_0_1px_rgba(255,255,255,0.07)]`;
  const hoverEffectStyle = "hover:shadow-[0_12px_45px_rgba(168,85,247,0.35),_inset_0_0_0_1px_rgba(192,132,252,0.3)] hover:border-purple-500/80 hover:bg-slate-800/50";

  return (
    <section className="py-16 sm:py-24 px-6 bg-transparent relative font-inter overflow-hidden">
      <div>
        {/* Subtle local atmospheric effects */}
        <div className="absolute inset-0 z-0 opacity-80">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-radial from-purple-600/20 to-transparent rounded-full blur-3xl animate-pulse-slow opacity-70"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial from-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow animation-delay-3000 opacity-70"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <h2 
            className="text-3xl sm:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 font-poppins"
            style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.4)' }}
          >
            Unlock Your AI Superpowers
          </h2>
          <p 
            className="text-md sm:text-lg text-slate-300 text-center mb-16 max-w-3xl mx-auto"
          >
            Labnex integrates cutting-edge AI to accelerate your workflow, enhance creativity, and reduce tedious tasks directly within your project environment and Discord.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {aiHighlightsData.map((feature, index) => (
              <div
                key={index}
                className={`${glassmorphicCardStyle} ${hoverEffectStyle}`}
              >
                <div className="flex justify-start items-start mb-4">
                  <div 
                     className="inline-block p-2.5 bg-purple-600/30 rounded-lg shadow-md border border-purple-500/50 hover:scale-110 transition-transform duration-300"
                  >
                    <feature.icon className="w-7 h-7 text-purple-300 group-hover:text-pink-300 transition-colors duration-200" style={{filter: 'drop-shadow(0 0 5px rgba(192,132,252,0.6))'}} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-purple-200 group-hover:text-pink-300 transition-colors duration-200 font-poppins" style={{textShadow: '0 0 6px rgba(216,180,254,0.5)'}}>{feature.title}</h3>
                <p className="text-slate-300 text-sm flex-grow leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIHighlights; 