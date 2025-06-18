import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import OrbBackground from '../../components/visual/OrbBackground';
import {
  CubeIcon, ServerIcon, ShieldCheckIcon, CircleStackIcon, 
  PaintBrushIcon, BoltIcon, CommandLineIcon, BeakerIcon, CodeBracketIcon
} from '@heroicons/react/24/outline';
import Seo from '../../components/common/Seo';

interface TechItem {
  icon: React.ElementType;
  name: string;
  category: string;
  description: string;
}

const TechStackFeaturePage: React.FC = () => {
  const navigate = useNavigate();

  const techStack: TechItem[] = [
    {
      icon: CubeIcon,
      name: 'React',
      category: 'Frontend Library',
      description: 'A JavaScript library for building dynamic and responsive user interfaces with a component-based architecture.'
    },
    {
      icon: BoltIcon,
      name: 'Vite',
      category: 'Frontend Tooling',
      description: 'A modern frontend build tool that provides an extremely fast development server and optimized production builds.'
    },
    {
      icon: ServerIcon,
      name: 'Node.js',
      category: 'Backend Runtime',
      description: 'A JavaScript runtime built on Chrome\'s V8 engine, enabling scalable and efficient server-side applications.'
    },
    {
      icon: CommandLineIcon,
      name: 'Express.js',
      category: 'Backend Framework',
      description: 'A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.'
    },
    {
      icon: ShieldCheckIcon,
      name: 'TypeScript',
      category: 'Language',
      description: 'A superset of JavaScript that adds static typing, improving code quality, maintainability, and developer productivity across the stack.'
    },
    {
      icon: CircleStackIcon,
      name: 'MongoDB',
      category: 'Database',
      description: 'A NoSQL document database that offers flexibility, scalability, and high performance, managed via Mongoose ODM for structured data modeling.'
    },
    {
      icon: PaintBrushIcon,
      name: 'Tailwind CSS',
      category: 'CSS Framework',
      description: 'A utility-first CSS framework for rapidly building custom user interfaces without writing traditional CSS.'
    },
    {
      icon: BeakerIcon,
      name: 'Jest',
      category: 'Testing Framework',
      description: 'A delightful JavaScript testing framework with a focus on simplicity, used for both frontend and backend testing.'
    },
    {
      icon: CodeBracketIcon,
      name: 'ESLint & Prettier',
      category: 'Code Quality',
      description: 'Tools for maintaining code consistency and style. ESLint analyzes code for potential errors, and Prettier automatically formats code.'
    }
  ];

  return (
    <>
      <Seo title="Labnex Tech Stack" description="Dive into the modern, scalable technology stack powering Labnex." canonical="https://www.labnex.dev/features/tech-stack" />
      <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate">
        <GlobalBackground />
        <OrbBackground />

        <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <button
              onClick={() => navigate(-1)} // Navigate to previous page (Modern Development Platform page)
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-150"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
          </div>
        </header>

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-slate-900/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 sm:p-10">
            <div className="text-center mb-12">
              <div className="inline-block p-4 bg-gradient-to-r from-gray-500/30 to-slate-500/30 rounded-xl mb-6 border border-white/10">
                <ShieldCheckIcon className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-slate-400 mb-4">
                Our Technology Stack
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Labnex is built with a curated selection of modern, robust, and scalable technologies to deliver a high-quality platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mb-12">
              {techStack.map((tech, index) => (
                <div 
                  key={index} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-lg border border-white/10 flex-shrink-0">
                      <tech.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{tech.name}</h3>
                  </div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{tech.category}</p>
                  <p className="text-slate-400 text-sm leading-relaxed flex-grow">{tech.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={() => navigate('/features/modern-development-platform')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-md"
              >
                Back to Modern Development Platform Feature
              </button>
               <p className="text-slate-400 mt-6">
                Have feedback or suggestions? <a href="mailto:labnexcontact@gmail.com" className="text-indigo-400 hover:underline">We'd love to hear from you!</a>
              </p>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
          <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Our tech stack is continuously evaluated and may evolve.</p>
        </footer>
      </div>
    </>
  );
};

export default TechStackFeaturePage; 