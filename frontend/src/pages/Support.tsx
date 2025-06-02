import React from 'react';

const Support: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Support (Preview)</h1>
        
        <p className="text-slate-400 mb-6 text-sm text-center italic">
          Welcome to Labnex Support. We're here to help you get the most out of our platform. <br />Full support resources, including FAQs and detailed guides, will be available upon official launch.
        </p>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">How to Get Help</h2>
            <p className="mb-2">
              During this preview phase, the primary way to get support is by contacting our team directly via email. We aim to respond to all inquiries as quickly as possible.
            </p>
            <p>
              <strong>Support Email:</strong> <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:text-purple-300 underline">labnexcontact@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">What to Include in Your Request</h2>
            <p>
              To help us assist you more effectively, please include the following information in your support request:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>A clear description of the issue or question.</li>
              <li>Steps you've already taken to try to resolve the issue (if applicable).</li>
              <li>Your Labnex account email (if you have one).</li>
              <li>Any relevant error messages or screenshots.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Upcoming Support Features</h2>
            <p>
              We are actively working on expanding our support resources. Soon, you can expect:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>A comprehensive FAQ section.</li>
              <li>Detailed user guides and tutorials.</li>
              <li>(Potentially) A community forum for peer-to-peer assistance.</li>
              <li>(Potentially) In-app support chat options.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Feedback</h2>
            <p>
              Your feedback is invaluable to us, especially during this development phase. If you have suggestions for improving Labnex or our support system, please don't hesitate to share them via our contact email.
            </p>
          </section>
        </div>
        
        <p className="text-slate-500 mt-10 text-xs text-center">
          Support channels will be fully operational at launch. Thank you for your understanding.
        </p>
      </div>
    </div>
  );
};

export default Support; 