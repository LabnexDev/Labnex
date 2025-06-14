import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Labnex Terms of Service
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Version: 0.9.0 | Effective Date: June 14, 2025
        </p>

        <p className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-4 text-slate-300 mb-8 text-sm italic">
          <strong>Note:</strong> Labnex is currently in active development. These Terms may be updated as features evolve. Material changes will be communicated through our website or Discord.
        </p>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") govern your access to and use of the Labnex platform, including our website, tools, Discord server, and related services ("Service"). By accessing or using the Service, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree with these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">2. Account Registration (Coming Soon)</h2>
            <p>
              Certain features of the Service may require you to register for an account. When this feature becomes available, you agree to provide accurate, current, and complete information during the registration process. You are responsible for safeguarding your password and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">3. Use of the Service</h2>
            <p>You agree not to misuse the Service or help anyone else to do so. You must not, and must not attempt to, do the following things:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Violate any applicable laws or regulations.</li>
              <li>Engage in abusive, harmful, fraudulent, or deceptive conduct.</li>
              <li>Distribute spam, unauthorized advertising, or chain letters.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with them.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service, its infrastructure, or its users.</li>
              <li>Probe, scan, or test the vulnerability of any system or network.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">4. Privacy and Data Collection</h2>
            <p>
              We are committed to protecting your privacy. Our collection and use of personal information, such as your email address, is governed by our{' '}
              <Link to="/privacy-policy" className="text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              . By using the Service, you agree to the collection and use of information in accordance with our Privacy Policy.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">5. Donations</h2>
            <p>
              Labnex is a community-supported project and accepts optional donations to support its development and operational costs. All donations are voluntary and non-refundable. Donations do not grant you any special access to features, services, or governance rights. We are transparent about our community funding goals, and all contributions support the public roadmap of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">6. Intellectual Property</h2>
            <p>
              All content, designs, and code provided by Labnex (excluding user-submitted content) are the property of Labnex and its licensors. You are granted a limited license to access and use the Service. You may not reproduce, modify, distribute, or create derivative works from Labnex materials without our express prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">7. AI-Powered Features</h2>
            <p>
              Labnex includes experimental AI-powered tools for suggestions, tagging, automation, and other purposes. These features are provided "as-is" and may produce inaccurate, incomplete, or unexpected results. You should not rely on these features as a sole source of truth or definitive advice. Labnex is not liable for any errors or omissions generated by the AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">8. User-Submitted Content</h2>
            <p>
              By submitting content to the Service (e.g., bug reports, test cases, feedback, suggestions), you grant Labnex a worldwide, non-exclusive, royalty-free, perpetual, and irrevocable license to use, reproduce, modify, adapt, publish, and distribute that content for the purpose of improving and promoting the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">9. Limitation of Liability</h2>
            <p>
              The Service is provided on an "as-is" and "as-available" basis without any warranties of any kind. To the fullest extent permitted by law, Labnex and its contributors, directors, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">10. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. We will notify you of any material changes by posting the new Terms on our website, notifying you through the Service, or via our official Discord server. Your continued use of Labnex after such changes constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">11. Contact</h2>
            <p>
              If you have any questions or concerns about these Terms, please do not hesitate to reach out to us at:{' '}
              <a href="mailto:labnexcontact@gmail.com" className="text-blue-400 hover:underline">
                labnexcontact@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 