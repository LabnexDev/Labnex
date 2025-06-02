import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Privacy Policy (Preview)</h1>
        
        <p className="text-slate-400 mb-6 text-sm text-center italic">
          This is a preliminary version of our Privacy Policy. Full details will be available upon our official launch.
        </p>

        <div className="space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">1. Introduction</h2>
            <p>
              Welcome to Labnex ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at labnexcontact@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">2. Information We Collect (Anticipated)</h2>
            <p>
              As we develop Labnex, we anticipate collecting information that you provide to us directly, such as when you create an account (e.g., name, email, password), join our waitlist (e.g., email), or otherwise communicate with us. We may also collect certain information automatically when you visit, use, or navigate the platform (e.g., IP address, browser type, operating system, usage data).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">3. How We Plan to Use Your Information</h2>
            <p>
              We anticipate using the information we collect or receive:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To send administrative information to you.</li>
              <li>To manage and respond to your inquiries.</li>
              <li>To send you marketing and promotional communications (with your consent).</li>
              <li>To improve our platform, services, marketing, and your experience.</li>
              <li>To enforce our terms, conditions, and policies.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">4. Sharing Your Information (Anticipated)</h2>
            <p>
              We do not anticipate selling your personal information. We may share information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work (e.g., email delivery, hosting services, customer service). We will require all third parties to respect the security of your personal data and to treat it in accordance with the law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">5. Your Privacy Rights (General)</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. We are committed to upholding these rights. Detailed procedures for exercising these rights will be provided in the final version of this policy.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">6. Data Security (Our Commitment)</h2>
            <p>
              We will implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">7. Policy Updates</h2>
            <p>
              This Privacy Policy is a living document and will be updated as Labnex evolves. We will notify you of any significant changes. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2 text-blue-300">8. Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may email us at labnexcontact@gmail.com.
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

export default PrivacyPolicy; 