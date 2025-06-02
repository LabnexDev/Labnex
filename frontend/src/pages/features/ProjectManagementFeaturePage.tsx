import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground'; // Assuming similar background
import OrbBackground from '../../components/visual/OrbBackground'; // Assuming similar background

// Relevant icons for Project Management
import {
  FolderOpenIcon,
  ListBulletIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon, // More specific for task management
  UserGroupIcon, // More specific for collaboration
  PresentationChartLineIcon, // For visual progress
  CalendarDaysIcon // For deadlines/milestones
} from '@heroicons/react/24/outline';

interface BenefitDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: 'current' | 'beta' | 'planned';
}

const ProjectManagementFeaturePage: React.FC = () => {
  const navigate = useNavigate();

  const benefits: BenefitDetail[] = [
    {
      icon: FolderOpenIcon,
      title: "Centralized Project Hub",
      description: "Create, organize, and access all your software projects from a single dashboard. Labnex supports project ownership, team membership, and provides an overview of key project details.",
      status: 'current'
    },
    {
      icon: ClipboardDocumentListIcon, // Changed icon
      title: "Structured Task Management",
      description: "Break down projects into manageable tasks with titles, descriptions, priorities, and statuses. Assign tasks to team members and track them with unique reference IDs. Due dates are supported; sub-task functionality is planned.",
      status: 'beta'
    },
    {
      icon: PresentationChartLineIcon, // Changed icon
      title: "Visual Progress Monitoring",
      description: "Task statuses (To Do, In Progress, Done, etc.) are tracked, laying the groundwork for visual progress tools. Planned features include Kanban boards and progress charts to identify bottlenecks.",
      status: 'planned'
    },
    {
      icon: UserGroupIcon, // Changed icon
      title: "Team Collaboration Features",
      description: "Facilitate teamwork through project membership and task assignments with notifications. Future enhancements include in-app commenting and file sharing capabilities.",
      status: 'beta'
    },
    {
      icon: CalendarDaysIcon, // Changed icon
      title: "Deadline and Milestone Tracking",
      description: "Manage project timelines by setting due dates for individual tasks. Comprehensive milestone tracking and management features are planned for future development.",
      status: 'planned'
    },
    {
      icon: CheckCircleIcon,
      title: "Streamlined Workflows & Templates",
      description: "Labnex aims to support common development workflows. Future plans include customizable project templates to standardize processes and enhance efficiency across projects.",
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
    <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate">
      <GlobalBackground />
      <OrbBackground />

      {/* Sticky Back Button Header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button
            onClick={() => navigate(-1)} // Go back to the previous page (LandingPage)
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-150"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Features
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-slate-900/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 sm:p-10">
          {/* Feature Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-xl mb-6 border border-white/10">
              <FolderOpenIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
              Project Management in Labnex
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Labnex provides an integrated suite of tools to create, organize, track, and deliver your software projects efficiently. We are actively developing these features based on community feedback and modern best practices.
            </p>
          </div>

          {/* Detailed Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-white/10 flex-shrink-0">
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

          {/* Conceptual Image/Diagram Placeholder */}
          <div className="my-16 text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">Visualizing Your Workflow</h2>
            <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-8 min-h-[250px] flex flex-col items-center justify-center">
              <LightBulbIcon className="w-16 h-16 text-purple-400 mb-4" />
              <p className="text-slate-400 text-lg italic">
                Our goal is to offer clear visual tools like Kanban boards and progress dashboards. While task statuses are currently tracked, these visual components are actively being designed and developed.
              </p>
               <p className="text-xs text-slate-500 mt-2">(Visual mockups/previews coming soon)</p>
            </div>
          </div>

          {/* Deeper Dive Sections */}
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-semibold text-purple-300 mb-3 flex items-center"><WrenchScrewdriverIcon className="w-6 h-6 mr-2"/>Foundation for Organization</h3>
              <p className="text-slate-400 leading-relaxed">
                Labnex facilitates starting new projects, defining their scope via descriptions, and structuring work through tasks. Core capabilities like project creation, member management, and task tracking (title, description, status, priority, assignee, due dates) are available. We are focused on making this process intuitive and robust.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-blue-300 mb-3 flex items-center"><UserGroupIcon className="w-6 h-6 mr-2"/>Building for Teamwork</h3>
              <p className="text-slate-400 leading-relaxed">
                Effective project management hinges on clear communication. Labnex allows adding team members to projects and assigning them tasks, with notifications for assignments. Future development includes richer collaboration tools like in-app commenting and file attachments.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-emerald-300 mb-3 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2"/>The Path to Integration & Efficiency</h3>
              <p className="text-slate-400 leading-relaxed">
                Our vision for Labnex includes robust integration capabilities and efficiency enhancers. While core project and task management tools are our current focus, we plan to explore integrations with popular version control systems, communication platforms, and introduce features like project templates in the future.
              </p>
            </div>
          </div>

          {/* Call to Action / Next Steps */}
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-300 mb-6">Help shape the future of project management in Labnex!</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openWaitlistModal'))}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-lg"
            >
              Join the Waitlist & Share Feedback
            </button>
            <p className="text-sm text-slate-500 mt-4">
              Or, <button onClick={() => navigate(-1)} className="text-purple-400 hover:underline">explore other upcoming features</button>.
            </p>
          </div>
        </div>
      </main>

      {/* Simplified Footer for Feature Page */}
      <footer className="relative z-10 text-center p-8 text-slate-400 border-t border-white/10 bg-slate-950/70 backdrop-blur-sm mt-12">
        <p className="text-sm">© {new Date().getFullYear()} Labnex. All rights reserved. Labnex is currently in early development; features and timelines are subject to change.</p>
      </footer>
    </div>
  );
};

export default ProjectManagementFeaturePage; 