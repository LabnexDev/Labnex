import React, { useEffect, useState } from 'react';
import SectionWrapper from './SectionWrapper';

interface Metric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: React.ReactNode;
  color: string;
}

const TechnicalMetrics: React.FC = () => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  const metrics: Metric[] = [
        {      id: 'projects',      label: 'Active Projects',      value: 12,      suffix: '',      description: 'Projects currently in development',      trend: 'up',      trendValue: '+3 this month',      color: 'emerald',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
        {      id: 'testcases',      label: 'Test Cases',      value: 89,      suffix: '',      description: 'Test cases created and managed',      trend: 'up',      trendValue: '+12 this week',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks Tracked',
      value: 3421,
      suffix: '',
      description: 'Tasks managed across all projects',
      trend: 'up',
      trendValue: '+89 completed',
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'users',
      label: 'Active Users',
      value: 567,
      suffix: '',
      description: 'Developers using Labnex',
      trend: 'up',
      trendValue: '+23% growth',
      color: 'orange',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'aicommands',
      label: 'AI Commands',
      value: 12847,
      suffix: '',
      description: 'Discord bot commands processed',
      trend: 'up',
      trendValue: '+156 today',
      color: 'pink',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'snippets',
      label: 'Code Snippets',
      value: 934,
      suffix: '',
      description: 'Code snippets saved & shared',
      trend: 'up',
      trendValue: '+45 this week',
      color: 'cyan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ];

  // Animate counters on mount
  useEffect(() => {
    const animateMetric = (metric: Metric) => {
      const duration = 2000;
      const steps = 60;
      const increment = metric.value / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const currentValue = Math.min(increment * currentStep, metric.value);
        
        setAnimatedValues(prev => ({
          ...prev,
          [metric.id]: currentValue
        }));

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, duration / steps);
    };

    metrics.forEach(metric => {
      setTimeout(() => animateMetric(metric), Math.random() * 500);
    });
  }, []);

  const formatValue = (metric: Metric, animatedValue: number): string => {
    if (metric.id === 'aicommands' || metric.id === 'users') {
      return Math.floor(animatedValue).toLocaleString();
    }
    if (metric.suffix === '%' || metric.suffix === 'ms') {
      return animatedValue.toFixed(1);
    }
    return Math.floor(animatedValue).toString();
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
      orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
      pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
      cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <SectionWrapper 
      badge="Platform Statistics"
      title={
        <>
          Built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            real-world impact
          </span>
        </>
      }
      subtitle="Honest metrics from our beta platform showing real usage and growth as we build Labnex together with our early adopters."
      backgroundType="darker"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`relative group bg-gradient-to-br ${getColorClasses(metric.color)} backdrop-blur-md border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${getColorClasses(metric.color)} rounded-xl flex items-center justify-center`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(metric.trend)}
                <span className={metric.trend === 'stable' ? 'text-slate-400' : 'text-emerald-400'}>
                  {metric.trendValue}
                </span>
              </div>
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                {metric.prefix && (
                  <span className="text-lg font-semibold text-white opacity-80">
                    {metric.prefix}
                  </span>
                )}
                <span className="text-3xl font-bold text-white">
                  {formatValue(metric, animatedValues[metric.id] || 0)}
                </span>
                <span className="text-lg font-semibold text-white opacity-80">
                  {metric.suffix}
                </span>
              </div>
            </div>

            {/* Label and Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {metric.label}
              </h3>
              <p className="text-slate-400 text-sm">
                {metric.description}
              </p>
            </div>

            {/* Animated border effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
          </div>
        ))}
      </div>

      {/* System Health Overview */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Platform Health Overview</h3>
            <p className="text-slate-400">Real-time monitoring of critical Labnex services</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-medium">All Systems Operational</span>
          </div>
        </div>

        {/* Health Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Express API', value: 98, color: 'emerald' },
            { name: 'MongoDB', value: 97, color: 'blue' },
            { name: 'Discord Bot', value: 95, color: 'purple' },
            { name: 'OpenAI Integration', value: 94, color: 'cyan' }
          ].map((system, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">{system.name}</span>
                <span className="text-white font-bold">{system.value}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${system.color === 'emerald' ? 'from-emerald-500 to-emerald-400' : 
                    system.color === 'blue' ? 'from-blue-500 to-blue-400' :
                    system.color === 'purple' ? 'from-purple-500 to-purple-400' :
                    'from-cyan-500 to-cyan-400'} transition-all duration-1000 ease-out`}
                  style={{ width: `${system.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default TechnicalMetrics; 