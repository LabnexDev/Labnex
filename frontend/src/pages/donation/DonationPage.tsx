import React from 'react';
import Seo from '../../components/common/Seo';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

const DonationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-4 sm:p-8 flex flex-col items-center">
      <Seo title="Support Labnex" description="Help fund Labnex development by making a donation." canonical="https://www.labnex.dev/donation" image="https://www.labnex.dev/og-support.png" />
      <div className="max-w-3xl w-full space-y-10">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">Support Labnex</h1>
          <p className="text-lg text-slate-400">Labnex is fully community-funded. Your donation helps cover hosting, domain, and new feature development.</p>
        </header>

        {/* PayPal Donation Button */}
        <section className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 shadow-2xl flex flex-col items-center gap-6">
          <h2 className="text-2xl font-semibold text-center mb-2">Make a Donation</h2>
          <p className="text-slate-400 text-sm text-center max-w-md">Secure payments processed by PayPal. You can donate any amount; every dollar accelerates development.</p>

          {/* PayPal donate button form */}
          <form action="https://www.paypal.com/donate" method="post" target="_blank">
            <input type="hidden" name="hosted_button_id" value="LABNEXPAYPALID" />
            <Button type="submit" variant="primary" className="px-8 py-3 text-lg">Donate with PayPal</Button>
          </form>

          <p className="text-xs text-slate-500 text-center">You'll be redirected to PayPal to complete your donation.</p>
        </section>

        <section className="text-center text-slate-400 text-sm space-y-2">
          <p>Want to learn more about how donations are used? Read our <Link to="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</Link> and <Link to="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</Link>.</p>
          <p>After donating you'll be redirected to a thank-you page and receive a confirmation email from PayPal for your records.</p>
        </section>
      </div>
    </div>
  );
};

export default DonationPage; 