import React, { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, PauseIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { aiChatApi } from '../../api/aiChat';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { toast } from 'react-hot-toast';
import MicWave from '../../components/ai-chat/MicWave';
import TypingDots from '../../components/visual/TypingDots';
import { useOpenAITTS } from '../../hooks/useOpenAITTS';
import VoiceStatusPanel from '../../components/ai-chat/VoiceStatusPanel';
import VoiceTimeline from '../../components/ai-chat/VoiceTimeline';
import type { TimelineEvent } from '../../components/ai-chat/VoiceTimeline';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// Add minimal global typings for browsers where TS lib dom doesn't include them
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { pageContext, setPageContext } = useAIChat();
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [paused, setPaused] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const { speak: speakOpenAI } = useOpenAITTS();
  const [statusMsg, setStatusMsg] = useState('Listening');
  const [events, setEvents] = useState<TimelineEvent[]>([{ id: Date.now(), label: 'Listening', state: 'listening' }]);

  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  // Auto-set page context once (current route info)
  useEffect(() => {
    setPageContext({ ...pageContext, voiceMode: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript, loadingReply]);

  // Initialise SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      console.error('SpeechRecognition API not supported');
      return;
    }
    const recog = new SpeechRecognitionCtor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (e: any) => {
      if (isSpeakingRef.current) return; // ignore while AI speaks
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          handleFinalTranscript(res[0].transcript.trim());
        } else {
          interim += res[0].transcript;
        }
      }
      setTranscript(interim);
      setStatusMsg('Transcribing speech');
      pushEvent('Transcribing speech', 'transcribing');
    };

    recog.onerror = console.error;
    recognitionRef.current = recog;
    startListening();
    // cleanup
    return () => recog.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setListening(true);
    setStatusMsg('Listening');
    pushEvent('Listening', 'listening');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setStatusMsg('Paused');
    pushEvent('Paused', 'idle');
  };

  // Welcome message once
  useEffect(() => {
    const welcome = async () => {
      setIsSpeaking(true);
      stopListening();
      await speakOpenAI('Welcome to Labnex Voice Mode. You can speak freely or say exit to leave.');
      setIsSpeaking(false);
      setStatusMsg('Listening');
      pushEvent('Listening', 'listening');
      startListening();
    };
    welcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simple voice command router
  const tryVoiceCommand = (lower: string): boolean => {
    const pid = pageContext.projectId;
    const speakAndNav = async (msg: string, path: string) => {
      toast(msg);
      setStatusMsg(msg);
      pushEvent(msg, 'executing');
      setIsSpeaking(true);
      stopListening();
      await speakOpenAI(msg);
      setIsSpeaking(false);
      setStatusMsg('Listening');
      pushEvent('Listening', 'listening');
      navigate(path);
      startListening();
    };

    if (lower.includes('go back to chat')) {
      speakAndNav('Returning to chat.', '/ai');
      return true;
    }
    if (pid && lower.includes('open test cases')) {
      speakAndNav('Opening test cases.', `/projects/${pid}/test-cases`);
      return true;
    }
    if (pid && lower.includes('project dashboard')) {
      speakAndNav('Opening project dashboard.', `/projects/${pid}`);
      return true;
    }
    if (pid && lower.includes('create new test case')) {
      speakAndNav('Creating new test case.', `/projects/${pid}/test-cases/create`);
      return true;
    }
    if (lower.includes('exit') || lower.includes('close voice')) {
      navigate(-1);
      return true;
    }
    if (lower.includes('pause listening')) {
      stopListening();
      setPaused(true);
      toast('Voice recognition paused');
      pushEvent('Paused', 'idle');
      return true;
    }
    if (lower.includes('resume listening')) {
      if (!listening) startListening();
      setPaused(false);
      toast('Voice recognition resumed');
      pushEvent('Listening', 'listening');
      return true;
    }
    return false;
  };

  const handleFinalTranscript = async (text: string) => {
    if (!text) return;

    // Voice commands to control mode
    const lower = text.toLowerCase();
    if (tryVoiceCommand(lower)) return;

    const userMsg: VoiceMessage = { id: `${Date.now()}-u`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    setLoadingReply(true);
    setStatusMsg('Analyzing intent');
    pushEvent('Analyzing intent', 'analyzing');

    try {
      const { reply } = await aiChatApi.sendMessage(text, pageContext);
      const botMsg: VoiceMessage = { id: `${Date.now()}-b`, role: 'assistant', text: reply };
      setMessages(prev => [...prev, botMsg]);
      setStatusMsg('Responding');
      pushEvent('Responding', 'executing');
      setIsSpeaking(true);
      stopListening();
      await speakOpenAI(reply);
      setIsSpeaking(false);
      setStatusMsg('Listening');
      pushEvent('Listening', 'listening');
      startListening();
    } catch (e:any) {
      console.error(e);
      const err = 'Sorry, I had trouble reaching the server.';
      setMessages(prev => [...prev, { id: `${Date.now()}-err`, role: 'assistant', text: err }]);
      setStatusMsg('Error');
      pushEvent('Error', 'done');
      setIsSpeaking(true);
      stopListening();
      await speakOpenAI(err);
      setIsSpeaking(false);
      setStatusMsg('Listening');
      pushEvent('Listening', 'listening');
    } finally {
      setLoadingReply(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const pushEvent = (label: string, state: TimelineEvent['state']) => {
    setEvents(prev => [...prev, { id: Date.now(), label, state }]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold">AI Voice Call</h2>
        <div className="flex items-center gap-3">
          <button onClick={toggleListening} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title={listening ? 'Pause' : 'Resume'}>
            {listening ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </button>
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title="Exit voice mode">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Orb & transcript */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 select-none">
        <div
          className={`rounded-full bg-indigo-600 shadow-2xl transition-all duration-500 ${loadingReply || isSpeaking ? 'animate-pulse scale-110' : 'scale-100'} w-40 h-40 flex items-center justify-center`}
        >
          <div className="rounded-full bg-indigo-500 w-32 h-32"></div>
        </div>
        {loadingReply && (
          <TypingDots />
        )}
        {transcript && (
          <p className="text-indigo-200 text-xl animate-pulse px-4 text-center max-w-xl">{transcript}</p>
        )}
        <div ref={messagesEndRef} className="h-0 w-0"/>
      </div>

      {/* Status Panel */}
      <VoiceStatusPanel status={statusMsg} />

      {/* Mic status */}
      <div className="p-4 flex items-center justify-between border-t border-slate-700">
        {listening ? (
          <div className="flex items-center gap-2 text-green-400">
            <MicWave listening={true} />
            <span>Listening…</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <MicrophoneIcon className="h-6 w-6" /> {paused ? 'Paused' : 'Not listening'}
          </div>
        )}
      </div>

      {/* Integrated Timeline */}
      <VoiceTimeline events={events} />
    </div>
  );
};

export default AIVoiceMode; 