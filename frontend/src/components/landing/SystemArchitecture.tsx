import React, { useState } from 'react';
import SectionWrapper from './SectionWrapper';

interface ArchitectureNode {
  id: string;
  label: string;
  type: 'frontend' | 'api' | 'database' | 'service' | 'external' | 'hosting';
  position: { x: number; y: number };
  status: 'active' | 'processing' | 'idle';
  description: string;
  technologies: string[];
}

const SystemArchitecture: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes: ArchitectureNode[] = [
    {
      id: 'github-pages',
      label: 'GitHub Pages',
      type: 'hosting',
      position: { x: 20, y: 15 },
      status: 'active',
      description: 'Static site hosting on GitHub Pages with automatic deployments from main branch',
      technologies: ['GitHub Actions', 'Static Hosting', 'Custom Domain', 'SSL/TLS']
    },
    {
      id: 'react-frontend',
      label: 'React Frontend',
      type: 'frontend',
      position: { x: 50, y: 15 },
      status: 'active',
      description: 'Modern React application with TypeScript, hosted on GitHub Pages with automated CI/CD deployment',
      technologies: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Query']
    },
    {
      id: 'render-hosting',
      label: 'Render Platform',
      type: 'hosting',
      position: { x: 80, y: 45 },
      status: 'active',
      description: 'Cloud hosting platform for backend services with automatic deployments and scaling',
      technologies: ['Render Cloud', 'Auto-deploy', 'Environment Variables', 'SSL/TLS']
    },
    {
      id: 'express-api',
      label: 'Express API',
      type: 'api',
      position: { x: 50, y: 45 },
      status: 'processing',
      description: 'RESTful API built with Node.js and Express, hosted on Render with automatic deployments',
      technologies: ['Node.js', 'Express.js', 'TypeScript', 'JWT Auth', 'bcryptjs']
    },
    {
      id: 'mongodb-atlas',
      label: 'MongoDB Atlas',
      type: 'database',
      position: { x: 25, y: 75 },
      status: 'active',
      description: 'Cloud-hosted MongoDB database with global clusters, automated backups, and monitoring',
      technologies: ['MongoDB Atlas', 'Mongoose ODM', 'Cloud Clusters', 'Auto-scaling']
    },
    {
      id: 'discord-bot',
      label: 'Discord Bot',
      type: 'service',
      position: { x: 75, y: 75 },
      status: 'active',
      description: 'AI-powered Discord bot for project management, deployed alongside the main API on Render',
      technologies: ['Discord.js v14', 'OpenAI API', 'Natural Language Processing']
    },
    {
      id: 'openai-service',
      label: 'OpenAI Integration',
      type: 'external',
      position: { x: 50, y: 90 },
      status: 'active',
      description: 'AI capabilities powered by OpenAI for intelligent assistance and automation',
      technologies: ['OpenAI API', 'GPT Models', 'AI Completion']
    }
  ];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'frontend':
        return '💻';
      case 'api':
        return '⚙️';
      case 'database':
        return '🗄️';
      case 'service':
        return '🤖';
      case 'external':
        return '🧠';
      case 'hosting':
        return '☁️';
      default:
        return '📦';
    }
  };

  const getNodeColor = (type: string, status: string) => {
    const baseColors = {
      frontend: 'from-purple-500/20 to-purple-600/20 border-purple-500/40',
      api: 'from-blue-500/20 to-blue-600/20 border-blue-500/40',
      database: 'from-green-500/20 to-green-600/20 border-green-500/40',
      service: 'from-orange-500/20 to-orange-600/20 border-orange-500/40',
      external: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/40',
      hosting: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40'
    };

    const statusGlow = status === 'processing' ? 'shadow-lg shadow-blue-500/25' : 
                      status === 'active' ? 'shadow-md shadow-emerald-500/20' : '';

    return `${baseColors[type as keyof typeof baseColors]} ${statusGlow}`;
  };

  return (
    <SectionWrapper 
      badge="System Architecture"
      title={
        <>
          Production-Ready{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Cloud Architecture
          </span>
        </>
      }
      subtitle="Built with modern technologies and deployed on reliable cloud platforms for scalability, security, and high availability."
      backgroundType="gradient"
    >
      {/* Architecture Diagram */}
      <div className="relative w-full max-w-5xl mx-auto">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="500" className="text-slate-600">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-[500px] pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          
          {/* GitHub Pages to Frontend */}
          <line x1="20%" y1="15%" x2="50%" y2="15%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
          
          {/* Frontend to API */}
          <line x1="50%" y1="15%" x2="50%" y2="45%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
          
          {/* API to Render Hosting */}
          <line x1="50%" y1="45%" x2="80%" y2="45%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
          
          {/* API to MongoDB */}
          <line x1="50%" y1="45%" x2="25%" y2="75%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
          
          {/* API to Discord Bot */}
          <line x1="50%" y1="45%" x2="75%" y2="75%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
          
          {/* Discord Bot to OpenAI */}
          <line x1="75%" y1="75%" x2="50%" y2="90%" 
                stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
        </svg>

        {/* Nodes */}
        <div className="relative h-[500px]">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${node.position.x}%`,
                top: `${node.position.y}%`
              }}
              onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
            >
              {/* Node */}
              <div className={`relative bg-gradient-to-br ${getNodeColor(node.type, node.status)} backdrop-blur-md border rounded-xl p-4 transition-all duration-300 hover:scale-110 min-w-40`}>
                {/* Status Indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                
                {/* Icon and Label */}
                <div className="text-center">
                  <div className="text-3xl mb-2">{getNodeIcon(node.type)}</div>
                  <div className="text-white font-semibold text-sm leading-tight">
                    {node.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Node Details Panel */}
        {activeNode && (
          <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            {(() => {
              const node = nodes.find(n => n.id === activeNode);
              if (!node) return null;
              
              return (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{getNodeIcon(node.type)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{node.label}</h3>
                      <p className="text-slate-400 text-sm capitalize">{node.type} • {node.status}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 mb-4 leading-relaxed">{node.description}</p>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Technologies Used:</h4>
                    <div className="flex flex-wrap gap-2">
                      {node.technologies.map((tech, index) => (
                        <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 border border-white/20">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Key Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        {[
          {
            icon: '☁️',
            title: 'Cloud Hosting',
            description: 'GitHub Pages for frontend, Render for backend - reliable, scalable cloud infrastructure'
          },
          {
            icon: '🚀',
            title: 'Auto Deployment',
            description: 'Continuous deployment from Git with automatic builds and zero-downtime updates'
          },
          {
            icon: '🔒',
            title: 'Enterprise Security',
            description: 'SSL/TLS encryption, secure environment variables, and JWT authentication'
          },
          {
            icon: '📊',
            title: 'Global CDN',
            description: 'Fast content delivery worldwide with edge caching and performance optimization'
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors duration-300">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Technical Stack Details */}
      <div className="mt-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Production Deployment Stack</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-purple-400 mb-4">Frontend Deployment</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• React 18 with TypeScript</li>
              <li>• Vite production builds</li>
              <li>• GitHub Pages hosting</li>
              <li>• GitHub Actions CI/CD</li>
              <li>• Custom domain support</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-4">Backend Deployment</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Node.js + Express.js</li>
              <li>• Render cloud hosting</li>
              <li>• Auto-deploy from Git</li>
              <li>• Environment variables</li>
              <li>• Health monitoring</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-green-400 mb-4">Data & Services</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• MongoDB Atlas clusters</li>
              <li>• OpenAI API integration</li>
              <li>• Discord bot deployment</li>
              <li>• SSL/TLS encryption</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Enterprise-grade cloud architecture designed for scalability, security, and high availability.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default SystemArchitecture; 