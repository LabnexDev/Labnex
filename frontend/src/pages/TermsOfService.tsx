import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Terms of Service (Preview)</h1>
        
        <p className="text-slate-400 mb-6 text-sm text-center italic">
          This is a preliminary version of our Terms of Service. Full terms will be available upon our official launch.
        </p>

        <div className="space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Labnex platform and services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service. These Terms apply to all visitors, users, and others who wish to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">2. Account Registration (Anticipated)</h2>
            <p>
              To access certain features of the Service, you may be required to register for an account. When you register for an account, you agree to provide accurate, current, and complete information. You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">3. Use of the Service</h2>
            <p>
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate Labnex, a Labnex employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm Labnex or users of the Service or expose them to liability.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">4. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Labnex and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Labnex.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">5. Termination (Anticipated)</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including but not limited to a breach of the Terms. If you wish to terminate your account, you may simply discontinue using the Service (detailed procedures for account deletion will be provided closer to launch).
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">6. Limitation of Liability (General Statement)</h2>
            <p>
              In no event shall Labnex, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service. (Specifics will be detailed in the final version).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">7. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at labnexcontact@gmail.com.
            </p>
          </section>
        </div>
        
        <p className="text-slate-500 mt-10 text-xs text-center">
          Last Updated: {new Date().toLocaleDateString()} (Preliminary Version)
        </p>
      </div>
    </div>
  );
};

export default TermsOfService; 