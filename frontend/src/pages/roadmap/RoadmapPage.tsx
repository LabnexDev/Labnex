import React, { useState } from 'react';
import { CheckCircleIcon, CubeTransparentIcon, BeakerIcon, LightBulbIcon, ChevronDownIcon, ArrowLeftIcon, HeartIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import GlobalBackground from '../../components/landing/GlobalBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';

interface RoadmapItem {
  status: 'implemented' | 'beta' | 'planned';
  title: string;
  description: string;
  details: string;
  progress?: number;
}

interface CommunityGoal {
    amount: number | string;
    title: string;
    description: string;
    unlocked: boolean;
    icon: React.ElementType;
}

const roadmapData: Record<string, RoadmapItem[]> = {
  platform: [
    { status: 'implemented', title: 'Project Creation & Management', description: 'Full CRUD for projects and members.', details: 'Core functionality for creating, updating, and deleting projects, along with inviting and managing team members with different roles.' },
    { status: 'implemented', title: 'Test Case Management', description: 'Create and track test cases.', details: 'A comprehensive module to define test cases with preconditions, steps, expected results, and status tracking.' },
    { status: 'beta', title: 'Security Enhancements', description: 'Implementing advanced security measures.', details: 'Improving platform security with features like 2FA, audit logging, and enhanced session management. Foundational security is complete.', progress: 50 },
    { status: 'beta', title: 'UI/UX Updates', description: 'Refining the interface for a premium feel.', details: 'Ongoing effort to elevate the platform\'s visual design to match or exceed the look of the marketing pages, focusing on animations, gradients, and a more sophisticated user experience.', progress: 50 },
    { status: 'beta', title: 'Task Creation & Boards', description: 'Integrated task management system.', details: 'A Kanban-style board for creating, assigning, and tracking tasks throughout the project lifecycle. Drag-and-drop functionality is in progress.', progress: 75 },
    { status: 'planned', title: 'Advanced Test Run Analysis', description: 'Visualize test run history and metrics.', details: 'Features to analyze test execution history, identify flaky tests, and track performance metrics to find bottlenecks.' },
    { status: 'planned', title: 'Real-time Collaboration', description: 'Live editing and notifications.', details: 'Enable teams to collaborate in real-time with features like live cursors, shared editing sessions for test cases, and instant notifications.' },
  ],
  cli: [
    { status: 'implemented', title: 'Local Test Execution', description: 'Run browser tests from your terminal.', details: 'The CLI can orchestrate and execute automated browser tests on a local machine, providing immediate feedback to developers.' },
    { status: 'beta', title: 'UI/UX Updates', description: 'Improving the CLI output for clarity.', details: 'Enhancing the command-line interface to provide richer, more intuitive outputs, including tables, progress bars, and better formatting to match the project\'s visual goals.', progress: 30 },
    { status: 'beta', title: 'AI Integration & Command Structure', description: 'Integrating AI across the CLI.', details: 'The command structure for AI features like generation, optimization, and analysis is in place. The focus is now on refining the underlying AI models.', progress: 90 },
    { status: 'beta', title: 'AI-Powered Test Generation', description: 'Generate test structures with AI.', details: 'Use AI to analyze feature descriptions and automatically generate boilerplate for test cases and suggest element selectors. Model refinement is ongoing.', progress: 85 },
    { status: 'planned', title: 'Plugin System', description: 'Extend CLI functionality.', details: 'An extensible architecture allowing developers to create and share plugins for custom reporting, third-party integrations, and more.' },
    { status: 'planned', title: 'Deeper IDE Integration', description: 'Run and debug tests in your IDE.', details: 'A dedicated VS Code extension to run, debug, and get AI-powered feedback on tests without leaving the editor.' },
  ],
  ai: [
    { status: 'implemented', title: 'Account Linking & Basic Queries', description: 'Link accounts, perform lookups.', details: 'Securely connect Discord and Labnex accounts. Use simple bot commands to fetch project or test case information.' },
    { status: 'beta', title: 'AI-Assisted Note & Snippet Management', description: 'Manage notes and snippets via Discord.', details: 'Interact with the Labnex AI bot to create, retrieve, and manage project-specific notes and code snippets directly from Discord. NLU improvements are in progress.', progress: 90 },
    { status: 'planned', title: 'Proactive AI Assistance', description: 'Get smart suggestions in Discord.', details: 'The AI will monitor project activity and provide proactive help, such as offering to analyze a series of failed tests.' },
    { status: 'planned', title: 'Self-Healing Tests', description: 'AI-powered test maintenance.', details: 'Leverage AI to detect when tests fail due to element selector changes and automatically suggest or apply corrections.' },
  ]
};

const communityGoals: CommunityGoal[] = [
    { amount: 50, title: "Domain & 24/7 Bot Hosting", description: "Secured labnex.dev and enabled continuous backend operation for the Discord AI.", unlocked: true, icon: CheckCircleIcon },
    { amount: 100, title: "Community Feature Spotlight", description: "We'll build a requested feature, like a sponsorship page or a public feature request board.", unlocked: false, icon: SparklesIcon },
    { amount: 150, title: "Interactive Task Boards", description: "Implement full drag-and-drop functionality on the Kanban-style task boards.", unlocked: false, icon: SparklesIcon },
    { amount: 200, title: "Accelerate Real-time Collaboration", description: "Begin development on live cursors and collaborative editing for test cases.", unlocked: false, icon: SparklesIcon },
    { amount: 250, title: "Initial CLI Plugin System", description: "Lay the groundwork for a plugin system to extend CLI capabilities.", unlocked: false, icon: SparklesIcon },
    { amount: '300+', title: "Community-Driven Development", description: "At this level, our development priorities will be directly influenced by community votes on major new features.", unlocked: false, icon: UserGroupIcon },
];

const statusConfig = {
  implemented: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    glowColor: 'hover:shadow-[0_0_15px_rgba(74,222,128,0.5)]',
    label: 'Implemented',
  },
  beta: {
    icon: BeakerIcon,
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    glowColor: 'hover:shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    label: 'In Beta',
  },
  planned: {
    icon: LightBulbIcon,
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    glowColor: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    label: 'Planned',
  },
};

const categoryConfig = {
  platform: { title: 'Labnex Platform', icon: CubeTransparentIcon },
  cli: { title: 'CLI & Automation', icon: CubeTransparentIcon },
  ai: { title: 'Discord AI Bot', icon: CubeTransparentIcon },
};

const RoadmapItemCard: React.FC<{ item: RoadmapItem }> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[item.status];

  return (
    <motion.div
      layout
      className={`bg-slate-800/50 backdrop-blur-sm border ${config.borderColor} rounded-lg mb-4 overflow-hidden transition-all duration-300 ${config.glowColor}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5 cursor-pointer flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <config.icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">{item.title}</h4>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            {config.label}
          </span>
          <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="px-5 pb-5"
          >
            <div className={`border-t ${config.borderColor} pt-4 ml-14`}>
              <p className="text-slate-300 mb-4">{item.details}</p>
              {item.status === 'beta' && item.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-yellow-400">Progress</span>
                    <span className="text-xs font-medium text-yellow-400">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RoadmapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate overflow-hidden">
      <GlobalBackground />
      <Seo title="Labnex Development Roadmap" description="Explore the upcoming features and milestones planned for Labnex." canonical="https://www.labnex.dev/roadmap" breadcrumbs={[{name:'Home',url:'https://www.labnex.dev/'},{name:'Roadmap',url:'https://www.labnex.dev/roadmap'}]} image="https://www.labnex.dev/og-roadmap.png" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="absolute top-8 left-4 sm:left-6 lg:left-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors py-2 px-4 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg backdrop-blur-sm">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Home</span>
            </Link>
        </div>
        <div className="text-center mb-20 pt-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            Labnex Development <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Roadmap</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
            Our vision for the future of testing and project automation. Click on any item to see more details.
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-4 hidden h-full w-px bg-slate-700/50 md:block" aria-hidden="true" />

          {Object.entries(categoryConfig).map(([key, { title, icon: Icon }]) => (
            <div className="mb-16 relative md:pl-12" key={key}>
              {/* Icon node on the timeline */}
              <div className="absolute left-0 top-0 hidden md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-8 ring-slate-950">
                   <Icon className="h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8 md:ml-0">
                 {/* On mobile, show the icon next to the title */}
                <Icon className="h-8 w-8 text-blue-400 md:hidden" />
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {title}
                </h3>
              </div>
              <div className="md:ml-0">
                {roadmapData[key].map((item, index) => (
                  <RoadmapItemCard item={item} key={index} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Community Support & Funding Section */}
        <div className="mt-24 pt-16 border-t border-slate-700/50">
            <div className="text-center mb-12">
                 <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-4 inline-flex items-center gap-3">
                    <HeartIcon className="w-8 h-8"/>
                    Community Support & Funding
                </h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                    Labnex is a passion project. With your support, we can accelerate development and keep the platform growing.
                </p>
            </div>

            <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
                {/* 
                    NOTE FOR DEVELOPER: 
                    The `currentFunding` value is currently hardcoded. Update as donations come in.
                */}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;