import React from 'react';
import { Button } from '../common/Button';
import { useModal } from '../../contexts/ModalContext';

const HeroSection: React.FC = () => {
  const { openModal } = useModal();

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
      {/* Background Effects - Static Glows */}
      <div className="absolute inset-0">
        {/* Central hero glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-purple-600/20 via-purple-600/5 to-transparent rounded-full blur-3xl" />
        
        {/* Secondary accent glows */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-blue-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-radial from-pink-500/10 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" />
          <span className="text-slate-300 text-sm font-medium tracking-wide">
            AI-Powered Testing Automation Platform
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white tracking-tight leading-none">
          <span className="block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200">
              Labnex
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-light mb-6 text-slate-300 max-w-4xl mx-auto">
          AI-Powered Project Management & Test Automation Platform
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Streamline your development with{' '}
          <span className="text-purple-300 font-medium">AI-driven test case generation</span>,{' '}
          <span className="text-blue-300 font-medium">automated project workflows</span>, and{' '}
          <span className="text-pink-300 font-medium">smart insights for faster delivery</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16">
          {/* Primary CTA with orb glow */}
          <div className="relative group">
            {/* Button orb glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
            
            <Button 
              onClick={() => openModal('waitlist')}
              variant="primary"
              size="lg" 
              className="relative px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl border border-white/10 shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Join Waitlist Now
              </span>
            </Button>
          </div>
          
          {/* Secondary CTA */}
          <Button 
            variant="secondary"
            size="lg" 
            onClick={() => scrollToId('features')}
            className="px-8 py-4 text-lg font-semibold bg-white/5 backdrop-blur-md border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="flex items-center">
              Explore Features
              <svg className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col items-center">
          <p className="text-sm text-slate-500 mb-6 font-medium tracking-wide">
            Ready for early adopters and development teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              'No Lock-in',
              'Free to Start', 
              'Open Source Ready'
            ].map((item, index) => (
              <div key={index} className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
                <span className="text-sm font-medium text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;