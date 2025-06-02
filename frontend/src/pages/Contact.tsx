import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Contact Us (Preview)</h1>
        
        <p className="text-slate-400 mb-6 text-sm text-center italic">
          We'd love to hear from you! Whether you have questions, feedback, or partnership inquiries, here's how to reach us during our preview phase. <br />More comprehensive contact options will be available post-launch.
        </p>

        <div className="space-y-8 text-slate-300 bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 sm:p-8 shadow-xl">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">General Inquiries & Feedback</h2>
            <p className="mb-2">
              For any general questions about Labnex, to provide feedback on your experience, or to report any issues, please email us. We value your input as we continue to develop and refine our platform.
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:text-purple-300 underline">labnexcontact@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Support Requests</h2>
            <p className="mb-2">
              If you need technical assistance or help with using Labnex, please refer to our Support section or email us directly. For details on what to include in your support request, please see the Support page.
            </p>
            <p>
              <strong>Support Email:</strong> <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:text-purple-300 underline">labnexcontact@gmail.com</a>
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Partnership & Media Inquiries</h2>
            <p>
              Interested in partnering with Labnex, or have media-related questions? We're open to collaborations and discussions. Please reach out to our team via email.
            </p>
             <p>
              <strong>Partnerships/Media Email:</strong> <a href="mailto:labnexcontact@gmail.com" className="text-purple-400 hover:text-purple-300 underline">labnexcontact@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">Stay Connected (Future)</h2>
            <p>
              While we finalize our platform, our primary contact is email. We plan to launch official social media channels and a community Discord server closer to our public release. Stay tuned for updates!
            </p>
          </section>
        </div>
        
        <p className="text-slate-500 mt-10 text-xs text-center">
          We appreciate your interest in Labnex and look forward to connecting with you.
        </p>
      </div>
    </div>
  );
};

export default Contact; 