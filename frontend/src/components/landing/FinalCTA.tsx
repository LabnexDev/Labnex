import React from 'react';
import { Button } from '../common/Button';
import SectionWrapper from './SectionWrapper';
import { useModal } from '../../contexts/ModalContext';
import { Link } from 'react-router-dom';

const FinalCTA: React.FC = () => {
  const { openModal } = useModal();

  return (
    <SectionWrapper 
      backgroundType="gradient"
      className="relative overflow-hidden"
    >
      {/* Background orb effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-purple-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-radial from-pink-500/15 to-transparent rounded-full blur-2xl" />
      
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              Ready to Launch
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
            Start building{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              smarter today
            </span>
          </h2>
          
          {/* Description */}
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join us in building the future of development workflows. Be part of our early community 
            and help shape what comes next.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12">
            {/* Primary CTA with glow */}
            <div className="relative group">
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
                  Get Early Access
                </span>
              </Button>
            </div>
            
            <Button 
              onClick={() => openModal('waitlist')}
              variant="secondary"
              size="lg" 
              className="px-8 py-4 text-lg font-semibold bg-white/5 backdrop-blur-md border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Try Demo
              </span>
            </Button>
          </div>

          {/* Platform Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-slate-400 text-sm">To get started</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">Open</div>
              <div className="text-slate-400 text-sm">Source ready</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">New</div>
              <div className="text-slate-400 text-sm">Fresh platform</div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
              {[
                { text: "No credit card required", icon: "M5 13l4 4L19 7" },
                { text: "Full feature access", icon: "M5 13l4 4L19 7" },
                { text: "Community support", icon: "M5 13l4 4L19 7" }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={benefit.icon} />
                  </svg>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-slate-500 text-sm">
            <Link to="/changelog" className="hover:text-slate-300 transition-colors duration-300">Changelog</Link>
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors duration-300">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-slate-300 transition-colors duration-300">Terms of Service</Link>
            <Link to="/support" className="hover:text-slate-300 transition-colors duration-300">Support</Link>
            <button onClick={() => openModal('info', { infoPageType: 'contact' })} className="hover:text-slate-300 transition-colors duration-300">Contact</button>
          </div>
          <div className="mt-6 text-slate-500 text-sm">
            © {new Date().getFullYear()} Labnex. A new platform for modern development teams.
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default FinalCTA; 