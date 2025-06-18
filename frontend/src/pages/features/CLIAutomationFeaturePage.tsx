import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import { useModal } from '../../contexts/ModalContext';
import Seo from '../../components/common/Seo';

// Relevant icons for CLI Automation
import {
  ComputerDesktopIcon,    // Main icon for CLI
  CommandLineIcon,        // For executing commands
  CogIcon,                // For configuration
  UsersIcon,              // For authentication
  LightBulbIcon,          // For AI capabilities
  ChartPieIcon,           // For analysis
  FolderArrowDownIcon,    // For project interactions
  WrenchScrewdriverIcon,  // For test execution (planned)
  CloudArrowUpIcon        // For CI/CD (planned)
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const CLIAutomationFeaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  const benefits: BenefitDetail[] = [
    {
      icon: CommandLineIcon,
      title: "Unified Command Interface",
      description: "Access Labnex functionalities directly from your terminal. Manage projects, trigger analyses, and interact with AI services using a consistent and powerful command structure.",
      status: 'current'
    },
    {
      icon: UsersIcon,
      title: "Secure Authentication",
      description: "Easily authenticate your CLI with your Labnex account to securely access your projects and data. Token-based authentication ensures your interactions are protected.",
      status: 'current'
    },
    {
      icon: CogIcon,
      title: "Configuration Management",
      description: "Configure CLI settings and project defaults to tailor the tool to your specific workflow and preferences. Manage API endpoints and output formats.",
      status: 'current'
    },
    {
      icon: FolderArrowDownIcon,
      title: "Project Interaction",
      description: "List, view, and manage your Labnex projects directly from the command line. Synchronize local project changes and retrieve project information programmatically.",
      status: 'current' 
    },
    {
      icon: LightBulbIcon,
      title: "AI-Powered Commands",
      description: "Leverage AI capabilities through dedicated CLI commands. Interact with Labnex AI for tasks like code suggestions, summarization, or querying project insights (features may vary based on AI service availability).",
      status: 'beta'
    },
    {
      icon: ChartPieIcon,
      title: "Basic Analysis Tools",
      description: "Perform preliminary analyses on your projects or code. Current analysis capabilities are foundational, with more advanced static and dynamic analysis features planned.",
      status: 'beta'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Automated Test Execution",
      description: "Run and manage your test suites directly from the CLI. Integrate testing into your development pipeline and get immediate feedback. (Local browser executor is a foundational piece for this).",
      status: 'planned'
    },
    {
      icon: CloudArrowUpIcon,
      title: "CI/CD Pipeline Integration",
      description: "Seamlessly integrate Labnex CLI into your Continuous Integration and Continuous Deployment (CI/CD) pipelines to automate builds, tests, and deployments.",
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
      <Seo title="CLI Automation – Labnex" description="Automate your workflows with the Labnex CLI powered by AI-based test generation." canonical="https://www.labnex.dev/features/cli-automation" breadcrumbs={[{name:'Home',url:'https://www.labnex.dev/'},{name:'Features',url:'https://www.labnex.dev/#features'},{name:'CLI Automation',url:'https://www.labnex.dev/features/cli-automation'}]} image="https://www.labnex.dev/og-features-cli-automation.png" />
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
              <div className="inline-block p-4 bg-gradient-to-r from-rose-500/30 to-orange-500/30 rounded-xl mb-6 border border-white/10">
                <ComputerDesktopIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 mb-4">
                Labnex CLI Automation Tool
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Boost your development productivity with the Labnex Command Line Interface. Automate tasks, manage projects, and integrate with AI services without leaving your terminal.
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
                      <div className="p-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-lg border border-white/10 flex-shrink-0">
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
              <h2 className="text-2xl font-semibold text-white mb-6">Power Up Your Workflow</h2>
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[250px] flex flex-col items-center justify-center">
                <CommandLineIcon className="w-16 h-16 text-rose-400 mb-4" />
                <p className="text-slate-400 text-lg italic">
                  Example: `labnex projects list --status active` or `labnex ai generate --type tests --file my_component.tsx`. The CLI is designed for scripting and automation, making complex tasks simpler.
                </p>
                <p className="text-xs text-slate-500 mt-2">(Explore full command reference with `labnex --help`)</p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold text-rose-300 mb-3 flex items-center"><WrenchScrewdriverIcon className="w-6 h-6 mr-2"/>Scripting & Automation Core</h3>
                <p className="text-slate-400 leading-relaxed">
                  The Labnex CLI is built with automation in mind. Manage your projects (`projects`), configure settings (`config`), and handle authentication (`auth`) programmatically. Current AI commands (`ai`) and analysis tools (`analyze`) provide a strong foundation for more advanced scripted workflows, which are under active development.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-orange-300 mb-3 flex items-center"><CloudArrowUpIcon className="w-6 h-6 mr-2"/>Towards Seamless Integration</h3>
                <p className="text-slate-400 leading-relaxed">
                  Our goal is a CLI that integrates deeply into your development ecosystem. While direct test execution and full CI/CD pipeline commands are planned, the existing structure supports building custom scripts for these purposes. We are focused on expanding native support for popular CI/CD platforms and testing frameworks.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><LightBulbIcon className="w-6 h-6 mr-2"/>Extensible and Evolving</h3>
                <p className="text-slate-400 leading-relaxed">
                  The Labnex CLI is designed to be extensible. We plan to add more commands and features based on community feedback, including more sophisticated AI interactions, deeper project analysis capabilities, and direct integration with version control systems.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-slate-300 mb-6">Ready to automate your development process with Labnex CLI?</p>
              <button
                onClick={() => openModal('waitlist')}
                className="px-8 py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
              >
                Join Waitlist for CLI Updates
              </button>
              <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-rose-400 hover:underline">We'd love to hear from you!</a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Or, <button onClick={() => navigate(-1)} className="text-rose-400 hover:underline">explore other upcoming features</button>.
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Labnex CLI is evolving; command availability and features are subject to change.</p>
        </footer>
      </div>
    </>
  );
};

export default CLIAutomationFeaturePage; 