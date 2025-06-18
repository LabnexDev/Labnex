import React from 'react';
import { changelogData } from '../data/changelog';
import './ChangelogPage.css';
import { TagIcon, ArrowUpCircleIcon, WrenchScrewdriverIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Seo from '../components/common/Seo';

const typeDetails = {
  feature: {
    icon: SparklesIcon,
    label: 'Feature',
    className: 'bg-blue-100 text-blue-800',
    iconColor: 'text-blue-500',
  },
  fix: {
    icon: WrenchScrewdriverIcon,
    label: 'Fix',
    className: 'bg-red-100 text-red-800',
    iconColor: 'text-red-500',
  },
  improvement: {
    icon: ArrowUpCircleIcon,
    label: 'Improvement',
    className: 'bg-green-100 text-green-800',
    iconColor: 'text-green-500',
  },
  refactor: {
    icon: TagIcon,
    label: 'Refactor',
    className: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-500',
  },
};

const ChangelogPage: React.FC = () => {
  return (
    <>
      <Seo title="Labnex Changelog" description="See what's new and improved in Labnex with our latest feature releases, fixes, and enhancements." canonical="https://www.labnex.dev/changelog" />
      <div className="changelog-page bg-slate-950 text-white min-h-screen font-inter">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              What's New at Labnex
            </h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              We're constantly improving Labnex. Here's a timeline of our latest updates and features.
            </p>
          </div>

          <div className="timeline-container">
            {[...changelogData]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((release, index) => (
                <div key={release.version} className={`timeline-item ${index % 2 === 0 ? 'timeline-left' : 'timeline-right'}`}>
                  <div className="timeline-content shadow-2xl">
                    {/* Version and Date */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 text-sm font-semibold text-blue-300 bg-blue-900/50 rounded-full border border-blue-800">
                        v{release.version}
                      </span>
                      <time className="text-sm text-slate-400">{new Date(release.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </div>

                    {/* Title and Description */}
                    <h2 className="text-2xl font-bold text-white mb-2">{release.title}</h2>
                    <p className="text-slate-400 mb-6">{release.description}</p>

                    {/* Changes List */}
                    <ul className="space-y-4">
                      {release.changes.map((change, idx) => {
                        const { icon: Icon, label, className, iconColor } = typeDetails[change.type];
                        return (
                          <li key={idx} className="flex items-start">
                            <span className={`flex-shrink-0 mr-3 mt-1 flex items-center justify-center h-5 w-5 rounded-full ${className}`}>
                              <Icon className={`h-3 w-3 ${iconColor}`} />
                            </span>
                            <div>
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${className}`}>
                                {label}
                              </span>
                              <p className="text-slate-300 mt-1">{change.details}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangelogPage; 