import React from 'react';
import './LandingStyles.css';

const ChaosClarity: React.FC = () => {
  return (
    <section id="chaos-clarity" className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/40 backdrop-blur-xl rounded-full border border-slate-600/30">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              The Solution
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            From{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              chaos
            </span>
            {' '}to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
              clarity
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Transform scattered workflows into streamlined, organized, and manageable projects.
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Before - Chaos */}
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-300 mb-4">Before Labnex</h3>
            <p className="text-slate-400 mb-6">
              Scattered notes, unclear tasks, missed deadlines, and project chaos.
            </p>
            <div className="space-y-3">
              {[
                "Lost requirements",
                "Misaligned teams", 
                "Forgotten ideas"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow/Transformation */}
          <div className="flex justify-center items-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
          </div>

          {/* After - Clarity */}
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-emerald-300 mb-4">With Labnex</h3>
            <p className="text-slate-400 mb-6">
              Crystal-clear projects, efficient workflows, and seamless collaboration.
            </p>
            <div className="space-y-3">
              {[
                "Organized projects",
                "Structured test cases",
                "Trackable progress"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 text-center">
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              What makes Labnex different
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "🎯", title: "Purpose-Built", description: "Designed specifically for development teams" },
                { icon: "🚀", title: "Fast Setup", description: "Get your team organized in minutes" },
                { icon: "💡", title: "User-Driven", description: "Built with real developer feedback" }
              ].map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <div className="text-xl font-bold text-white mb-2">{benefit.title}</div>
                  <div className="text-slate-400 text-sm">{benefit.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChaosClarity; 