import React, { useState, useEffect } from 'react';
import { XMarkIcon, HandRaisedIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface MobileVoiceTutorialProps {
  onDismiss: () => void;
}

const MobileVoiceTutorial: React.FC<MobileVoiceTutorialProps> = ({ onDismiss }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tutorialSteps = [
    {
      icon: HandRaisedIcon,
      title: "Welcome to Voice Mode",
      description: "Here are some mobile gestures to enhance your experience",
      gesture: "Tap anywhere to continue"
    },
    {
      icon: HandRaisedIcon,
      title: "Tap the Orb",
      description: "Single tap to start/pause voice recognition",
      gesture: "Try tapping the purple orb"
    },
    {
      icon: ArrowUpIcon,
      title: "Swipe Up",
      description: "Swipe up to show activity timeline and AI status",
      gesture: "Swipe up from the center"
    },
    {
      icon: ArrowDownIcon,
      title: "Swipe Down",
      description: "Swipe down to hide the mobile panel",
      gesture: "Swipe down to dismiss"
    }
  ];

  useEffect(() => {
    // Show tutorial after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleNext}
    >
      <div 
        className={`bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full border border-slate-700/50 shadow-2xl transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30">
              <Icon className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            {step.description}
          </p>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <p className="text-sm text-purple-300 font-medium">
              💡 {step.gesture}
            </p>
          </div>
        </div>

        {/* Progress & Navigation */}
        <div className="mt-6 space-y-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-purple-500 w-6'
                    : index < currentStep
                    ? 'bg-purple-600/50'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors ml-auto"
            >
              {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Got it!'}
            </button>
          </div>

          {/* Skip option */}
          <div className="text-center">
            <button
              onClick={handleDismiss}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileVoiceTutorial; 