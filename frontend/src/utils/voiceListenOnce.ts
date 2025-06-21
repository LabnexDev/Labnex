/**
 * Listen for a single speech input and return the transcript
 * This is a mock implementation - in reality this would use the speech recognition API
 */
export async function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim();
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      // If no result was captured, resolve with empty string
      // This prevents hanging promises
    };

    try {
      recognition.start();
    } catch (error) {
      reject(error);
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      try {
        recognition.stop();
        reject(new Error('Speech recognition timeout'));
      } catch (e) {
        // Ignore errors when stopping
      }
    }, 10000);
  });
}

/**
 * Speak text using TTS
 * This is a placeholder - in reality you'd use your existing TTS system
 */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Still resolve on error to not block flow
    speechSynthesis.speak(utterance);
  });
} 