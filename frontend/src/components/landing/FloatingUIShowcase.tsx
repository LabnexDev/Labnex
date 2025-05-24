import React from 'react';
import SectionWrapper from './SectionWrapper';

const FloatingUIShowcase: React.FC = () => {
  return (
    <SectionWrapper 
      badge="Interface Preview"
      title={
        <>
          Beautifully designed for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            productivity
          </span>
        </>
      }
      subtitle="Experience Labnex's intuitive interface designed for modern development teams. Clean, powerful, and thoughtfully crafted."
      backgroundType="split"
    >
      {/* Main Floating UI Card */}
      <div className="relative max-w-6xl mx-auto">
        {/* Background glow effects */}
        <div className="absolute -inset-20 bg-gradient-to-r from-purple-600/10 via-blue-600/5 to-purple-600/10 rounded-full blur-3xl" />
        
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Browser Header */}
          <div className="flex items-center gap-3 p-6 bg-white/5 border-b border-white/10">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-500/80 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500/80 rounded-full" />
              <div className="w-3 h-3 bg-green-500/80 rounded-full" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-slate-400">app.labnex.io/dashboard</span>
              </div>
            </div>
            <div className="w-16" /> {/* Spacer for symmetry */}
          </div>

          {/* Dashboard Content */}
          <div className="p-8 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Project Dashboard</h1>
                <p className="text-slate-400">Welcome back to your workspace</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg">
                New Project
              </button>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Active Projects", value: "4", icon: "📁", trend: "+2 this week" },
                { title: "Test Cases", value: "12", icon: "🧪", trend: "100% passed" },
                { title: "Team Members", value: "3", icon: "👥", trend: "All active" },
                { title: "Success Rate", value: "100%", icon: "✅", trend: "Perfect score" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-slate-300 font-medium text-sm">{stat.title}</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-emerald-400">{stat.trend}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[
                    { action: "Project 'Labnex Core' created", time: "2 minutes ago", status: "success" },
                    { action: "Test case 'User Authentication' added", time: "1 hour ago", status: "info" },
                    { action: "Team member invited to project", time: "3 hours ago", status: "info" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200">
                      <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-400' : 'bg-blue-400'}`} />
                      <div className="flex-1">
                        <p className="text-slate-200 text-sm">{activity.action}</p>
                        <p className="text-slate-400 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>⚡</span>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {[
                    { title: "Create Test Case", description: "Add new test scenarios", icon: "🧪" },
                    { title: "Invite Team Member", description: "Collaborate with others", icon: "👥" },
                    { title: "Generate Report", description: "Export project insights", icon: "📄" }
                  ].map((action, index) => (
                    <button key={index} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left group">
                      <span className="text-xl">{action.icon}</span>
                      <div className="flex-1">
                        <div className="text-slate-200 font-medium text-sm group-hover:text-white transition-colors">{action.title}</div>
                        <div className="text-slate-400 text-xs">{action.description}</div>
                      </div>
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        {[
          {
            icon: "⚡",
            title: "Lightning Fast",
            description: "Optimized for performance with instant loading and smooth interactions"
          },
          {
            icon: "🎨",
            title: "Beautiful Design",
            description: "Clean, modern interface that developers love working with"
          },
          {
            icon: "📱",
            title: "Fully Responsive",
            description: "Works perfectly on desktop, tablet, and mobile devices"
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <span className="text-slate-300 text-lg font-medium">
            Ready to experience this workflow?
          </span>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg">
            Get Started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default FloatingUIShowcase; 