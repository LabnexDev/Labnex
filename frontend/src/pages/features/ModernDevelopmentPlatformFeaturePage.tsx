import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import Seo from '../../components/common/Seo';

// Relevant icons for Modern Development Platform
import {
  CpuChipIcon,             // Main icon
  CubeIcon,                // For React/Vite (Frontend Stack)
  ServerIcon,              // For Node.js/Express (Backend Stack)
  ShieldCheckIcon,         // For TypeScript (Type Safety)
  CircleStackIcon,         // For MongoDB (Database)
  PaintBrushIcon,          // For Tailwind CSS (Styling)
  BeakerIcon,              // For Jest (Testing)
  CogIcon,                 // For Dev Workflow/DX
  KeyIcon,                 // For Authentication/Security
  RocketLaunchIcon,        // For Performance Optimization
  ArrowsPointingOutIcon,   // For Scalability
  CloudArrowUpIcon         // For CI/CD
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const ModernDevelopmentPlatformFeaturePage: React.FC = () => {
  const navigate = useNavigate();

  const benefits: BenefitDetail[] = [
    {
      icon: CubeIcon,
      title: "Reactive Frontend with React & Vite",
      description: "Leverages React for dynamic user interfaces and Vite for an incredibly fast development experience and optimized production builds. Ensures a modern, responsive, and performant web application.",
      status: 'current'
    },
    {
      icon: ServerIcon,
      title: "Robust Node.js & Express.js Backend",
      description: "Built on Node.js with the Express.js framework, providing a scalable, efficient, and event-driven server-side architecture capable of handling complex business logic and API requests.",
      status: 'current'
    },
    {
      icon: ShieldCheckIcon,
      title: "TypeScript End-to-End",
      description: "Utilizes TypeScript across both frontend and backend, enhancing code quality, maintainability, and developer productivity through static typing and modern JavaScript features.",
      status: 'current'
    },
    {
      icon: CircleStackIcon,
      title: "Flexible NoSQL Database with MongoDB",
      description: "Employs MongoDB (via Mongoose ODM) for flexible, scalable, and high-performance NoSQL data storage, suitable for diverse and evolving application data requirements.",
      status: 'current'
    },
    {
      icon: PaintBrushIcon,
      title: "Utility-First Styling with Tailwind CSS",
      description: "Frontend styling is powered by Tailwind CSS, enabling rapid UI development with a utility-first approach for creating consistent, custom-designed interfaces without leaving your HTML.",
      status: 'current'
    },
    {
      icon: BeakerIcon,
      title: "Comprehensive Testing Framework",
      description: "Integrates Jest for robust unit and integration testing on both frontend and backend, ensuring code reliability, catching regressions, and facilitating safer refactoring.",
      status: 'current'
    },
    {
      icon: CogIcon,
      title: "Efficient Developer Workflow",
      description: "Enhanced with ESLint for code consistency, Prettier for automated formatting, and fast build tools, providing a streamlined and productive development experience.",
      status: 'current'
    },
    {
      icon: KeyIcon,
      title: "Secure Authentication & APIs",
      description: "Implements JWT-based authentication for secure user access and well-structured RESTful APIs, ensuring data integrity and controlled access to platform resources.",
      status: 'current'
    },
    {
      icon: RocketLaunchIcon,
      title: "Performance Optimization Focus",
      description: "Ongoing efforts to fine-tune both frontend and backend performance, including optimized database queries, efficient state management, and code splitting to ensure a fast and responsive user experience.",
      status: 'beta'
    },
    {
      icon: ArrowsPointingOutIcon,
      title: "Scalable & Maintainable Architecture",
      description: "Designed with scalability in mind, allowing the platform to grow and handle increasing loads. Focus on clean code practices and modular design for long-term maintainability.",
      status: 'beta'
    },
    {
      icon: CloudArrowUpIcon,
      title: "Advanced CI/CD Pipeline Integration",
      description: "Planning for deeper integration with CI/CD pipelines to automate build, testing, and deployment processes, enabling faster release cycles and improved operational efficiency.",
      status: 'planned'
    }
  ];

  const getStatusBadge = (status?: 'current' | 'beta' | 'planned') => {
    if (!status) return null;
    let bgColor, textColor, borderColor, text;
    switch (status) {
      case 'current':
        bgColor = 'bg-emerald-500/20'; textColor = 'text-emerald-300'; borderColor = 'border-emerald-500/40'; text = 'Core Component';
        break;
      case 'beta':
        bgColor = 'bg-blue-500/20'; textColor = 'text-blue-300'; borderColor = 'border-blue-500/40'; text = 'In Beta / Ongoing';
        break;
      case 'planned':
        bgColor = 'bg-amber-500/20'; textColor = 'text-amber-300'; borderColor = 'border-amber-500/40'; text = 'Planned Enhancement';
        break;
      default: return null;
    }
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>{text}</span>;
  };

  return (
    <>
      <Seo title="Modern Development Platform – Labnex" description="Learn how Labnex offers a unified, modern platform for software development lifecycle." canonical="https://www.labnex.dev/features/modern-development-platform" />
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
              <div className="inline-block p-4 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl mb-6 border border-white/10">
                <CpuChipIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                Modern Development Platform
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Labnex is built from the ground up using a robust stack of modern technologies, ensuring a scalable, maintainable, and high-performance experience for all users and developers.
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
                      <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-white/10 flex-shrink-0">
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
              <h2 className="text-2xl font-semibold text-white mb-6">Engineered for Excellence</h2>
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center">
                <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
                  <CubeIcon className="w-10 h-10 text-indigo-400" title="React/Vite"/>
                  <ServerIcon className="w-10 h-10 text-purple-400" title="Node.js/Express"/>
                  <ShieldCheckIcon className="w-10 h-10 text-indigo-300" title="TypeScript"/>
                  <CircleStackIcon className="w-10 h-10 text-purple-300" title="MongoDB"/>
                  <PaintBrushIcon className="w-10 h-10 text-indigo-400" title="TailwindCSS"/>
                </div>
                <p className="text-slate-400 text-lg italic max-w-2xl mx-auto">
                  Our choice of technologies reflects our commitment to building a reliable, fast, and future-proof platform. We prioritize developer experience and robust architecture to deliver value consistently.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold text-indigo-300 mb-3 flex items-center"><RocketLaunchIcon className="w-6 h-6 mr-2"/>Continuous Improvement</h3>
                <p className="text-slate-400 leading-relaxed">
                  The Labnex platform is not static. We are continuously working on performance enhancements, exploring new architectural patterns for better scalability, and refining our development practices. Our goal is to always leverage the best of modern technology to serve our users.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-purple-300 mb-3 flex items-center"><ArrowsPointingOutIcon className="w-6 h-6 mr-2"/>Built for Growth</h3>
                <p className="text-slate-400 leading-relaxed">
                  From database design to API structure and frontend component architecture, Labnex is built to scale. We anticipate future growth and are laying the groundwork for more advanced features, integrations, and a larger user base without compromising on stability or speed.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><CloudArrowUpIcon className="w-6 h-6 mr-2"/>Embracing Automation</h3>
                <p className="text-slate-400 leading-relaxed">
                  While comprehensive testing and linting are already in place, we are moving towards more sophisticated CI/CD automation. This will allow for faster, more reliable deployments, ensuring that new features and improvements reach you quickly and safely.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-slate-300 mb-6">Interested in the technical foundation of Labnex?</p>
              <button
                onClick={() => navigate('/features/tech-stack')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
              >
                Learn More About Our Stack
              </button>
              <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-indigo-400 hover:underline">We'd love to hear from you!</a>
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Or, <button onClick={() => navigate(-1)} className="text-indigo-400 hover:underline">explore other Labnex features</button>.
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Platform architecture and features are subject to ongoing development.</p>
        </footer>
      </div>
    </>
  );
};

export default ModernDevelopmentPlatformFeaturePage; 