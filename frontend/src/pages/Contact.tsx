import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';
import { EnvelopeIcon, LifebuoyIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Contact: React.FC = () => {
  return (
    <>
      <Seo 
        title="Contact Labnex" 
        description="Reach out to the Labnex team for support, partnerships, or general inquiries." 
        canonical="https://www.labnex.dev/contact" 
      />
      <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Contact Us
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">
            Version: 0.9.0 | Last Updated: June 14, 2025
          </p>
          <p className="text-center text-slate-300 mb-8 max-w-3xl mx-auto">
            We'd love to hear from you. Whether you have questions, feedback, or partnership inquiries, we're here to connect. Labnex is still in its early stages, so your input is invaluable.
          </p>

          <div className="space-y-8 text-slate-300">

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 sm:p-8 shadow-xl grid md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
                    <EnvelopeIcon className="w-6 h-6" />
                    General Inquiries & Feedback
                  </h2>
                  <p className="text-sm text-slate-400">
                    Have a question, a feature suggestion, or want to share your experience? We value all input as it helps shape the future of Labnex.
                  </p>
                  <a href="mailto:labnexcontact@gmail.com" className="mt-3 inline-block font-mono text-purple-400 hover:text-purple-300 underline break-all">
                    labnexcontact@gmail.com
                  </a>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6" />
                    Partnerships & Media
                  </h2>
                  <p className="text-sm text-slate-400">
                    Interested in collaborating with Labnex or have a media opportunity to discuss? We welcome early-stage partnerships and outreach.
                  </p>
                  <a href="mailto:labnexcontact@gmail.com" className="mt-3 inline-block font-mono text-purple-400 hover:text-purple-300 underline break-all">
                    labnexcontact@gmail.com
                  </a>
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-slate-800/50 p-6 rounded-lg border border-slate-600">
                  <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
                    <LifebuoyIcon className="w-6 h-6" />
                    Technical Support
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">
                    For bug reports, usability questions, or assistance with our tools, please see our dedicated support page first for detailed instructions.
                  </p>
                  <Link to="/support" className="inline-flex items-center gap-2 text-blue-400 hover:underline font-semibold">
                    <span>View Support Page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </section>

                <section className="bg-slate-800/50 p-6 rounded-lg border border-slate-600">
                  <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
                    <UserGroupIcon className="w-6 h-6" />
                    Join Our Community
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">
                    The best way to stay connected, ask questions, and chat with the team is by joining our official Discord server.
                  </p>
                  <a 
                    href="https://discord.gg/p9r4hQzsTe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                  >
                    <span>Join the Discord</span>
                  </a>
                </section>
              </div>
            </div>
            
            <div className="text-center pt-6">
              <p className="text-slate-400">
                Thank you for your interest in Labnex. We look forward to hearing from you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact; 