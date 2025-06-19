import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ComponentType<{ className: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
  title?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  autoProgress?: boolean;
  className?: string;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
  title = "Welcome to Labnex",
  showProgress = true,
  allowSkip = true,
  autoProgress = false,
  className = ""
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEffect(() => {
    // Show tutorial after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle element highlighting
    if (steps[currentStep]?.targetElement) {
      const element = document.querySelector(steps[currentStep].targetElement!);
      if (element) {
        setHighlightedElement(element);
        element.classList.add('tutorial-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
        setHighlightedElement(null);
      }
    };
  }, [currentStep, steps, highlightedElement]);

  // Auto-progress after delay if enabled
  useEffect(() => {
    if (autoProgress && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 5000); // 5 seconds per step
      return () => clearTimeout(timer);
    }
  }, [autoProgress, currentStep, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (highlightedElement) {
      highlightedElement.classList.remove('tutorial-highlight');
    }
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (highlightedElement) {
      highlightedElement.classList.remove('tutorial-highlight');
    }
    setTimeout(onSkip, 300);
  };

  const step = steps[currentStep];
  const Icon = step?.icon || SparklesIcon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Tutorial Styles */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 9999;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.4), 0 0 20px rgba(147, 51, 234, 0.3) !important;
          border-radius: 8px;
          animation: tutorialPulse 2s infinite;
        }
        
        @keyframes tutorialPulse {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.4), 0 0 20px rgba(147, 51, 234, 0.3);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(147, 51, 234, 0.6), 0 0 30px rgba(147, 51, 234, 0.5);
          }
        }
        
        .tutorial-backdrop {
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%);
        }
      `}</style>

      {/* Tutorial Overlay */}
      <div 
        className={`fixed inset-0 tutorial-backdrop backdrop-blur-sm z-[9998] flex items-center justify-center p-4 transition-all duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div 
          className={`bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-700/50 shadow-2xl transition-all duration-500 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30">
                <Icon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 id="tutorial-title" className="text-lg font-semibold text-white">
                  {title}
                </h2>
                {showProgress && (
                  <p className="text-sm text-slate-400">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                )}
              </div>
            </div>
            {allowSkip && (
              <button
                onClick={handleSkip}
                className="p-1 rounded-full hover:bg-slate-800 transition-colors"
                aria-label="Skip tutorial"
              >
                <XMarkIcon className="h-5 w-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="mb-6">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-semibold text-white">
              {step?.title}
            </h3>
            
            <p className="text-slate-300 leading-relaxed">
              {step?.description}
            </p>

            {step?.content && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                {step.content}
              </div>
            )}

            {step?.action && (
              <button
                onClick={step.action.onClick}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                {step.action.label}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Progress dots */}
              {showProgress && (
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-purple-500 w-6'
                          : index < currentStep
                          ? 'bg-purple-600/70'
                          : 'bg-slate-600'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  aria-label="Previous step"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                aria-label={isLastStep ? "Complete tutorial" : "Next step"}
              >
                {isLastStep ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip option */}
          {allowSkip && (
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OnboardingTutorial; 