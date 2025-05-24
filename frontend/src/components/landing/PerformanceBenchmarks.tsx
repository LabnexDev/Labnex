import React, { useState, useEffect } from 'react';
import SectionWrapper from './SectionWrapper';

interface BenchmarkData {
  metric: string;
  labnex: number;
  competitor1: number;
  competitor2: number;
  unit: string;
  description: string;
  improvement: string;
  category: 'speed' | 'scale' | 'reliability';
}

interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
}

const PerformanceBenchmarks: React.FC = () => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<'speed' | 'scale' | 'reliability'>('speed');

  const benchmarkData: BenchmarkData[] = [
    {
      metric: 'API Response Time',
      labnex: 85,
      competitor1: 120,
      competitor2: 89,
      unit: 'ms',
      description: 'Average API response time in development',
      improvement: 'Optimizing',
      category: 'speed'
    },
    {
      metric: 'CLI Test Execution',
      labnex: 4.2,
      competitor1: 6.8,
      competitor2: 5.1,
      unit: 'sec',
      description: 'Time to execute 10 test cases with CLI',
      improvement: 'Competitive',
      category: 'speed'
    },
    {
      metric: 'Active Projects',
      labnex: 12,
      competitor1: 50,
      competitor2: 25,
      unit: '',
      description: 'Real projects currently managed',
      improvement: 'Growing',
      category: 'scale'
    },
    {
      metric: 'Database Operations',
      labnex: 45,
      competitor1: 120,
      competitor2: 80,
      unit: '/sec',
      description: 'Current database throughput',
      improvement: 'Scaling up',
      category: 'scale'
    },
    {
      metric: 'Development Uptime',
      labnex: 96.2,
      competitor1: 99.1,
      competitor2: 97.5,
      unit: '%',
      description: 'Platform stability during beta',
      improvement: 'Improving',
      category: 'reliability'
    },
    {
      metric: 'Error Rate',
      labnex: 2.1,
      competitor1: 0.8,
      competitor2: 1.5,
      unit: '%',
      description: 'Current error rate in beta testing',
      improvement: 'Optimizing',
      category: 'reliability'
    }
  ];

  const performanceMetrics: PerformanceMetric[] = [
    {
      id: 'latency',
      label: 'Response Latency',
      value: 85,
      target: 100,
      unit: 'ms',
      trend: 'down',
      description: 'Average API response time',
      color: 'emerald'
    },
    {
      id: 'throughput',
      label: 'Throughput',
      value: 45,
      target: 100,
      unit: '/sec',
      trend: 'up',
      description: 'Database operations per second',
      color: 'blue'
    },
    {
      id: 'users',
      label: 'Active Users',
      value: 23,
      target: 50,
      unit: '',
      trend: 'up',
      description: 'Current active beta users',
      color: 'purple'
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: 96.2,
      target: 99,
      unit: '%',
      trend: 'stable',
      description: 'Platform availability',
      color: 'orange'
    }
  ];

  // Animate metrics on mount
  useEffect(() => {
    const animateMetric = (metric: PerformanceMetric) => {
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

    performanceMetrics.forEach(metric => {
      setTimeout(() => animateMetric(metric), Math.random() * 500);
    });
  }, []);

  const getCategoryData = () => {
    return benchmarkData.filter(item => item.category === activeCategory);
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') return value.toFixed(1);
    if (unit === '' && value >= 1000) return (value / 1000).toFixed(1) + 'K';
    if (unit === '/sec' && value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.round(value).toString();
  };

  const getBarWidth = (value: number, max: number): number => {
    return Math.min((value / max) * 100, 100);
  };

  const getMetricColor = (color: string) => {
    const colors = {
      emerald: 'from-emerald-500 to-emerald-400',
      blue: 'from-blue-500 to-blue-400',
      orange: 'from-orange-500 to-orange-400',
      purple: 'from-purple-500 to-purple-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'speed':
        return '⚡';
      case 'scale':
        return '📈';
      case 'reliability':
        return '🛡️';
      default:
        return '📊';
    }
  };

  return (
    <SectionWrapper 
      badge="Performance Metrics"
      title={
        <>
          Honest{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            performance data
          </span>
        </>
      }
      subtitle="Real performance metrics from our beta platform. We're actively optimizing and improving based on actual usage data from our early adopters."
      backgroundType="split"
    >
      {/* Real-time Performance Dashboard */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Current Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric) => (
            <div key={metric.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">{metric.label}</h4>
                <div className={`w-3 h-3 rounded-full ${
                  metric.trend === 'up' ? 'bg-emerald-400' :
                  metric.trend === 'down' ? 'bg-blue-400' : 'bg-slate-400'
                } animate-pulse`} />
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatValue(animatedValues[metric.id] || 0, metric.unit)}
                  <span className="text-lg text-slate-400 ml-1">{metric.unit}</span>
                </div>
                <p className="text-slate-400 text-sm">{metric.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getMetricColor(metric.color)} transition-all duration-2000 ease-out`}
                    style={{ width: `${getBarWidth(animatedValues[metric.id] || 0, metric.target)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>Target: {metric.target}{metric.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Benchmarks */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Competitive Performance Analysis
        </h3>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 flex gap-1">
            {(['speed', 'scale', 'reliability'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 capitalize ${
                  activeCategory === category
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{getCategoryIcon(category)}</span>
                <span>{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="space-y-6">
          {getCategoryData().map((benchmark, index) => {
            const maxValue = Math.max(benchmark.labnex, benchmark.competitor1, benchmark.competitor2);
            
            return (
              <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-4 lg:mb-0">
                    <h4 className="text-lg font-bold text-white mb-1">{benchmark.metric}</h4>
                    <p className="text-slate-400 text-sm">{benchmark.description}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-blue-400 font-semibold text-sm">{benchmark.improvement}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Labnex */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Labnex (Beta)</span>
                      <span className="text-emerald-400 font-bold">
                        {formatValue(benchmark.labnex, benchmark.unit)}{benchmark.unit}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                        style={{ width: `${getBarWidth(benchmark.labnex, maxValue)}%` }}
                      />
                    </div>
                  </div>

                  {/* Competitor 1 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Similar Tool A</span>
                      <span className="text-slate-400">
                        {formatValue(benchmark.competitor1, benchmark.unit)}{benchmark.unit}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-1000 ease-out"
                        style={{ width: `${getBarWidth(benchmark.competitor1, maxValue)}%` }}
                      />
                    </div>
                  </div>

                  {/* Competitor 2 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Similar Tool B</span>
                      <span className="text-slate-400">
                        {formatValue(benchmark.competitor2, benchmark.unit)}{benchmark.unit}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-1000 ease-out"
                        style={{ width: `${getBarWidth(benchmark.competitor2, maxValue)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Optimization Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: '⚙️',
            title: 'Backend Optimization',
            description: 'Express.js and MongoDB performance tuning for faster responses'
          },
          {
            icon: '⚡',
            title: 'Frontend Caching',
            description: 'React Query caching and efficient state management'
          },
          {
            icon: '🔄',
            title: 'Database Indexing',
            description: 'MongoDB indexes optimized for common query patterns'
          },
          {
            icon: '🧠',
            title: 'AI Response Caching',
            description: 'Smart caching of OpenAI API responses to reduce latency'
          },
          {
            icon: '📊',
            title: 'Performance Monitoring',
            description: 'Real-time monitoring of key metrics and bottlenecks'
          },
          {
            icon: '🔍',
            title: 'Code Optimization',
            description: 'Continuous code review and optimization for better performance'
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Beta Performance Goals */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Our Performance Goals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { metric: 'API Response', value: '<100ms', description: 'Target for production' },
            { metric: 'Uptime Goal', value: '98%+', description: 'Aiming for reliability' },
            { metric: 'User Growth', value: '100+', description: 'Beta user target' },
            { metric: 'Response Time', value: '<24h', description: 'Community support' }
          ].map((goal, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{goal.value}</div>
              <div className="text-white font-semibold mb-1">{goal.metric}</div>
              <div className="text-slate-400 text-sm">{goal.description}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-slate-300 mb-6">
            We're building Labnex with performance in mind, actively optimizing based on real user feedback and usage patterns.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            Join Our Beta
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default PerformanceBenchmarks; 