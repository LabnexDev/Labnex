import React from 'react';
import './LandingStyles.css';
import { useModal } from '../../contexts/ModalContext';

const MockPreview: React.FC = () => {
  const { openModal } = useModal();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/40 backdrop-blur-xl rounded-full border border-slate-600/30">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              Interface Preview
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Beautifully designed for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              productivity
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Experience Labnex's intuitive interface designed for modern development teams. 
            Clean, powerful, and thoughtfully crafted.
          </p>
        </div>

        {/* Main Mockup Container */}
        <div className="glass-card p-6 rounded-2xl overflow-hidden">
          {/* Browser Header */}
          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-t-xl border-b border-slate-700/50">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500/80 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500/80 rounded-full" />
              <div className="w-3 h-3 bg-green-500/80 rounded-full" />
            </div>
            <div className="flex-1 text-center text-sm text-slate-400">
              Labnex Dashboard
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="bg-slate-800/40 p-6">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-slate-400">Welcome back to your workspace</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                New Project
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Active Projects", value: "4", icon: "📁" },
                { title: "Test Cases", value: "12", icon: "🧪" },
                { title: "Team Members", value: "3", icon: "👥" },
                { title: "Success Rate", value: "100%", icon: "✅" }
              ].map((stat, index) => (
                <div key={index} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-slate-300 font-medium">{stat.title}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: "Project 'Labnex' created", time: "2 minutes ago", status: "success" },
                  { action: "Test case 'User Login' added", time: "1 hour ago", status: "info" },
                  { action: "Team member joined project", time: "3 hours ago", status: "info" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-400' : 'bg-blue-400'}`} />
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm">{activity.action}</p>
                      <p className="text-slate-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: "⚡",
              title: "Lightning Fast",
              description: "Optimized for performance with instant loading"
            },
            {
              icon: "🎨",
              title: "Beautiful Design",
              description: "Clean, modern interface that developers love"
            },
            {
              icon: "📱",
              title: "Fully Responsive",
              description: "Works perfectly on desktop, tablet, and mobile"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-600/50">
            <span className="text-slate-300 text-lg font-medium">
              Ready to experience this workflow?
            </span>
            <button 
              onClick={() => openModal('waitlist')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MockPreview;