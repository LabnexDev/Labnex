import React, { useEffect, useRef, useState } from 'react';
import { MicrophoneIcon, PauseIcon, PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { aiChatApi } from '../../api/aiChat';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../../contexts/AIChatContext';
import { toast } from 'react-hot-toast';
import MicWave from '../../components/ai-chat/MicWave';
import TypingDots from '../../components/visual/TypingDots';

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

type Tone = 'whisper' | 'normal' | 'announcer';

const speakTTS = (text: string, tone: Tone = 'normal') => {
  return new Promise<void>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = (speechSynthesis.getVoices().find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('shimmer')) as SpeechSynthesisVoice) || null;

    // Adjust tone characteristics
    switch (tone) {
      case 'whisper':
        utter.volume = 0.6;
        utter.rate = 1.1;
        utter.pitch = 1.2;
        break;
      case 'announcer':
        utter.volume = 1;
        utter.rate = 0.9;
        utter.pitch = 0.9;
        break;
      default:
        utter.volume = 1;
        utter.rate = 1;
        utter.pitch = 1;
    }
    utter.onend = () => resolve();
    speechSynthesis.speak(utter);
  });
};

const AIVoiceMode: React.FC = () => {
  const navigate = useNavigate();
  const { pageContext, setPageContext } = useAIChat();
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [paused, setPaused] = useState(false);
  const [voiceTone, setVoiceTone] = useState<Tone>('normal');
  const [loadingReply, setLoadingReply] = useState(false);

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
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // Simple voice command router
  const tryVoiceCommand = (lower: string): boolean => {
    const pid = pageContext.projectId;
    const speakAndNav = async (msg: string, path: string) => {
      toast(msg);
      await speakTTS(msg, voiceTone);
      navigate(path);
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
      return true;
    }
    if (lower.includes('resume listening')) {
      if (!listening) startListening();
      setPaused(false);
      toast('Voice recognition resumed');
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

    try {
      const { reply } = await aiChatApi.sendMessage(text, pageContext);
      const botMsg: VoiceMessage = { id: `${Date.now()}-b`, role: 'assistant', text: reply };
      setMessages(prev => [...prev, botMsg]);
      await speakTTS(reply, voiceTone);
    } catch (e:any) {
      console.error(e);
      const err = 'Sorry, I had trouble reaching the server.';
      setMessages(prev => [...prev, { id: `${Date.now()}-err`, role: 'assistant', text: err }]);
      await speakTTS(err, voiceTone);
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

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold">AI Voice Call</h2>
        <div className="flex items-center gap-3">
          {/* Tone selector */}
          <select
            value={voiceTone}
            onChange={(e) => setVoiceTone(e.target.value as Tone)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-2 py-1 focus:outline-none"
            title="Voice tone"
          >
            <option value="whisper">Whisper</option>
            <option value="normal">Normal</option>
            <option value="announcer">Announcer</option>
          </select>
          <button onClick={toggleListening} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title={listening ? 'Pause' : 'Resume'}>
            {listening ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </button>
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title="Exit voice mode">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" id="voice-scroll">
        {messages.map(m => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'self-end text-right'
                : 'self-start text-left'
            }
          >
            <div
              className={
                m.role === 'user'
                  ? 'inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md max-w-prose'
                  : 'inline-block bg-slate-800 text-slate-100 px-4 py-2 rounded-lg shadow-md max-w-prose'
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {loadingReply && (
          <div className="self-start text-left">
            <div className="inline-block bg-slate-800 text-slate-100 px-4 py-2 rounded-lg shadow-md max-w-prose">
              <TypingDots />
            </div>
          </div>
        )}
        {transcript && (
          <div className="self-end text-right opacity-70">
            <div className="inline-block border border-indigo-400 text-indigo-300 px-4 py-2 rounded-lg max-w-prose animate-pulse">
              {transcript}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
        <span className="text-xs text-slate-500">Tone: {voiceTone}</span>
      </div>
    </div>
  );
};

export default AIVoiceMode; 