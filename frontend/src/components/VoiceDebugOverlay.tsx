import React from 'react';

interface VoiceDebugOverlayProps {
  show: boolean;
  lastTranscript: string;
  similarityScore: number;
  echoSuppressed: boolean;
  voiceActivityLevel: number;
  isSpeaking: boolean;
  isListening: boolean;
}

const VoiceDebugOverlay: React.FC<VoiceDebugOverlayProps> = ({
  show,
  lastTranscript,
  similarityScore,
  echoSuppressed,
  voiceActivityLevel,
  isSpeaking,
  isListening
}) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-72 bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs p-4 rounded-lg shadow-lg space-y-1 border border-slate-700">
      <div className="font-bold text-slate-100 mb-1">Voice Debug</div>
      <div><span className="text-slate-400">Transcript:</span> {lastTranscript || '—'}</div>
      <div><span className="text-slate-400">Similarity:</span> {similarityScore.toFixed(2)}</div>
      <div><span className="text-slate-400">Echo Suppressed:</span> {echoSuppressed ? 'Yes' : 'No'}</div>
      <div><span className="text-slate-400">VAD Level:</span> {(voiceActivityLevel * 100).toFixed(0)}%</div>
      <div><span className="text-slate-400">TTS Speaking:</span> {isSpeaking ? '🎤' : '—'}</div>
      <div><span className="text-slate-400">Mic Listening:</span> {isListening ? '✅' : '—'}</div>
    </div>
  );
};

export default VoiceDebugOverlay; 