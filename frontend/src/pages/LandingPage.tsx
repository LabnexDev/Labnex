import React from 'react';
import { useModal } from '../contexts/ModalContext';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Seo from '../components/common/Seo';

// Import background components
import OrbBackground from '../components/visual/OrbBackground';
import GlobalBackground from '../components/landing/GlobalBackground';

// Import all landing page components
import HeroSection from '../components/landing/HeroSection';
import BeforeAfterComparison from '../components/landing/BeforeAfterComparison';
import FeatureGrid from '../components/landing/FeatureGrid';
import TechnicalMetrics from '../components/landing/TechnicalMetrics';
import AdvancedCodeInterface from '../components/landing/AdvancedCodeInterface';
import FloatingUIShowcase from '../components/landing/FloatingUIShowcase';
import WorkflowSteps from '../components/landing/WorkflowSteps';
import SystemArchitecture from '../components/landing/SystemArchitecture';
import SecurityCompliance from '../components/landing/SecurityCompliance';
import PerformanceBenchmarks from '../components/landing/PerformanceBenchmarks';
import AIHighlights from '../components/landing/AIHighlights';
import FinalCTA from '../components/landing/FinalCTA';

// Import visual components
import AIResponseBox from '../components/visual/AIResponseBox';

// Common Button
import { Button } from '../components/common/Button';

// Icons for WorkflowSteps and AIHighlights
import {
  FolderPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  PlayCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CodeBracketSquareIcon,
} from '@heroicons/react/24/outline';

// Define interfaces for data props
export interface WorkflowStepItem {
  id: number;
  icon: React.ElementType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
}

export interface AIPowerItem {
  icon: React.ElementType;
  title: string;
  description: string;
}

const LandingPage: React.FC = () => {
  const { openModal } = useModal();

  const handleWaitlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openModal('waitlist');
  };

  // Data for WorkflowSteps component
  const workflowStepsData: WorkflowStepItem[] = [
    {
      id: 1, icon: FolderPlusIcon, title: "1. Define & Initialize", 
      shortDescription: "Start projects with Labnex AI.", 
      detailedDescription: "Kickstart your venture by creating a new project directly within Labnex or use Labnex AI on Discord for an accelerated start."
    },
    {
      id: 2, icon: ClipboardDocumentListIcon, title: "2. Plan & Strategize", 
      shortDescription: "Break down projects and design tests.", 
      detailedDescription: "Transform vision into actionable plans. Create tasks, assign priorities, and design thorough test cases."
    },
    {
      id: 3, icon: UserGroupIcon, title: "3. Assign & Collaborate", 
      shortDescription: "Allocate tasks and test cases.", 
      detailedDescription: "Streamline teamwork by assigning tasks and test cases. Labnex provides transparent overview of responsibilities."
    },
    {
      id: 4, icon: (props: any) => <div className="relative"><PlayCircleIcon {...props} /><SparklesIcon {...props} className="w-5 h-5 absolute -bottom-1 -right-1 text-yellow-400 opacity-90"/></div>, 
      title: "4. Execute with AI Support", 
      shortDescription: "Develop, test, and get AI help.", 
      detailedDescription: "Bring your project to life. Labnex AI on Discord acts as your assistant for notes, snippets, and queries."
    },
    {
      id: 5, icon: ArrowPathIcon, title: "5. Track, Refine, Deliver", 
      shortDescription: "Monitor, analyze, iterate, and deliver.", 
      detailedDescription: "Keep your project on track with real-time dashboards. Analyze results, manage defects, and refine your product."
    },
  ];

  // Data for AIHighlights component
  const aiHighlightsData: AIPowerItem[] = [
    {
      icon: FolderPlusIcon, title: "Instant Project Scaffolding", 
      description: "Describe your project; Labnex AI drafts names, descriptions, and task categories."
    },
    {
      icon: PencilSquareIcon, title: "Smarter Notes, Instantly", 
      description: "Dictate ideas; Labnex AI organizes, summarizes, or extracts action items."
    },
    {
      icon: CodeBracketSquareIcon, title: "Your AI Code Sidekick", 
      description: "Save, categorize, and retrieve code. Ask Labnex AI to explain, clean, or optimize."
    }
  ];

  return (
    <>
      <Seo title="Labnex – AI Project & Test Case Management" description="Simplify project management, testing, and code snippets with AI-powered Labnex." canonical="https://www.labnex.dev/" />
      <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate">
        <GlobalBackground />
        <OrbBackground />
        
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-md shadow-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="font-bold text-2xl text-white">Labnex</Link>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Button to="/roadmap" variant="tertiary" size="sm">
                  The Road Map
                </Button>
                <Button onClick={handleWaitlistClick} variant="primary" size="sm" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-[1.02]">
                  Join Waitlist
                </Button>
              </div>
              <div className="md:hidden flex items-center space-x-2">
                <Button to="/roadmap" variant="tertiary" size="sm" className="px-3 py-2">
                  Roadmap
                </Button>
                <Button onClick={handleWaitlistClick} variant="primary" size="sm" className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium">
                  Join
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Waitlist Modal */}
        {/* Waitlist Modal JSX has been removed. It is now handled by GlobalModalRenderer. */}

        {/* Page Sections - Strategically Arranged for Maximum Impact */}
        <HeroSection />
        <BeforeAfterComparison />
        <div id="features">
          <FeatureGrid />
        </div>
        <TechnicalMetrics />
        
        {/* Discord Commands Section - Preserved from original */}
        <section 
          id="labnex-ai" 
          className="py-16 sm:py-24 px-6 bg-slate-900/50 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300 text-sm font-medium tracking-wide">
                Discord Integration
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Meet{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Labnex AI
              </span>
              {' '}Assistant
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Unlock new levels of productivity. Interact with Labnex directly from Discord using simple commands or natural language for project setup and management.
            </p>
            
            <AIResponseBox 
              message={`@Labnex AI link my discord account\n# Securely connect your Labnex and Discord accounts.\n\n@Labnex AI create a note "Finalize UI mockups" for the Phoenix App project\n# Instantly capture thoughts and link them to projects.\n\n@Labnex AI set up a new mobile game project and include unit tests for player movement\n# Let AI handle the initial project scaffolding via natural language.`}
            />
          </div>
        </section>

        <AdvancedCodeInterface />
        <WorkflowSteps workflowStepsData={workflowStepsData} />
        <FloatingUIShowcase />
        <SystemArchitecture />
        <SecurityCompliance />
        <PerformanceBenchmarks />
        <AIHighlights aiHighlightsData={aiHighlightsData} />
        <FinalCTA />

      </div>
    </>
  );
};

export default LandingPage;