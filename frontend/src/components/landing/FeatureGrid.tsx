import React from 'react';
import SectionWrapper from './SectionWrapper';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  benefits: string[];
  badge?: string;
}

const FeatureGrid: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const features: Feature[] = [
    {
      id: 1,
      title: "Project Management",
      description: "Create, organize, and track your software projects with structured task management and progress monitoring.",
      category: "Core Feature",
      badge: "Essential",
      benefits: ["Project creation & organization", "Task tracking & assignments", "Progress monitoring"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Test Case Management",
      description: "Design, execute, and manage test cases with detailed steps, expected results, and comprehensive tracking.",
      category: "Quality Assurance",
      badge: "Core Feature",
      benefits: ["Test case creation & editing", "Execution tracking", "Status management"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 3,
      title: "Discord AI Assistant",
      description: "Manage your projects directly from Discord with AI-powered commands for notes, snippets, and project tasks.",
      category: "AI Integration",
      badge: "AI-Powered",
      benefits: ["Natural language commands", "Project integration", "Smart assistance"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 4,
      title: "CLI Automation Tool",
      description: "Powerful command-line interface for automated testing, project management, and AI-powered development workflows.",
      category: "Developer Tools",
      badge: "New",
      benefits: ["CLI project management", "Automated test execution", "AI-powered features"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 5,
      title: "Notes & Code Snippets",
      description: "Capture ideas, code snippets, and notes. Keep them organized and accessible via both web interface and Discord.",
      category: "Productivity",
      badge: "Core Feature",
      benefits: ["Note organization", "Code snippet management", "Cross-platform access"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 6,
      title: "Modern Development Platform",
      description: "Built with modern technologies including React, Node.js, and MongoDB for reliable performance and scalability.",
      category: "Platform",
      badge: "Core Platform",
      benefits: ["Modern tech stack", "Responsive design", "Secure authentication"],
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const getBadgeStyles = (badge?: string) => {
    switch (badge) {
      case 'AI-Powered':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Essential':
      case 'Core Feature':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'New':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Beta':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <SectionWrapper 
      badge="Core Features"
      title={
        <>
          Everything you need to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            get started
          </span>
        </>
      }
      subtitle="Essential tools for project management, test case tracking, and development workflow automation - all in one platform."
      backgroundType="darker"
    >
      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              {/* Category and Badge */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {feature.category}
                </div>
                {feature.badge && (
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(feature.badge)}`}>
                    {feature.badge}
                  </div>
                )}
              </div>
              
              {/* Icon */}
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits List */}
              <div className="space-y-2 pt-2">
                {feature.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Learn More Link */}
              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={() => {
                    if (feature.id === 1) {
                      navigate('/features/project-management');
                    } else if (feature.id === 2) {
                      navigate('/features/test-case-management');
                    } else if (feature.id === 3) {
                      navigate('/features/discord-ai-integration');
                    } else if (feature.id === 4) {
                      navigate('/features/cli-automation');
                    } else if (feature.id === 5) {
                      navigate('/features/notes-and-snippets');
                    } else if (feature.id === 6) {
                      navigate('/features/modern-development-platform');
                    } else {
                      openModal('comingSoon', { featureName: feature.title });
                    }
                  }}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 text-sm font-medium group/button"
                >
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-hover/button:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 text-center">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to streamline your development?
          </h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Join early adopters building better software with Labnex.
          </p>
          <button onClick={() => openModal('waitlist')} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            Start Building Today
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default FeatureGrid;