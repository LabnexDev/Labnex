import React, { useState } from 'react';
import { useModal, type ModalPayload } from '../../contexts/ModalContext';
import { addWaitlistEntry } from '../../api/statsApi';
import { Button } from './Button';

// Page components for InfoModal
import PrivacyPolicyPage from '../../pages/PrivacyPolicy';
import TermsOfServicePage from '../../pages/TermsOfService';
import SupportPage from '../../pages/Support';
import ContactPage from '../../pages/Contact';

// Waitlist Modal Content with Form Logic
const WaitlistModalContent: React.FC<{ closeModal: () => void; payload: ModalPayload | null }> = ({ closeModal }) => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Reset error message on new submission

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setIsEmailValid(false);
      return;
    }
    
    setIsEmailValid(true);
    console.log('[WaitlistModal] Attempting to submit waitlist email:', email);
    try {
      await addWaitlistEntry(email);
      setIsSubmitted(true);
      console.log('[WaitlistModal] Email Submitted Successfully:', email);
    } catch (error: any) {
      console.error('[WaitlistModal] Error submitting waitlist email:', error);
      if (error.response?.status === 409) {
        setErrorMessage('This email address is already on our waitlist!');
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      setIsEmailValid(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-4">Join the Labnex Waitlist</h2>
      <p className="text-slate-400 mb-6">Be the first to experience Labnex. Enter your email to get early access.</p>
      {!isSubmitted ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!isEmailValid) setIsEmailValid(true); // Reset validation on change
              }}
              placeholder="Enter your email"
              className={`w-full px-4 py-2 bg-slate-800/80 border ${isEmailValid ? 'border-slate-700' : 'border-red-500'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              aria-label="Email for waitlist"
              required
            />
            {errorMessage && <p className="text-red-400 text-sm mt-1">{errorMessage}</p>}
          </div>
          <Button type="submit" variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300">
            Join Waitlist
          </Button>
        </form>
      ) : (
        <div className="text-center py-4">
          <p className="text-emerald-400 font-medium mb-4">Thanks for joining! We'll notify you soon.</p>
          <Button onClick={closeModal} variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-300">
            Got it
          </Button>
        </div>
      )}
    </>
  );
};

const ComingSoonModalContent: React.FC<{ closeModal: () => void; payload: ModalPayload | null }> = ({ closeModal, payload }) => {
  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-4">{payload?.featureName || 'Feature'} - Coming Soon</h2>
      <p className="text-slate-400 mb-6">We are still in development, and this feature is not yet available. Join our waitlist to be notified when it's ready!</p>
      <Button onClick={closeModal} variant="primary" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300">
        Got it
      </Button>
    </>
  );
};

const InfoModalContent: React.FC<{ closeModal: () => void; payload: ModalPayload | null }> = ({ payload }) => {
  const pageType = payload?.infoPageType;
  let ContentComponent: React.ElementType | null = null;

  switch (pageType) {
    case 'privacy':
      ContentComponent = PrivacyPolicyPage;
      break;
    case 'terms':
      ContentComponent = TermsOfServicePage;
      break;
    case 'support':
      ContentComponent = SupportPage;
      break;
    case 'contact':
      ContentComponent = ContactPage;
      break;
    default:
      // Fallback for unknown type or if no specific page component is needed
      return (
        <>
          <h2 className="text-2xl font-bold text-white mb-4">Details</h2>
          <p className="text-slate-400">The requested information is not available.</p>
        </>
      );
  }

  // The actual page components (PrivacyPolicyPage, etc.) are expected to provide their own full layout including titles and scrolling.
  // So, InfoModalContent will mostly be a wrapper that selects the right page. The global close button will still be active.
  return (
    <div className="w-full h-full">
        {ContentComponent && <ContentComponent />}
    </div>
  );
};

const GlobalModalRenderer: React.FC = () => {
  const { modalType, modalPayload, closeModal } = useModal();

  if (!modalType) {
    return null;
  }

  // Determine modal size based on type
  let modalMaxWidth = 'max-w-md'; // Default for waitlist, comingSoon
  if (modalType === 'info') {
    modalMaxWidth = 'max-w-3xl'; // Larger for info pages
  }
  
  let modalPadding = 'p-6 sm:p-8';
  if (modalType === 'info') {
    modalPadding = 'p-0'; // Info pages will have their own padding
  }


  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 p-4"
      onClick={closeModal} 
    >
      <div 
        className={`relative bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transform transition-transform duration-300 scale-100 ${modalMaxWidth} w-full max-h-[90vh] ${modalType === 'info' ? 'flex flex-col' : ''} ${modalPadding}`}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Common Close Button - always visible for all modals */}
        <button 
          onClick={closeModal} 
          className={`absolute top-3 right-3 text-slate-400 hover:text-white transition-colors z-20 p-2 rounded-full hover:bg-white/10 ${modalType === 'info' ? 'bg-slate-800/50' : ''}`}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Conditional rendering of modal content based on type */} 
        {/* For Info Modal, the content itself is scrollable if needed, within its own component design */} 
        <div className={`${modalType === 'info' ? 'overflow-y-auto w-full h-full rounded-xl' : ''}`}>
            {modalType === 'waitlist' && <WaitlistModalContent closeModal={closeModal} payload={modalPayload} />}
            {modalType === 'comingSoon' && <ComingSoonModalContent closeModal={closeModal} payload={modalPayload} />}
            {modalType === 'info' && <InfoModalContent closeModal={closeModal} payload={modalPayload} />}
        </div>
      </div>
    </div>
  );
};

export default GlobalModalRenderer; 