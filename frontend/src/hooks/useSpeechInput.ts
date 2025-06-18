import { useEffect, useRef, useState } from 'react';

interface SpeechInputOptions {
  onResult: (text: string) => void;
  enabled: boolean;
}

export function useSpeechInput({ onResult, enabled }: SpeechInputOptions) {
  // @ts-ignore - SpeechRecognition not in lib dom by default
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    // @ts-ignore
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionConstructor();
    const rec = recognitionRef.current;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
  }, [onResult]);

  const start = () => {
    if (!enabled || !recognitionRef.current) return;
    recognitionRef.current.start();
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { listening, start, stop };
} 