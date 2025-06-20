import { useCallback } from 'react';
import { voiceReplies } from '../utils/voiceReplies';

export function useVoiceAcknowledgement() {
  return useCallback(() => voiceReplies.acknowledgement(), []);
} 