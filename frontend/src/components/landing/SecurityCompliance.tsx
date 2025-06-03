import React, { useState } from 'react';
import SectionWrapper from './SectionWrapper';
import { useModal } from '../../contexts/ModalContext';

interface SecurityFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'implemented' | 'active' | 'configured';
  details: string[];
  category: 'authentication' | 'authorization' | 'validation' | 'api';
}

const SecurityCompliance: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const { openModal } = useModal();

  const securityFeatures: SecurityFeature[] = [
    {
      id: 'jwt',
      title: 'JWT Authentication',
      description: 'Secure token-based authentication with password hashing',
      category: 'authentication',
      status: 'implemented',
      details: [
        'JWT tokens for secure session management',
        'bcryptjs password hashing with salt rounds',
        'Bearer token authorization for API requests',
        'Automatic token validation on protected routes'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'rbac',
      title: 'Role-Based Access Control',
      description: 'Multi-tier permission system for team collaboration',
      category: 'authorization',
      status: 'active',
      details: [
        'Four role levels: PROJECT_OWNER, TEST_MANAGER, TESTER, VIEWER',
        'Granular permissions for project and test case management',
        'Team member invitation and role assignment',
        'Middleware-enforced permission checking'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'validation',
      title: 'Input Validation',
      description: 'Comprehensive data validation and sanitization',
      category: 'validation',
      status: 'implemented',
      details: [
        'Mongoose schema validation for all data operations',
        'Email format validation and uniqueness constraints',
        'Password strength requirements and confirmation',
        'Request body parsing and validation middleware'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'cors',
      title: 'API Security',
      description: 'Secure API configuration and error handling',
      category: 'api',
      status: 'configured',
      details: [
        'CORS configuration with allowed origins and methods',
        'Credential support for secure cross-origin requests',
        'Comprehensive error handling and logging',
        'Environment-based configuration management'
      ],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication':
        return 'from-blue-500/20 to-blue-600/20 border-blue-500/40 text-blue-400';
      case 'authorization':
        return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-400';
      case 'validation':
        return 'from-purple-500/20 to-purple-600/20 border-purple-500/40 text-purple-400';
      case 'api':
        return 'from-orange-500/20 to-orange-600/20 border-orange-500/40 text-orange-400';
      default:
        return 'from-slate-500/20 to-slate-600/20 border-slate-500/40 text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-emerald-500';
      case 'active':
        return 'bg-blue-500';
      case 'configured':
        return 'bg-orange-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <SectionWrapper 
      badge="Security & Best Practices"
      title={
        <>
          Built with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            security in mind
          </span>
        </>
      }
      subtitle="Implementing industry-standard security practices and modern authentication patterns to protect your data and ensure safe collaboration."
      backgroundType="darker"
    >
      {/* Security Overview */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Security Status</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              We've implemented core security measures following modern development best practices. 
              As we grow, we'll continue enhancing our security posture.
            </p>
          </div>

          {/* Security Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
              </div>
              <div className="text-white font-semibold">Authentication Active</div>
              <div className="text-slate-400 text-sm">JWT + bcryptjs hashing</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-white font-semibold">RBAC Enabled</div>
              <div className="text-slate-400 text-sm">4-tier permission system</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-white font-semibold">Input Validation</div>
              <div className="text-slate-400 text-sm">Schema-based validation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {securityFeatures.map((feature) => (
          <div
            key={feature.id}
            className={`group cursor-pointer bg-gradient-to-br ${getCategoryColor(feature.category)} backdrop-blur-md border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl`}
            onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(feature.category)} rounded-xl flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(feature.status)}`} />
            </div>

            {activeFeature === feature.id && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-white font-semibold mb-3">Implementation Details:</h4>
                <ul className="space-y-2">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-300 text-sm">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Security Best Practices */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Security Best Practices
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: '🔐',
              title: 'Secure Authentication',
              description: 'JWT tokens with secure password hashing',
              status: 'Implemented'
            },
            {
              icon: '🛡️',
              title: 'Access Control',
              description: 'Role-based permissions for team security',
              status: 'Active'
            },
            {
              icon: '✅',
              title: 'Data Validation',
              description: 'Input sanitization and schema validation',
              status: 'Configured'
            },
            {
              icon: '🔄',
              title: 'Regular Updates',
              description: 'Dependencies updated for security patches',
              status: 'Ongoing'
            }
          ].map((practice, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors duration-300"
            >
              <div className="text-4xl mb-4">{practice.icon}</div>
              <h4 className="text-lg font-bold text-white mb-2">{practice.title}</h4>
              <p className="text-slate-400 text-sm mb-3">{practice.description}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                {practice.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Security Roadmap */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Security Roadmap
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-emerald-400 mb-4">✅ Current</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• JWT authentication</li>
              <li>• Password hashing (bcryptjs)</li>
              <li>• Role-based access control</li>
              <li>• Input validation & sanitization</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-4">🚧 Next Phase</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Two-factor authentication (2FA)</li>
              <li>• Enhanced session management</li>
              <li>• Audit logging</li>
              <li>• Rate limiting</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-purple-400 mb-4">🎯 Future</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• SSO integration</li>
              <li>• Advanced threat detection</li>
              <li>• Compliance frameworks</li>
              <li>• Security certifications</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            As Labnex grows, we're committed to continuously enhancing our security measures 
            and working toward industry certifications and compliance standards.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            Questions about security?
          </h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            We're transparent about our security practices and happy to discuss our approach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => openModal('info', { infoPageType: 'contact' })}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              Contact Us
            </button>
            <button 
              onClick={() => openModal('info', { infoPageType: 'support' })}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-slate-200 hover:bg-white/15 hover:text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default SecurityCompliance; 