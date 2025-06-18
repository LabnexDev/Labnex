import React from 'react';
import Seo from '../components/common/Seo';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <Seo title="Labnex Privacy Policy" description="Understand how Labnex collects, uses, and protects your data." canonical="https://www.labnex.dev/privacy-policy" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Labnex Privacy Policy
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Version: 0.9.0 | Last Updated: June 14, 2025
        </p>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">1. Introduction</h2>
            <p>
              Welcome to Labnex ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it. If you have any questions or concerns about this policy, please contact us at{' '}
              <a href="mailto:labnexcontact@gmail.com" className="text-blue-400 hover:underline">
                labnexcontact@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us, as well as some information automatically.</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
              <li>
                <strong>Information You Provide:</strong> We collect personal information you provide when you register for an account (e.g., name, email address, password), join our waitlist (email address), submit feedback, contact us for support, or make a donation.
              </li>
              <li>
                <strong>Information from Donations:</strong> When you make a donation, we use a third-party payment processor (e.g., Stripe, PayPal). We do not store your full credit card information, but we may receive information like your name, email, and donation amount from the processor for record-keeping.
              </li>
              <li>
                <strong>Automatically Collected Information:</strong> When you navigate our Service, we may collect certain information automatically, such as your IP address, browser and device characteristics, operating system, and usage data (e.g., pages visited, features used).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">3. How We Use Your Information</h2>
            <p>We use the information we collect for various business purposes, including to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Facilitate account creation and management.</li>
              <li>Process and record your donations.</li>
              <li>Send you administrative information, including updates to our terms and policies.</li>
              <li>Respond to your inquiries and offer support.</li>
              <li>Send you marketing and promotional communications (if you have opted in).</li>
              <li>Improve our platform, services, marketing, and overall user experience.</li>
              <li>Enforce our Terms of Service and other policies to ensure a safe environment.</li>
              <li>Analyze usage trends to improve the Service.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">4. How We Share Your Information</h2>
            <p>
              We do not sell your personal information. We may share your information with trusted third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services. We require these third parties to maintain the confidentiality and security of your data and to use it only in accordance with our instructions and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">5. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, update, or delete your data. We are committed to upholding these rights. To exercise your rights, please contact us. We will provide more detailed procedures as our account management features are finalized.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">6. Data Security</h2>
            <p>
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">7. Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time as Labnex evolves. The updated version will be indicated by a revised "Last Updated" date. We will notify you of any significant changes and encourage you to review this policy frequently to stay informed about how we are protecting your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-blue-300">8. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, you may email us at{' '}
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

export default PrivacyPolicy; 