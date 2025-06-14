import React from 'react';
import { Link } from 'react-router-dom';
import { LifebuoyIcon, ChatBubbleBottomCenterTextIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Support: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Labnex Support
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Version: 0.9.0 | Last Updated: June 14, 2025
        </p>

        <p className="text-center text-slate-300 mb-8">
          Welcome to Labnex Support. We're here to help you get the most out of our platform during this early access phase. Labnex is actively evolving—and so is our support system. Whether you're a developer, tester, or community contributor, we want to ensure your experience is as smooth and productive as possible.
        </p>

        <div className="space-y-8 text-slate-300">
          
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
              <LifebuoyIcon className="w-6 h-6" />
              How to Get Help
            </h2>
            <p className="mb-2">
              During the current development phase, the primary way to request support is via email. We are a small team, but we are committed to helping you.
            </p>
            <p className="text-lg font-mono bg-slate-800/50 p-3 rounded-md text-center">
              <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:text-purple-300 underline">
                labnexcontact@gmail.com
              </a>
            </p>
            <p className="text-sm text-slate-400 mt-3 text-center">
              We aim to respond to all inquiries within 48 hours.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">What to Include in Your Message</h2>
            <p>
              To help us resolve your issue quickly, please include the following when reaching out:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2 bg-slate-800/30 p-4 rounded-md">
              <li>A clear and descriptive title for your issue.</li>
              <li>A detailed description of the problem or your question.</li>
              <li>
                <strong>Steps to Reproduce:</strong> If you're reporting a bug, describe the exact steps that lead to the issue.
              </li>
              <li>Your Labnex account email (if registered).</li>
              <li>
                <strong>Context:</strong> Mention if you are using the Web UI, the `@labnex/cli` package, or the Discord Bot.
              </li>
              <li>Any relevant error messages, screenshots, or logs.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">What's Coming Soon</h2>
            <p>
              We're building a complete support ecosystem to launch alongside the platform. Here is what you can expect:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                <p className="font-semibold text-green-400">✅ Comprehensive FAQs</p>
                <p className="text-sm text-slate-400">Answering all common questions about features, billing, and usage.</p>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                <p className="font-semibold text-green-400">✅ User Guides & Tutorials</p>
                <p className="text-sm text-slate-400">Detailed walkthroughs for every part of the Labnex platform.</p>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                <p className="font-semibold text-yellow-400">🔄 Optional In-App Support Chat</p>
                <p className="text-sm text-slate-400">Directly contact support from within the web application (planned).</p>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                <p className="font-semibold text-yellow-400">🔄 Community Forum or Discord Board</p>
                <p className="text-sm text-slate-400">A space for peer-to-peer help and community-led support (under consideration).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300 flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              Feedback & Suggestions
            </h2>
            <p>
              Your feedback directly shapes Labnex. If you have feature requests, bug reports, or ideas on how we can improve, please don't hesitate to let us know at our primary contact email. Your insights are critical to our development process.
            </p>
          </section>

          <div className="text-center pt-6 border-t border-slate-700/50">
            <p className="text-slate-400">
              Thank you for being part of the Labnex community. Your support and feedback help us build a better, more reliable platform for everyone.
            </p>
            <Link to="/documentation" className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:underline">
              <BookOpenIcon className="w-5 h-5" />
              <span>Check out the Documentation</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support; 