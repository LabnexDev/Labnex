import React, { useState } from 'react';
import './LandingStyles.css';

interface UseCase {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  features: string[];
  benefits: string[];
}

const UseCaseShowcase: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);

  const useCases: UseCase[] = [
    {
      id: 'startup',
      title: 'For Startups',
      subtitle: 'Move fast, build smart',
      description: 'Perfect for small teams who need to move quickly. Get started with intelligent project setup and automated workflows.',
      icon: '🚀',
      features: [
        'Quick project setup',
        'Essential testing tools',
        'Team collaboration',
        'Basic automation',
        'Progress tracking'
      ],
      benefits: [
        'Get up and running in minutes',
        'Focus on building, not managing',
        'Scale as your team grows'
      ]
    },
    {
      id: 'enterprise',
      title: 'For Enterprise',
      subtitle: 'Scale with confidence',
      description: 'Built to grow with larger organizations. Advanced features for complex workflows and team management.',
      icon: '🏢',
      features: [
        'Advanced project templates',
        'Team management tools',
        'Custom workflows',
        'Integration APIs',
        'Audit logging'
      ],
      benefits: [
        'Designed for complex projects',
        'Enterprise-ready architecture',
        'Flexible to your processes'
      ]
    },
    {
      id: 'development',
      title: 'For Development Teams',
      subtitle: 'Code smarter, test better',
      description: 'Streamlined development workflows with intelligent code analysis and comprehensive testing tools.',
      icon: '💻',
      features: [
        'Code quality analysis',
        'Automated testing',
        'Git integration',
        'Performance monitoring',
        'Documentation tools'
      ],
      benefits: [
        'Catch issues early',
        'Maintain code quality',
        'Ship with confidence'
      ]
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/40 backdrop-blur-xl rounded-full border border-slate-600/30">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              Perfect For
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Built for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              every team
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Whether you're a startup, enterprise, or development team - Labnex adapts to your needs
          </p>
        </div>

        {/* Use Case Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase, index) => (
            <button
              key={useCase.id}
              onClick={() => setActiveCase(index)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 border ${
                activeCase === index
                  ? 'bg-slate-800/60 border-purple-500/60 text-white'
                  : 'bg-slate-800/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/40 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{useCase.icon}</span>
                {useCase.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Use Case Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Content */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{useCases[activeCase].icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {useCases[activeCase].title}
                  </h3>
                  <p className="text-lg text-slate-400">
                    {useCases[activeCase].subtitle}
                  </p>
                </div>
              </div>
              
              <p className="text-lg text-slate-300 leading-relaxed">
                {useCases[activeCase].description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider">
                What's Included
              </h4>
              <div className="space-y-3">
                {useCases[activeCase].features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                Start with {useCases[activeCase].title.replace('For ', '')}
              </button>
            </div>
          </div>

          {/* Right Side - Benefits */}
          <div className="space-y-6">
            <h4 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
              Why Choose This
            </h4>
            
            <div className="space-y-4">
              {useCases[activeCase].benefits.map((benefit, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        {benefit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Status */}
            <div className="glass-card p-6 text-center">
              <div className="text-slate-300 font-semibold mb-4">
                Ready to Use Today
              </div>
              
              <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>Fresh Launch</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛠️</span>
                  <span>Actively Developed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>User Feedback Driven</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCaseShowcase; 