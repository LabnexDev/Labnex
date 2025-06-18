import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import GlobalBackground from '../../components/landing/GlobalBackground';
import { motion } from 'framer-motion';
import { CheckIcon, ShareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
// @ts-ignore
import html2canvas from 'html2canvas';
import Seo from '../../components/common/Seo';

const ThankYouPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [amount, setAmount] = useState<string | null>(null);
    const supporterCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Example: /donation/thank-you?amount=10.00&currency=USD
        const donationAmount = searchParams.get('amount');
        const currency = searchParams.get('currency') || 'USD';
        if (donationAmount) {
            setAmount(new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(donationAmount)));
        }
    }, [searchParams]);

    const handleDownloadImage = async () => {
        if (!supporterCardRef.current) return;

        try {
            const canvas = await html2canvas(supporterCardRef.current, {
                backgroundColor: null, // Use transparent background
                scale: 2, // Increase resolution for better quality
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'labnex-supporter-card.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Oops, something went wrong!", error);
        }
    };

    return (
        <>
            <Seo title="Thank You – Labnex" description="We appreciate your support for Labnex's development." canonical="https://www.labnex.dev/donation/thank-you" />
            <div className="min-h-screen bg-slate-950 text-white font-inter relative isolate overflow-hidden flex flex-col items-center justify-center p-4">
                <GlobalBackground />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="w-full max-w-2xl text-center bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 sm:p-12 shadow-2xl shadow-blue-500/10"
                >
                    {/* Animated Checkmark */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                        className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50"
                    >
                        <CheckIcon className="w-12 h-12 text-green-400" />
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-8">
                        Thank You for Your Support!
                    </h1>
                    <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700/80 rounded-lg">
                        <p className="text-sm text-slate-300">
                            Thank you for your payment. Your transaction has been completed, and a receipt for your purchase has been emailed to you. You may log into your PayPal account to view transaction details.
                        </p>
                    </div>
                    <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto">
                        Your generous contribution is directly fueling the development of Labnex. Because of you, we can build the future of testing automation faster.
                    </p>

                    {/* Supporter Card for Download */}
                    <div ref={supporterCardRef} className="my-10 p-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                         <h3 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Labnex Official Supporter</h3>
                         {amount && (
                            <p className="text-4xl font-bold text-white mt-2">{amount}</p>
                         )}
                         <p className="text-sm text-slate-300 mt-1">Every contribution makes a difference.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleDownloadImage}
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105"
                        >
                            <ShareIcon className="w-5 h-5" />
                            Download Supporter Card
                        </button>
                        <Link 
                            to="/roadmap" 
                            className="inline-flex items-center justify-center gap-2 bg-transparent text-slate-300 font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 border border-slate-600 hover:border-slate-500"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back to Roadmap
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ThankYouPage; 