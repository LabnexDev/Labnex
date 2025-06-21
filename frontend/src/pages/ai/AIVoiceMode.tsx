import { useState, useEffect, useRef, useCallback } from 'react';
import { MicrophoneIcon, ArrowLeftIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import { useVoiceSettings } from '../../contexts/VoiceSettingsContext';
import { useCurrentProjectId } from '../../hooks/useCurrentProjectId';
import { aiChatApi } from '../../api/aiChat';
import { createMultiTurnVoiceProcessor, type MultiTurnVoiceProcessor } from '../../utils/multiTurnVoiceHandler';
import MobileVoiceGestures from '../../components/ai-chat/MobileVoiceGestures';
import { useVoicePerformance } from '../../utils/voicePerformanceMonitor';
import './AIVoiceMode.css';

// Types for enhanced state management
type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'processing' | 'error';
type ErrorType = 'network' | 'microphone' | 'speech' | 'permission' | 'unknown';

interface ErrorState {
  hasError: boolean;
  type: ErrorType;
  message: string;
  retryable: boolean;
}

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'input' | 'processing' | 'response' | 'error';
  message: string;
  duration?: number;
}

export default function AIVoiceMode() {
  const navigate = useNavigate();
  const currentProjectId = useCurrentProjectId();
  
  // Core state
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [microphonePaused, setMicrophonePaused] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [isMultiTurnMode, setIsMultiTurnMode] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  
  // Enhanced error handling
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    type: 'unknown',
    message: '',
    retryable: true
  });
  
  // Activity tracking
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  
  // Performance and accessibility
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const processingStartTime = useRef<number>(0);
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  // Multi-turn voice processor
  const multiTurnProcessor = useRef<MultiTurnVoiceProcessor | null>(null);
  
  const { voiceOutput, setVoiceOutput } = useVoiceSettings();
  
  // Performance monitoring
  const {
    trackSpeechRecognition,
    trackTTSPerformance,
    trackCommandProcessing,
    trackNetworkLatency,
    shouldUseLowPowerMode: performanceShouldUseLowPowerMode,
    logPerformanceIssue
  } = useVoicePerformance();

  // Stable particle positions with performance-optimized count (initialized after performance hook)
  const [particles] = useState(() => {
    // Use fallback for initial render, will be optimized by performance monitor
    const fallbackParticleCount = window.innerWidth < 768 ? 8 : 15;
    return Array.from({ length: fallbackParticleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 4,
    }));
  });

  // Add activity event helper
  const addActivityEvent = useCallback((type: ActivityEvent['type'], message: string, duration?: number) => {
    const event: ActivityEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      duration
    };
    
    setActivityEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
  }, []);

  // Error handling helper
  const handleError = useCallback((type: ErrorType, message: string, retryable = true) => {
    setErrorState({ hasError: true, type, message, retryable });
    setStatus('error');
    addActivityEvent('error', message);
    
    // Auto-clear non-critical errors after 5 seconds
    if (retryable) {
      setTimeout(() => {
        setErrorState(prev => ({ ...prev, hasError: false }));
        setStatus('idle');
      }, 5000);
    }
  }, [addActivityEvent]);



  // Detect low power mode using performance monitor
  useEffect(() => {
    const checkLowPowerMode = () => {
      const shouldUseLowPower = performanceShouldUseLowPowerMode();
      setIsLowPowerMode(shouldUseLowPower);
      
      if (shouldUseLowPower) {
        logPerformanceIssue('Device switched to low power mode', 'medium');
      }
    };

    checkLowPowerMode();
    const interval = setInterval(checkLowPowerMode, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [performanceShouldUseLowPowerMode, logPerformanceIssue]);

  // Ensure voice output is enabled
  useEffect(() => {
    if (!voiceOutput) setVoiceOutput(true);
  }, [voiceOutput, setVoiceOutput]);

  const { isListening, start: startVoice, stop: stopVoice } = useVoiceInput({
    enabled: true,
    onResult: async (text) => {
      // Prevent multiple simultaneous requests
      if (isProcessingRequest) {
        console.log('Already processing request, ignoring duplicate');
        return;
      }
      
      const speechStartTime = Date.now();
      processingStartTime.current = speechStartTime;
      setIsProcessingRequest(true);
      setMicrophonePaused(true);
      stopVoice();
      setTranscript(text);
      setStatus('processing');
      
      addActivityEvent('input', `"${text}"`);
      
      try {
        // Track speech recognition performance
        trackSpeechRecognition(speechStartTime, Date.now(), true);
        
        if (multiTurnProcessor.current) {
          const commandStartTime = Date.now();
          
          // Use multi-turn processor for voice commands
          const result = await multiTurnProcessor.current.processVoiceTranscript(text);
          
          const processingDuration = Date.now() - processingStartTime.current;
          trackCommandProcessing(commandStartTime, Date.now());
          
          if (result.needsInput) {
            // Multi-turn conversation active
            setIsMultiTurnMode(true);
            setCurrentPrompt(result.response);
            
            const ttsStartTime = Date.now();
            await speak(result.response);
            trackTTSPerformance(ttsStartTime, Date.now());
            
            addActivityEvent('processing', `Awaiting input: ${result.response}`, processingDuration);
          } else if (result.isComplete) {
            // Command completed or failed
            setIsMultiTurnMode(false);
            setCurrentPrompt('');
            
            const ttsStartTime = Date.now();
            await speak(result.response);
            trackTTSPerformance(ttsStartTime, Date.now());
            
            addActivityEvent('response', result.response, processingDuration);
            
            // Reset retry count on success
            retryCount.current = 0;
          } else {
            // Fallback to AI chat for unknown commands
            const networkStartTime = Date.now();
            const chatRes = await aiChatApi.sendMessage(text, { page: window.location.pathname });
            trackNetworkLatency(networkStartTime, Date.now());
            
            const ttsStartTime = Date.now();
            await speak(chatRes.reply);
            trackTTSPerformance(ttsStartTime, Date.now());
            
            addActivityEvent('response', chatRes.reply, processingDuration);
          }
        } else {
          // Fallback to AI chat if processor not initialized
          const networkStartTime = Date.now();
          const chatRes = await aiChatApi.sendMessage(text, { page: window.location.pathname });
          trackNetworkLatency(networkStartTime, Date.now());
          
          const ttsStartTime = Date.now();
          await speak(chatRes.reply);
          trackTTSPerformance(ttsStartTime, Date.now());
          
          const processingDuration = Date.now() - processingStartTime.current;
          addActivityEvent('response', chatRes.reply, processingDuration);
        }
      } catch (err) {
        console.error('Voice processing failed', err);
        const errorMessage = err instanceof Error ? err.message : "Sorry, I couldn't process that command.";
        
        // Track failed speech recognition
        trackSpeechRecognition(speechStartTime, Date.now(), false);
        
        // Determine error type for better user feedback
        let errorType: ErrorType = 'unknown';
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorType = 'network';
        } else if (errorMessage.includes('permission')) {
          errorType = 'permission';
        } else if (errorMessage.includes('speech')) {
          errorType = 'speech';
        }
        
        // Log performance issue
        logPerformanceIssue(`Voice processing error: ${errorMessage}`, 'high');
        
        handleError(errorType, errorMessage);
        
        const ttsStartTime = Date.now();
        await speak("Sorry, I encountered an error. Please try again.");
        trackTTSPerformance(ttsStartTime, Date.now());
        
        setIsMultiTurnMode(false);
        setCurrentPrompt('');
      } finally {
        setIsProcessingRequest(false);
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
      let errorType: ErrorType = 'microphone';
      if (error.includes('permission')) errorType = 'permission';
      else if (error.includes('network')) errorType = 'network';
      
      handleError(errorType, error);
    }
  });

  const { isSpeaking, speak } = useOpenAITTS();

  // Initialize multi-turn processor after TTS hook
  useEffect(() => {
    multiTurnProcessor.current = createMultiTurnVoiceProcessor({
      navigate,
      currentProjectId,
      speakFunction: speak,
    });
  }, [navigate, currentProjectId, speak]);

  // Update status based on voice states
  useEffect(() => {
    if (errorState.hasError) {
      setStatus('error');
    } else if (isSpeaking) {
      setStatus('speaking');
    } else if (isListening) {
      setStatus('listening');
    } else {
      setStatus('idle');
    }
  }, [isSpeaking, isListening, errorState.hasError]);

  // Comprehensive echo prevention system
  useEffect(() => {
    if (isSpeaking) {
      setMicrophonePaused(true);
      if (isListening) {
        stopVoice();
      }
    } else if (microphonePaused && !isSpeaking && !isProcessingRequest) {
      const resumeTimeout = setTimeout(() => {
        setMicrophonePaused(false);
        if (!isListening && status === 'idle' && !isProcessingRequest && !errorState.hasError) {
          startVoice();
        }
      }, 500);

      return () => clearTimeout(resumeTimeout);
    }
  }, [isSpeaking, microphonePaused, isListening, status, startVoice, stopVoice, isProcessingRequest, errorState.hasError]);

  // Prevent microphone from starting if we're paused
  useEffect(() => {
    if (microphonePaused && isListening) {
      stopVoice();
    }
  }, [microphonePaused, isListening, stopVoice]);

  // Start listening on mount (with error handling)
  useEffect(() => {
    if (!microphonePaused && !errorState.hasError) {
      startVoice();
    }
    return () => {
      stopVoice();
    };
  }, [startVoice, stopVoice, microphonePaused, errorState.hasError]);

  // Enhanced retry mechanism with voice initialization
  const handleRetryWithVoice = useCallback(() => {
    if (retryCount.current < maxRetries) {
      retryCount.current++;
      setErrorState(prev => ({ ...prev, hasError: false }));
      setStatus('idle');
      
      // Retry voice initialization for microphone/permission errors
      if (errorState.type === 'microphone' || errorState.type === 'permission') {
        startVoice();
      }
    }
  }, [errorState.type, startVoice]);

  // Handle orb click with error states
  const handleOrbClick = useCallback(() => {
    if (errorState.hasError && errorState.retryable) {
      handleRetryWithVoice();
      return;
    }
    
    if (microphonePaused || isProcessingRequest) {
      return;
    }
    
    if (status === 'listening') {
      stopVoice();
      addActivityEvent('input', 'Voice input stopped manually');
    } else if (status === 'idle') {
      startVoice();
      addActivityEvent('input', 'Voice input started manually');
    }
  }, [errorState, microphonePaused, isProcessingRequest, status, stopVoice, startVoice, handleRetryWithVoice, addActivityEvent]);

  // Mobile gesture handlers
  const handleSwipeUp = useCallback(() => {
    setShowMobilePanel(true);
  }, []);

  const handleSwipeDown = useCallback(() => {
    setShowMobilePanel(false);
  }, []);

  const handleDoubleTap = useCallback(() => {
    // Quick restart on double tap
    if (errorState.hasError) {
      handleRetryWithVoice();
    } else {
      handleOrbClick();
    }
  }, [errorState.hasError, handleRetryWithVoice, handleOrbClick]);

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          color: 'green',
          bgClass: 'from-green-400/40 to-green-600/20',
          shadowClass: 'shadow-green-500/30',
          borderClass: 'border-green-400/50',
          textClass: 'text-green-300',
          dotClass: 'bg-green-400',
          label: isMultiTurnMode ? 'Waiting for input...' : 'Listening...'
        };
      case 'speaking':
        return {
          color: 'purple',
          bgClass: 'from-purple-400/40 to-purple-600/20',
          shadowClass: 'shadow-purple-500/30',
          borderClass: 'border-purple-400/50',
          textClass: 'text-purple-300',
          dotClass: 'bg-purple-400',
          label: 'Speaking...'
        };
      case 'processing':
        return {
          color: 'blue',
          bgClass: 'from-blue-400/40 to-blue-600/20',
          shadowClass: 'shadow-blue-500/30',
          borderClass: 'border-blue-400/50',
          textClass: 'text-blue-300',
          dotClass: 'bg-blue-400',
          label: isMultiTurnMode ? 'Processing command...' : 'Processing...'
        };
      case 'error':
        return {
          color: 'red',
          bgClass: 'from-red-400/40 to-red-600/20',
          shadowClass: 'shadow-red-500/30',
          borderClass: 'border-red-400/50',
          textClass: 'text-red-300',
          dotClass: 'bg-red-400',
          label: errorState.retryable ? 'Tap to retry' : 'Error occurred'
        };
      default:
        return {
          color: 'white',
          bgClass: 'from-white/20 to-white/5 hover:from-white/30 hover:to-white/10',
          shadowClass: 'shadow-white/10',
          borderClass: 'border-white/20',
          textClass: 'text-white/80',
          dotClass: 'bg-slate-400',
          label: isMultiTurnMode ? 'Multi-turn mode' : 'Tap to speak'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <MobileVoiceGestures
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      onDoubleTap={handleDoubleTap}
      isActive={!showMobilePanel}
    >
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white voice-safe-area-top voice-safe-area-bottom voice-safe-area-left voice-safe-area-right">

        {/* Back Button - Enhanced for mobile */}
        <button
          onClick={() => navigate('/ai')}
          className="absolute top-4 right-4 md:top-8 md:right-8 bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/20 shadow-2xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-105 group touch-manipulation z-50"
          aria-label="Go back to AI page"
        >
          <ArrowLeftIcon className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
        </button>

        {/* Main Orb - Responsive sizing */}
        <div className="relative">
          <div
            className={`voice-orb ${status} relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 ease-in-out transform hover:scale-105 active:scale-95 z-10 backdrop-blur-sm border ${statusConfig.borderClass} bg-gradient-to-br ${statusConfig.bgClass} shadow-2xl ${statusConfig.shadowClass} touch-manipulation voice-focus touch-target voice-haptic-ready voice-gpu-accelerated ${isLowPowerMode ? 'voice-low-power' : ''}`}
            onClick={handleOrbClick}
            role="button"
            aria-label={`Voice control: ${statusConfig.label}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOrbClick();
              }
            }}
          >
            {/* Outer pulse ring for active states */}
            {(status === 'listening' || status === 'speaking' || status === 'processing') && (
              <div className={`absolute inset-0 rounded-full border-2 animate-ping ${statusConfig.borderClass}`} />
            )}
            
            {/* Inner glow ring */}
            <div className="absolute inset-2 md:inset-3 rounded-full border border-white/30 shadow-inner" />
            
            {/* Subtle inner highlight */}
            <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            
            {/* Icon - Error state shows warning icon */}
            {status === 'error' ? (
              <ExclamationTriangleIcon className={`w-12 h-12 md:w-16 md:h-16 z-10 transition-colors duration-500 ease-in-out ${statusConfig.textClass}`} />
            ) : (
              <MicrophoneIcon className={`w-12 h-12 md:w-16 md:h-16 z-10 transition-colors duration-500 ease-in-out ${statusConfig.textClass}`} />
            )}
            
            {/* Status indicator dot */}
            <div className={`absolute top-3 right-3 md:top-4 md:right-4 w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors duration-500 ease-in-out ${statusConfig.dotClass} ${status !== 'idle' ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Status Card - Enhanced responsive design */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-gradient-to-br from-slate-800/80 to-slate-900/60 backdrop-blur-xl px-3 py-2 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 max-w-[calc(100vw-6rem)] md:max-w-none">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors duration-300 ${statusConfig.dotClass} ${status !== 'idle' ? 'animate-pulse' : ''}`} />
            <p className="text-white font-medium text-xs md:text-sm tracking-wide truncate">
              {statusConfig.label}
            </p>
          </div>
        </div>

                 {/* Enhanced Error Display */}
         {errorState.hasError && (
           <div className="voice-error-card absolute top-20 md:top-24 left-4 right-4 md:left-8 md:right-8 bg-gradient-to-br from-red-800/90 to-red-900/70 backdrop-blur-xl px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-red-400/30 shadow-2xl shadow-red-500/20 transition-all duration-500 animate-in slide-in-from-top-4 z-40">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-4 h-4 md:w-5 md:h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-200 text-xs md:text-sm font-medium mb-1">
                  {errorState.type === 'network' && 'Network Error'}
                  {errorState.type === 'microphone' && 'Microphone Error'}
                  {errorState.type === 'permission' && 'Permission Error'}
                  {errorState.type === 'speech' && 'Speech Recognition Error'}
                  {errorState.type === 'unknown' && 'Unknown Error'}
                </p>
                <p className="text-white text-xs md:text-sm leading-relaxed break-words">{errorState.message}</p>
                {errorState.retryable && retryCount.current < maxRetries && (
                  <button
                    onClick={handleRetryWithVoice}
                    className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded-lg transition-colors touch-manipulation"
                  >
                    Retry ({maxRetries - retryCount.current} left)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Multi-turn Prompt Card - Mobile optimized */}
        {isMultiTurnMode && currentPrompt && (
          <div className="absolute bottom-24 md:top-1/2 left-4 right-4 md:left-8 md:right-auto md:-translate-y-1/2 max-w-full md:max-w-sm bg-gradient-to-br from-blue-800/90 to-blue-900/70 backdrop-blur-xl px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-blue-400/30 shadow-2xl shadow-blue-500/20 transition-all duration-500 animate-in slide-in-from-bottom-4 md:slide-in-from-left-4 z-30">
            <div className="flex items-start space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-blue-200 text-xs font-medium mb-2 uppercase tracking-wider">Command Assistant</p>
                <p className="text-white text-sm leading-relaxed font-medium break-words">{currentPrompt}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Card - Mobile optimized */}
        {transcript && (
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 max-w-full md:max-w-lg bg-gradient-to-br from-slate-800/90 to-slate-900/70 backdrop-blur-xl px-4 py-3 md:px-8 md:py-6 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl shadow-black/30 transition-all duration-500 animate-in slide-in-from-bottom-4 z-20">
            <div className="flex items-start space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-medium mb-2 uppercase tracking-wider">Last transcript</p>
                <p className="text-white text-sm md:text-base leading-relaxed font-medium break-words">{transcript}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Activity Panel */}
        {showMobilePanel && (
                     <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end voice-focus-trap">
             <div className="w-full bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-3xl border-t border-white/20 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4 max-h-[70vh] overflow-hidden voice-safe-area-bottom">
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-slate-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="px-6 pb-4 border-b border-slate-700/50">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-purple-400" />
                  Voice Activity
                </h3>
              </div>
              
                             {/* Activity List */}
               <div className="px-6 py-4 overflow-y-auto max-h-[50vh] voice-scrollbar voice-smooth-scrolling">
                {activityEvents.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                                         {activityEvents.map((event) => (
                       <div key={event.id} className="voice-activity-item flex items-start gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-600/30">
                         <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                           event.type === 'input' ? 'bg-green-400' :
                           event.type === 'processing' ? 'bg-blue-400' :
                           event.type === 'response' ? 'bg-purple-400' :
                           'bg-red-400'
                         }`} />
                         <div className="flex-1 min-w-0">
                           <p className="text-white text-sm break-words voice-text-responsive">{event.message}</p>
                           <div className="flex items-center gap-2 mt-1">
                             <p className="text-slate-400 text-xs">
                               {event.timestamp.toLocaleTimeString()}
                             </p>
                             {event.duration && (
                               <p className="text-slate-400 text-xs">
                                 • {event.duration}ms
                               </p>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
              
              {/* Mobile Gesture Hints */}
              <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50">
                <div className="grid grid-cols-2 gap-4 text-slate-300 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center">
                      <span>👆</span>
                    </div>
                    <span>Tap orb to speak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <span>⬇️</span>
                    </div>
                    <span>Swipe down to close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Gesture Hints - Only show when panel is closed */}
        {!showMobilePanel && (
          <div className="md:hidden fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md rounded-full px-4 py-2 border border-slate-700/50 shadow-xl transition-all duration-300 z-10">
            <div className="flex items-center gap-4 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-green-600/20 rounded-full flex items-center justify-center">
                  <span className="text-xs">👆</span>
                </div>
                <span>Tap</span>
              </div>
              <div className="w-px h-3 bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <span className="text-xs">⬆️</span>
                </div>
                <span>Swipe up</span>
              </div>
            </div>
          </div>
        )}

        {/* Decorative Particles - Reduced for mobile performance */}
        {!isLowPowerMode && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.animationDelay}s`,
                  animationDuration: `${particle.animationDuration}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Enhanced Gradient Overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent pointer-events-none" />
        
        {/* Subtle animated background light - Reduced for mobile */}
        {!isLowPowerMode && (
          <>
            <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none opacity-50" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 md:w-80 md:h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse pointer-events-none opacity-50" style={{ animationDelay: '2s' }} />
          </>
        )}
      </div>
    </MobileVoiceGestures>
  );
}