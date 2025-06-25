import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LandingStyles.css';

const InteractiveAIScene: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState(0);

  const aiCapabilities = [
    {
      id: 1,
      title: "Intelligent Project Setup",
      description: "AI-powered project initialization with best practices",
      input: "Create a React e-commerce app with testing framework",
      output: "✅ Project structure created\n📦 Dependencies installed\n🧪 Test suites configured\n🔧 CI/CD pipeline ready",
      category: "Project Management",
      icon: "🎯",
      color: "from-purple-500 to-indigo-500"
    },
    {
      id: 2,
      title: "Smart Code Analysis",
      description: "Real-time code review and optimization suggestions",
      input: "Analyze this React component for performance",
      output: "🔍 Analysis complete\n⚡ 3 performance optimizations found\n🛡️ Security: Excellent\n📈 Suggested improvements ready",
      category: "Code Intelligence",
      icon: "🔧",
      color: "from-emerald-500 to-teal-500"
    },
    {
      id: 3,
      title: "Automated Testing",
      description: "Comprehensive test generation and coverage analysis",
      input: "Generate tests for user authentication flow",
      output: "✅ 24 test cases generated\n🎯 96% coverage achieved\n🔐 Security tests included\n⚡ Integration tests ready",
      category: "Quality Assurance",
      icon: "🧪",
      color: "from-blue-500 to-cyan-500"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-slate-800/40 backdrop-blur-xl rounded-full border border-slate-600/30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">
              AI Intelligence
            </span>
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              LIVE
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            AI-Powered{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Intelligence
            </span>
          </h2>
          
          <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Experience intelligent development assistance that understands context, 
            accelerates productivity, and learns from your patterns.
          </p>
        </motion.div>

        {/* Demo Selector */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          {aiCapabilities.map((demo, index) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(index)}
              className={`group relative px-6 py-4 rounded-xl font-medium text-sm transition-all duration-300 border ${
                activeDemo === index
                  ? 'bg-slate-800/60 border-purple-500/60 text-white scale-105'
                  : 'bg-slate-800/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/40 hover:border-slate-500/70 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{demo.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{demo.category}</div>
                  <div className="text-xs text-slate-500">{demo.title}</div>
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        {/* AI Demo Interface */}
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        >
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${aiCapabilities[activeDemo].color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white">Labnex AI Assistant</h3>
                  <p className="text-slate-400 text-sm">Intelligent development companion</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-sm text-slate-400">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDemo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-3xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl rounded-tr-lg px-6 py-4">
                      <p className="text-slate-200 text-base leading-relaxed">
                        {aiCapabilities[activeDemo].input}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-4xl bg-slate-700/40 backdrop-blur-sm border border-slate-600/50 rounded-2xl rounded-tl-lg px-6 py-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${aiCapabilities[activeDemo].color} text-white`}>
                          {aiCapabilities[activeDemo].category}
                        </div>
                        <span className="text-slate-400 text-sm">{aiCapabilities[activeDemo].title}</span>
                      </div>
                      
                      <pre className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-mono">
                        {aiCapabilities[activeDemo].output}
                      </pre>
                      
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-600/30">
                        <button className="flex items-center gap-2 px-3 py-1 text-slate-400 hover:text-slate-300 transition-colors text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                        <div className="ml-auto text-slate-500 text-sm">
                          Generated in 1.2s
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-xl">
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Ask Labnex AI anything about your projects..."
                    className="w-full bg-transparent text-slate-200 placeholder-slate-400 text-base focus:outline-none"
                    disabled
                  />
                </div>
                
                <button className={`p-3 bg-gradient-to-r ${aiCapabilities[activeDemo].color} hover:opacity-90 text-white rounded-lg transition-all duration-300 hover:scale-105`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Highlight */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
        >
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Natural Language</h3>
            <p className="text-slate-400 text-sm">Communicate with AI using everyday language</p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Context Aware</h3>
            <p className="text-slate-400 text-sm">AI understands your project context and history</p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Continuous Learning</h3>
            <p className="text-slate-400 text-sm">AI improves with every interaction</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveAIScene;
