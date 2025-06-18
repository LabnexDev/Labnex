import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import { useModal } from '../../contexts/ModalContext';
import Seo from '../../components/common/Seo';

// Relevant icons for Notes & Snippets
import {
  ClipboardDocumentListIcon, // Main icon
  PencilSquareIcon,          // For creation/editing
  CodeBracketSquareIcon,     // For code snippets
  SparklesIcon,              // For AI note generation
  WrenchScrewdriverIcon,     // For AI code assistance
  LinkIcon,                  // For project linking
  GlobeAltIcon,              // For cross-platform access
  MagnifyingGlassIcon,       // For search/organization
  ChatBubbleLeftRightIcon,   // For Discord integration
  ArchiveBoxIcon,            // For future: Advanced Archival
  UserGroupIcon              // For future: Sharing/Collaboration
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const NotesAndSnippetsFeaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  const benefits: BenefitDetail[] = [
    {
      icon: PencilSquareIcon,
      title: "Comprehensive Note Management",
      description: "Create, edit, organize, and delete rich-text notes. Keep your thoughts, meeting minutes, and project documentation structured and readily accessible.",
      status: 'current'
    },
    {
      icon: CodeBracketSquareIcon,
      title: "Efficient Code Snippet Storage",
      description: "Save, manage, and categorize your code snippets in various languages with syntax highlighting. Quickly find and reuse important code blocks, enhancing your development workflow.",
      status: 'current'
    },
    {
      icon: LinkIcon,
      title: "Project-Specific Context",
      description: "Link your notes and code snippets directly to specific projects. This ensures that all relevant information is organized and easily found within the context of your work.",
      status: 'current'
    },
    {
      icon: GlobeAltIcon,
      title: "Seamless Cross-Platform Access",
      description: "Access and manage your notes and snippets from the Labnex web interface. Enjoy a consistent experience whether you're at your desk or on the go.",
      status: 'current'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Discord Integration for Quick Capture",
      description: "Quickly save notes and snippets directly from Discord using simple commands. Capture ideas and code as they arise, without interrupting your flow.",
      status: 'current'
    },
    {
      icon: SparklesIcon,
      title: "AI-Powered Note Generation",
      description: "Leverage AI to generate notes from prompts. Kickstart your documentation, brainstorm ideas, or summarize text effortlessly, saving you valuable time.",
      status: 'beta'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "AI Code Assistance",
      description: "Get AI-powered suggestions to clean up, explain, or fix errors in your code snippets. Improve code quality and understanding with intelligent assistance.",
      status: 'beta'
    },
    {
      icon: MagnifyingGlassIcon,
      title: "Powerful Search & Filtering",
      description: "Easily search and filter through your entire collection of notes and snippets by title, content, language (for snippets), or associated project.",
      status: 'current' // Implied by API capabilities
    },
    {
      icon: UserGroupIcon,
      title: "Sharing & Collaboration (Planned)",
      description: "Share your notes and snippets with team members or collaborators. Work together on documentation and code libraries to boost collective productivity.",
      status: 'planned'
    },
    {
      icon: ArchiveBoxIcon,
      title: "Advanced Archival & Versioning (Planned)",
      description: "Future support for note and snippet version history and an advanced archival system to manage older or less frequently used items without deleting them.",
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
      <Seo title="Notes & Snippets – Labnex" description="Capture ideas and manage reusable code with Labnex notes and snippet storage, integrated with AI and Discord." canonical="https://www.labnex.dev/features/notes-and-snippets" breadcrumbs={[{name:'Home',url:'https://www.labnex.dev/'},{name:'Features',url:'https://www.labnex.dev/#features'},{name:'Notes & Snippets',url:'https://www.labnex.dev/features/notes-and-snippets'}]} />
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
              <div className="inline-block p-4 bg-gradient-to-r from-sky-500/30 to-teal-500/30 rounded-xl mb-6 border border-white/10">
                <ClipboardDocumentListIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-400 mb-4">
                Notes & Code Snippets
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Capture ideas, document processes, and save useful code snippets. Labnex integrates notes and snippets across the web and Discord, enhanced with AI capabilities to boost your productivity.
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
                      <div className="p-2 bg-gradient-to-r from-sky-500/20 to-teal-500/20 rounded-lg border border-white/10 flex-shrink-0">
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
              <h2 className="text-2xl font-semibold text-white mb-6">Centralize Your Knowledge</h2>
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center">
                <div className="flex space-x-4 mb-4">
                  <PencilSquareIcon className="w-12 h-12 text-sky-400" />
                  <CodeBracketSquareIcon className="w-12 h-12 text-teal-400" />
                </div>
                <p className="text-slate-400 text-lg italic">
                  Quickly jot down thoughts during a meeting, save a complex SQL query for later, or let AI help draft documentation. Your personal and project knowledge, always at your fingertips.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold text-sky-300 mb-3 flex items-center"><SparklesIcon className="w-6 h-6 mr-2"/>AI-Enhanced Productivity</h3>
                <p className="text-slate-400 leading-relaxed">
                  Move beyond simple note-taking. With Labnex, you can generate note content from prompts and get AI assistance for your code snippets, including cleanup and error fixing. This helps you work smarter and faster. AI features are continuously evolving to provide more value.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-teal-300 mb-3 flex items-center"><GlobeAltIcon className="w-6 h-6 mr-2"/>Integrated & Accessible</h3>
                <p className="text-slate-400 leading-relaxed">
                  Labnex Notes & Snippets are designed to be an integral part of your workflow. Access them via our web platform or through Discord for quick captures. Link them to projects for contextual organization, ensuring your valuable information is never lost and always relevant.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><UserGroupIcon className="w-6 h-6 mr-2"/>Future-Focused: Collaboration & More</h3>
                <p className="text-slate-400 leading-relaxed">
                  We're committed to making Notes & Snippets even more powerful. Planned features include robust sharing and collaboration options for teams, advanced archival, version history, and deeper integrations with other Labnex tools and third-party services.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-slate-300 mb-6">Ready to organize your ideas and code with Labnex?</p>
              <button
                onClick={() => openModal('waitlist')}
                className="px-8 py-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
              >
                Get Started with Labnex
              </button>
              <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-sky-400 hover:underline">We'd love to hear from you!</a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Or, <button onClick={() => navigate(-1)} className="text-sky-400 hover:underline">explore other Labnex features</button>.
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Features and availability are subject to change.</p>
        </footer>
      </div>
    </>
  );
};

export default NotesAndSnippetsFeaturePage; 