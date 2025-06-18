import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { BookOpenIcon, PaperAirplaneIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { sendSupportRequest } from '../api/supportApi';
import { useAuth } from '../contexts/AuthContext';
import Seo from '../components/common/Seo';

const DiscordIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 127 96">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83h0 A107.68,107.68,0,0,0,48.89,6.83h0a72.33,72.33,0,0,0-3.36-6.83A105.15,105.15,0,0,0,19.23,8.09C2.8,22.72-2.37,49.05,1.21,75.22a99.94,99.94,0,0,0,28.23,20.71,77.72,77.72,0,0,0,11.39-7.85h0a66.18,66.18,0,0,1-5.6-11.55,77.53,77.53,0,0,0-8.58-4.17,98.6,98.6,0,0,1-1.33-14,10.69,10.69,0,0,1,.13-1.54h0s3.23-1.61,3.23-1.61a55.13,55.13,0,0,1,16.4,10.15,76,76,0,0,0,14.08,5.4,76.58,76.58,0,0,0,14.08-5.4,55.06,55.06,0,0,1,16.4-10.15s3.23,1.61,3.23,1.61h0a10.69,10.69,0,0,1,.13,1.54,98.6,98.6,0,0,1-1.33,14,77.53,77.53,0,0,0-8.58,4.17,66.18,66.18,0,0,1-5.6,11.55h0a77.72,77.72,0,0,0,11.39,7.85,99.94,99.94,0,0,0,28.23-20.71C129.28,49.05,124.1,22.72,107.7,8.07ZM42.45,65.69C36.65,65.69,32,60.6,32,54.16s4.65-11.53,10.45-11.53,10.45,5.13,10.32,11.53S48.25,65.69,42.45,65.69Zm42,0C78.65,65.69,74,60.6,74,54.16s4.65-11.53,10.45-11.53,10.45,5.13,10.32,11.53S90.25,65.69,84.45,65.69Z" />
    </svg>
);

const supportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Invalid email address.'),
  category: z.enum(['technical', 'billing', 'feedback', 'other'], {
    errorMap: () => ({ message: 'Please select a category.' }),
  }),
  subject: z.string().min(5, 'Subject must be at least 5 characters long.'),
  message: z.string().min(20, 'Message must be at least 20 characters long.'),
});

type SupportFormData = z.infer<typeof supportSchema>;

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I join the Labnex waitlist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click the Join Waitlist button on the landing page or in the header, then submit your email.'
      }
    },
    {
      '@type': 'Question',
      name: 'Where can I get real-time help?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Join our Discord community via the link on this page to chat with the team and other users.'
      }
    }
  ]
};

const Support: React.FC = () => {
    const { user } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<SupportFormData>({
        resolver: zodResolver(supportSchema),
        defaultValues: {
            name: '',
            email: '',
            category: undefined,
            subject: '',
            message: ''
        }
    });

    useEffect(() => {
        if (user) {
            setValue('name', user.name || '');
            setValue('email', user.email || '');
        }
    }, [user, setValue]);

    const onSubmit = async (data: SupportFormData) => {
        const toastId = toast.loading('Sending your message...');
        try {
            await sendSupportRequest(data);
            toast.success('Your message has been sent! We will get back to you shortly.', { id: toastId });
            reset();
            if (user) {
                setValue('name', user.name || '');
                setValue('email', user.email || '');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
            toast.error(errorMessage, { id: toastId });
        }
    };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter p-4 sm:p-8">
      <Seo title="Labnex Support" description="Get help, find answers, and contact the Labnex team." canonical="https://www.labnex.dev/support" extraJsonLd={faqSchema} image="https://www.labnex.dev/og-support.png" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Labnex Support Center
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                Welcome! We're here to help you get the most out of Labnex. Find answers, get in touch with our team, and join our community.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 sm:p-8 shadow-2xl">
                <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                    <PaperAirplaneIcon className="w-7 h-7 text-blue-400" />
                    Send a Message
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                {...register('name')}
                                className="w-full bg-slate-800/60 border-slate-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-700 disabled:cursor-not-allowed"
                                placeholder="Your Name"
                                disabled={!!user}
                            />
                            {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                {...register('email')}
                                className="w-full bg-slate-800/60 border-slate-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-700 disabled:cursor-not-allowed"
                                placeholder="your@email.com"
                                disabled={!!user}
                            />
                            {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                        <select
                            id="category"
                            {...register('category')}
                            className="w-full bg-slate-800/60 border-slate-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                            <option value="" disabled>Select a category...</option>
                            <option value="technical">Technical Issue</option>
                            <option value="billing">Billing & Subscription</option>
                            <option value="feedback">Feedback & Suggestions</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.category && <p className="text-red-400 text-sm mt-2">{errors.category.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                        <input
                            type="text"
                            id="subject"
                            {...register('subject')}
                            className="w-full bg-slate-800/60 border-slate-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., CLI connection issue"
                        />
                        {errors.subject && <p className="text-red-400 text-sm mt-2">{errors.subject.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                        <textarea
                            id="message"
                            rows={6}
                            {...register('message')}
                            className="w-full bg-slate-800/60 border-slate-700 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Please describe your issue in detail..."
                        />
                        {errors.message && <p className="text-red-400 text-sm mt-2">{errors.message.message}</p>}
                    </div>
                    <div>
                        <Button type="submit" className="w-full" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Request'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Right Column: Other Support Options */}
            <div className="space-y-8">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 shadow-xl">
                    <h3 className="font-semibold text-xl text-white flex items-center gap-3 mb-4">
                        <DiscordIcon />
                        Discord Community
                    </h3>
                    <p className="text-slate-400 text-sm mb-5">
                        For real-time help, to chat with the community, or to create a formal support ticket, join our Discord server. It's the fastest way to get a response.
                    </p>
                    <a 
                      href="https://discord.gg/p9r4hQzsTe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-300"
                    >
                      <span>Join the Discord</span>
                    </a>
                </div>

                 <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 shadow-xl">
                    <h3 className="font-semibold text-xl text-white flex items-center gap-3 mb-4">
                        <BookOpenIcon className="w-6 h-6 text-blue-400" />
                        Support Documentation
                    </h3>
                    <p className="text-slate-400 text-sm mb-5">
                        Browse our comprehensive guides and FAQs to find answers to common questions and learn how to use Labnex effectively.
                    </p>
                    <Link to="/documentation" className="inline-flex items-center justify-center gap-2 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold py-2.5 px-4 rounded-lg transition-colors duration-300 border border-blue-500/50">
                        <span>Read the Docs</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Support; 