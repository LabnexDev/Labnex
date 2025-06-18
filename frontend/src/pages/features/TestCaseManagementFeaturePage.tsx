import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import { useModal } from '../../contexts/ModalContext';
import Seo from '../../components/common/Seo';

// Relevant icons for Test Case Management
import { 
  BeakerIcon, 
  ListBulletIcon, 
  ClipboardDocumentCheckIcon, 
  ChartPieIcon, 
  DocumentMagnifyingGlassIcon,
  CogIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const TestCaseManagementFeaturePage: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  // Define benefits/sub-features for Test Case Management
  // USER: Please review and update the 'status' for each benefit based on current implementation.
  const benefits: BenefitDetail[] = [
    {
      icon: ClipboardDocumentCheckIcon,
      title: "Test Case Design",
      description: "Define test cases with essential details like title, description, step-by-step instructions, expected results, and priority. Labnex provides a clear structure for comprehensive test documentation.",
      status: 'current' 
    },
    {
      icon: BeakerIcon, 
      title: "Execution Status Tracking",
      description: "Update and track the status of your test cases (e.g., Pass, Fail, Pending). This core feature helps monitor testing progress directly within the platform.",
      status: 'current' 
    },
    {
      icon: ListBulletIcon,
      title: "Organized Test Libraries (Project-Based)",
      description: "Test cases are organized per project, providing a central library for each of your development efforts. Future enhancements aim to introduce more granular organization like Test Suites and Test Plans.",
      status: 'current' 
    },
    {
      icon: DocumentMagnifyingGlassIcon,
      title: "Basic Audit Trails",
      description: "Track when test cases are created and last updated, and by whom. While full version control is a planned feature, basic audit trails are available.",
      status: 'beta' 
    },
    {
      icon: ChartPieIcon,
      title: "Reporting & Analytics Dashboards",
      description: "Visualize test coverage, execution progress, and identify trends. Comprehensive reporting dashboards are a planned feature to provide deeper insights into your QA process.",
      status: 'planned'
    },
    {
      icon: CogIcon,
      title: "Advanced Customization (Future)",
      description: "Future enhancements include capabilities like custom fields for test cases and test parameterization for data-driven testing, offering greater flexibility to tailor Labnex to your specific needs.",
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
      <Seo title="Test Case Management – Labnex" description="Discover how Labnex helps you design, organize, and track software test cases." canonical="https://www.labnex.dev/features/test-case-management" />
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
                <ClipboardDocumentCheckIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-4">
                Test Case Management in Labnex
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Labnex provides foundational tools to design, manage, and track your test cases. We are actively building robust features to streamline your quality assurance workflow and provide deeper insights.
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
              <h2 className="text-2xl font-semibold text-white mb-6">The Future of QA with Labnex</h2>
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[250px] flex flex-col items-center justify-center">
                <LightBulbIcon className="w-16 h-16 text-cyan-400 mb-4" />
                <p className="text-slate-400 text-lg italic">
                  Our vision includes seamless integration between test cases, project tasks, and automated testing tools, providing a holistic view of your application's quality.
                </p>
                <p className="text-xs text-slate-500 mt-2">(Visual mockups of advanced reporting & integrations coming soon)</p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold text-teal-300 mb-3 flex items-center"><WrenchScrewdriverIcon className="w-6 h-6 mr-2"/>Designing for Detail & Clarity</h3>
                <p className="text-slate-400 leading-relaxed">
                  The foundation of effective testing is well-defined test cases. Labnex enables you to capture preconditions (via description), detailed steps, and expected outcomes, along with priority and status. We are focused on making this process intuitive and plan to introduce features like rich text formatting and attachment capabilities.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-cyan-300 mb-3 flex items-center"><BeakerIcon className="w-6 h-6 mr-2"/>Tracking Execution Effectively</h3>
                <p className="text-slate-400 leading-relaxed">
                  Executing tests and tracking their results is straightforward. Labnex allows you to mark and update test statuses. Future development will focus on features for assigning testers, creating dedicated test runs for specific builds or environments, and capturing detailed execution history for better analysis.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><ChartPieIcon className="w-6 h-6 mr-2"/>The Vision: Data-Driven Quality Insights</h3>
                <p className="text-slate-400 leading-relaxed">
                  Understanding your testing efforts is key to continuous improvement. While direct reporting tools are currently planned, the existing data (statuses, priorities) lays the groundwork. Our roadmap includes comprehensive reporting dashboards to visualize test coverage, pass/fail rates, and defect trends, helping you make informed decisions about your QA strategy.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-slate-300 mb-6">Ready to elevate your quality assurance with Labnex?</p>
              <button
                onClick={() => openModal('waitlist')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
              >
                Join the Waitlist
              </button>
              <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-cyan-400 hover:underline">We'd love to hear from you!</a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Or, <button onClick={() => navigate(-1)} className="text-cyan-400 hover:underline">explore other Labnex features</button>.
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Labnex is currently in early development; features and timelines are subject to change.</p>
        </footer>
      </div>
    </>
  );
};

export default TestCaseManagementFeaturePage; 