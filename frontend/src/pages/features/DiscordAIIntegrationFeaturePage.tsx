import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import Seo from '../../components/common/Seo';

// Relevant icons for Discord AI Integration
import {
  ChatBubbleLeftRightIcon, // Main icon for Discord/AI
  CommandLineIcon,        // For executing commands
  LightBulbIcon,          // For AI smarts
  DocumentTextIcon,       // For notes & snippets
  BriefcaseIcon,          // For project management via Discord
  CheckBadgeIcon,         // For test case interaction
  SparklesIcon,           // For advanced AI capabilities
  PuzzlePieceIcon         // For future integrations
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const DiscordAIIntegrationFeaturePage: React.FC = () => {
  const navigate = useNavigate();

  const benefits: BenefitDetail[] = [
    {
      icon: CommandLineIcon,
      title: "Command-Based Interaction",
      description: "Control and manage your Labnex projects directly from Discord using intuitive slash commands. Create, view, and update projects, tasks, notes, and snippets without leaving your chat.",
      status: 'current'
    },
    {
      icon: BriefcaseIcon,
      title: "Remote Project Management",
      description: "Perform key project management actions via Discord. Get project overviews, list tasks, and quickly add new items, streamlining your workflow when away from the web app.",
      status: 'current'
    },
    {
      icon: DocumentTextIcon,
      title: "Notes & Snippet Management",
      description: "Quickly save ideas, notes, and code snippets through Discord commands. These are synced with your Labnex account, making them accessible from anywhere.",
      status: 'current'
    },
    {
      icon: CheckBadgeIcon,
      title: "Test Case Integration (Basic)",
      description: "View test case details and statuses through Discord. Full test case management (create/edit/execute) via Discord is planned for future updates.",
      status: 'beta'
    },
    {
      icon: LightBulbIcon,
      title: "AI-Powered Assistance",
      description: "Leverage AI to help with summarizing project status, suggesting task priorities, or answering queries about your project data directly within Discord. (Powered by ChatGPT integration)",
      status: 'beta'
    },
    {
      icon: SparklesIcon,
      title: "Proactive Notifications & Alerts",
      description: "Receive automated notifications in Discord for important project updates, task assignments, mentions, and upcoming deadlines, keeping your team informed.",
      status: 'planned'
    },
    {
      icon: PuzzlePieceIcon,
      title: "Contextual AI Conversations",
      description: "Engage in more natural, conversational interactions with the Labnex AI bot, allowing it to understand context from previous messages and provide more relevant assistance for complex queries.",
      status: 'planned'
    }
  ];

  const getStatusBadge = (status?: 'current' | 'beta' | 'planned') => {
    if (!status) return null;
    let bgColor, textColor, borderColor, text;
    switch (status) {
      case 'current':
        bgColor = 'bg-emerald-500/20'; textColor = 'text-emerald-300'; borderColor = 'border-emerald-500/40'; text = 'Available';
        break;
      case 'beta':
        bgColor = 'bg-blue-500/20'; textColor = 'text-blue-300'; borderColor = 'border-blue-500/40'; text = 'In Beta';
        break;
      case 'planned':
        bgColor = 'bg-amber-500/20'; textColor = 'text-amber-300'; borderColor = 'border-amber-500/40'; text = 'Planned';
        break;
      default: return null;
    }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>{text}</span>;
  };

  return (
    <>
      <Seo title="Discord AI Integration – Labnex" description="Interact with Labnex AI directly in Discord to accelerate project and task management." canonical="https://www.labnex.dev/features/discord-ai-integration" breadcrumbs={[{name:'Home',url:'https://www.labnex.dev/'},{name:'Features',url:'https://www.labnex.dev/#features'},{name:'Discord AI Integration',url:'https://www.labnex.dev/features/discord-ai-integration'}]} />
      <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate">
        <GlobalBackground />
        <OrbBackground />

        <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-150"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Features
            </button>
          </div>
        </header>

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-slate-900/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 sm:p-10">
            <div className="text-center mb-12">
              <div className="inline-block p-4 bg-gradient-to-r from-teal-500/30 to-cyan-500/30 rounded-xl mb-6 border border-white/10">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-4">
                Discord AI Integration
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Seamlessly connect Labnex with your Discord server. Our AI assistant helps manage projects, tasks, notes, and more, directly from your favorite communication platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-lg border border-white/10 flex-shrink-0">
                        <benefit.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-md font-semibold text-white">{benefit.title}</h3>
                    </div>
                    {getStatusBadge(benefit.status)}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed flex-grow">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="my-16 text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">AI at Your Fingertips</h2>
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[250px] flex flex-col items-center justify-center">
                <LightBulbIcon className="w-16 h-16 text-teal-400 mb-4" />
                <p className="text-slate-400 text-lg italic">
                  Imagine asking your Labnex AI bot: "What are my high-priority tasks for Project Phoenix?" or "Create a note about our new API design." This level of integration is what we're building towards.
                </p>
                <p className="text-xs text-slate-500 mt-2">(Live demos and advanced AI interactions coming soon)</p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold text-teal-300 mb-3 flex items-center"><CommandLineIcon className="w-6 h-6 mr-2"/>Streamlined Discord Commands</h3>
                <p className="text-slate-400 leading-relaxed">
                  Labnex AI provides a comprehensive set of slash commands for interacting with your projects. Currently, you can manage projects, tasks, notes, and snippets. We are continuously refining these commands for ease of use and adding new functionalities based on user feedback.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-cyan-300 mb-3 flex items-center"><SparklesIcon className="w-6 h-6 mr-2"/>Smart & Contextual Assistance</h3>
                <p className="text-slate-400 leading-relaxed">
                  Beyond simple commands, our AI aims to understand your needs better. Beta features include AI-powered summaries and basic Q&A. We're working towards an AI that understands conversation context, provides proactive suggestions, and integrates deeply with your workflow, making project management more intuitive.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><PuzzlePieceIcon className="w-6 h-6 mr-2"/>Future of Integrated Communication</h3>
                <p className="text-slate-400 leading-relaxed">
                  The vision is an AI assistant that not only responds to commands but actively participates in your team's communication, offering timely information, alerts, and summaries. Planned features include advanced notification systems and the ability for the AI to learn from your team's interactions to provide even more personalized support.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-slate-300 mb-6">Ready to bring AI power to your Discord server?</p>
              <button
                onClick={() => window.open('https://discord.gg/gaCmp8yE', '_blank')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
              >
                Join our Discord Server
              </button>
              <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:underline">We'd love to hear from you!</a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Or, <button onClick={() => navigate(-1)} className="text-purple-400 hover:underline">explore other Labnex features</button>.
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Labnex AI for Discord is actively under development; specific commands and AI capabilities are subject to change.</p>
        </footer>
      </div>
    </>
  );
};

export default DiscordAIIntegrationFeaturePage; 