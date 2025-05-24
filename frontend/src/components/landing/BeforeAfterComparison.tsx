import React from 'react';
import SectionWrapper from './SectionWrapper';

const BeforeAfterComparison: React.FC = () => {
  const beforeItems = [
    {
      icon: '⚠️',
      title: 'Scattered Requirements',
      description: 'Important project details lost in chat messages and random documents'
    },
    {
      icon: '🔀',
      title: 'Misaligned Teams',
      description: 'Everyone working on different assumptions and priorities'
    },
    {
      icon: '💭',
      title: 'Forgotten Ideas',
      description: 'Brilliant insights disappear without proper capture and organization'
    }
  ];

  const afterItems = [
    {
      icon: '📋',
      title: 'Organized Projects',
      description: 'Everything centralized with clear structure and easy access'
    },
    {
      icon: '🧪',
      title: 'Structured Test Cases',
      description: 'Comprehensive testing workflows with automated tracking'
    },
    {
      icon: '📊',
      title: 'Trackable Progress',
      description: 'Real-time visibility into project health and team performance'
    }
  ];

  return (
    <SectionWrapper 
      badge="The Solution"
      title={
        <>
          From{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
            chaos
          </span>
          {' '}to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
            clarity
          </span>
        </>
      }
      subtitle="Transform scattered workflows into streamlined, organized, and manageable projects."
      backgroundType="gradient"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Before - Chaos */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-2xl font-bold text-red-300 mb-2">Before Labnex</h3>
            <p className="text-slate-400">
              Scattered notes, unclear tasks, missed deadlines
            </p>
          </div>
          
          <div className="space-y-4">
            {beforeItems.map((item, index) => (
              <div key={index} className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-4 hover:bg-red-500/15 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-1">{item.icon}</span>
                  <div>
                    <h4 className="font-semibold text-red-200 mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Central Transform Icon */}
        <div className="flex justify-center items-center lg:py-12">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-20" />
            
            <div className="relative w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl border border-white/10">
              <span className="text-3xl">✨</span>
            </div>
            
            {/* Subtle transform arrows on larger screens */}
            <div className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* After - Clarity */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-emerald-300 mb-2">With Labnex</h3>
            <p className="text-slate-400">
              Crystal-clear projects, efficient workflows, seamless collaboration
            </p>
          </div>
          
          <div className="space-y-4">
            {afterItems.map((item, index) => (
              <div key={index} className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-xl p-4 hover:bg-emerald-500/15 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-1">{item.icon}</span>
                  <div>
                    <h4 className="font-semibold text-emerald-200 mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Value Props */}
      <div className="mt-20">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            What makes Labnex different
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Purpose-Built", description: "Designed specifically for development teams" },
              { icon: "🚀", title: "Fast Setup", description: "Get your team organized in minutes" },
              { icon: "💡", title: "User-Driven", description: "Built with real developer feedback" }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <div className="text-xl font-bold text-white mb-2">{benefit.title}</div>
                <div className="text-slate-400 text-sm leading-relaxed">{benefit.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BeforeAfterComparison; 