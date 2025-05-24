import React from 'react';

interface SectionWrapperProps {  title?: string | React.ReactNode;  subtitle?: string;  badge?: string;  backgroundType?: 'dark' | 'gradient' | 'split' | 'darker';  className?: string;  children: React.ReactNode;}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  title,
  subtitle,
  badge,
  backgroundType = 'dark',
  className = '',
  children
}) => {
  const getBackgroundClasses = () => {
    switch (backgroundType) {
      case 'gradient':
        return 'bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-950';
      case 'split':
        return 'bg-gradient-to-r from-slate-950 via-slate-900/60 to-slate-950';
      case 'darker':
        return 'bg-slate-950/90';
      default:
        return 'bg-slate-900/50';
    }
  };

  return (
    <section className={`relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 ${getBackgroundClasses()} ${className}`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent" />
      
      <div className="relative max-w-5xl mx-auto">
        {/* Section Header */}
        {(title || subtitle || badge) && (
          <div className="text-center mb-16">
            {/* Badge */}
            {badge && (
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="text-slate-300 text-sm font-medium tracking-wide">
                  {badge}
                </span>
              </div>
            )}
            
            {/* Title */}
            {title && (
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
                {title}
              </h2>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper; 