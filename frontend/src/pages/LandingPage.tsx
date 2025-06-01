import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { addWaitlistEntry } from '../api/statsApi';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState('');

  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener('openWaitlistModal', handleOpenModal);
    const handleOpenComingSoonModal = (event: CustomEvent) => {
      setComingSoonFeature(event.detail.feature || 'This Feature');
      setIsComingSoonModalOpen(true);
    };
    window.addEventListener('openComingSoonModal', handleOpenComingSoonModal as EventListener);
    const handleOpenInfoModal = (event: CustomEvent) => {
      setInfoModalType(event.detail.type || '');
      setIsInfoModalOpen(true);
    };
    window.addEventListener('openInfoModal', handleOpenInfoModal as EventListener);
    return () => {
      window.removeEventListener('openWaitlistModal', handleOpenModal);
      window.removeEventListener('openComingSoonModal', handleOpenComingSoonModal as EventListener);
      window.removeEventListener('openInfoModal', handleOpenInfoModal as EventListener);
    };
  }, []);

  const handleWaitlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmail('');
    setIsEmailValid(true);
    setIsSubmitted(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(email)) {
      setIsEmailValid(true);
      console.log('Attempting to submit waitlist email:', email);
      try {
        const response = await addWaitlistEntry(email);
        if (response.success) {
          setIsSubmitted(true);
          console.log('Waitlist Email Submitted Successfully:', email);
        } else {
          console.error('Failed to add to waitlist:', response.message);
          setIsEmailValid(false);
        }
      } catch (error) {
        console.error('Error submitting waitlist email:', error);
        setIsEmailValid(false);
      }
    } else {
      setIsEmailValid(false);
    }
  };

  const handleCloseComingSoonModal = () => {
    setIsComingSoonModalOpen(false);
    setComingSoonFeature('');
  };

  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
    setInfoModalType('');
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
    <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate">
      <GlobalBackground />
      <OrbBackground />
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-md shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-2xl text-white">Labnex</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Button onClick={handleWaitlistClick} variant="primary" size="sm" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 hover:scale-[1.02]">
                  Join Waitlist
                </Button>
              </div>
            </div>
            <div className="md:hidden">
              <Button onClick={handleWaitlistClick} variant="primary" size="sm" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium">
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Waitlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
          <div className="relative bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-8 max-w-md w-full shadow-xl transform transition-transform duration-300 scale-100">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Join the Labnex Waitlist</h2>
            <p className="text-slate-400 mb-6">Be the first to experience Labnex. Enter your email to get early access.</p>
            {!isSubmitted ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-2 bg-slate-800/80 border ${isEmailValid ? 'border-slate-700' : 'border-red-500'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                  />
                  {!isEmailValid && <p className="text-red-400 text-sm mt-1">Please enter a valid email address.</p>}
                </div>
                <Button type="submit" variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300">
                  Join Waitlist
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-emerald-400 font-medium mb-4">Thanks for joining! We'll notify you soon.</p>
                <Button onClick={handleCloseModal} variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-300">
                  Got it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {isComingSoonModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
          <div className="relative bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-8 max-w-md w-full shadow-xl transform transition-transform duration-300 scale-100">
            <button onClick={handleCloseComingSoonModal} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">{comingSoonFeature} - Coming Soon</h2>
            <p className="text-slate-400 mb-6">We are still in development, and this feature is not yet available. Join our waitlist to be notified when it's ready!</p>
            <Button onClick={handleCloseComingSoonModal} variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300">
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Info Modal for Privacy, Terms, Support, Contact */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
          <div className="relative bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-8 max-w-2xl w-full shadow-xl transform transition-transform duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            <button onClick={handleCloseInfoModal} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {infoModalType === 'privacy' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy</h2>
                <p className="text-slate-400 mb-4">
                  At Labnex, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information.
                </p>
                <p className="text-slate-400 mb-4">
                  This page is a placeholder. Full details on our privacy practices will be updated soon as we prepare for launch.
                </p>
                <p className="text-slate-400 mb-6">
                  For inquiries, please contact us at labnexcontact@gmail.com.
                </p>
              </>
            )}
            {infoModalType === 'terms' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Terms of Service</h2>
                <p className="text-slate-400 mb-4">
                  These Terms of Service govern your use of Labnex services. By accessing our platform, you agree to these terms.
                </p>
                <p className="text-slate-400 mb-4">
                  This page is a placeholder. Full terms will be updated soon as we prepare for launch.
                </p>
                <p className="text-slate-400 mb-6">
                  For inquiries, please contact us at labnexcontact@gmail.com.
                </p>
              </>
            )}
            {infoModalType === 'support' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Support</h2>
                <p className="text-slate-400 mb-4">
                  We're here to help with any questions or issues you may have about Labnex.
                </p>
                <p className="text-slate-400 mb-4">
                  This page is a placeholder. Full support resources will be available soon as we prepare for launch.
                </p>
                <p className="text-slate-400 mb-6">
                  For immediate inquiries, please contact us at labnexcontact@gmail.com.
                </p>
              </>
            )}
            {infoModalType === 'contact' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                <p className="text-slate-400 mb-4">
                  Have questions about Labnex? Want to learn more or get involved?
                </p>
                <p className="text-slate-400 mb-4">
                  This page is a placeholder. Full contact details and forms will be available soon as we prepare for launch.
                </p>
                <p className="text-slate-400 mb-6">
                  For now, reach out to us at labnexcontact@gmail.com.
                </p>
              </>
            )}
            <Button onClick={handleCloseInfoModal} variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 mt-4">
              Close
            </Button>
          </div>
        </div>
      )}

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

      {/* Footer */}
      <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm">
        <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved.</p>
        <p className="text-xs mt-2 text-slate-500">Built with passion for developers and testers.</p>
      </footer>
    </div>
  );
};

export default LandingPage;