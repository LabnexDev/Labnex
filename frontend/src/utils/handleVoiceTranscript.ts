import { parseNLUCommand, validateIntent, type ParsedIntent } from './parseNLUCommand';
import { handleIntentProgressively } from './handleIntentProgressively';
import { executeSlashCommand, type CommandResult } from './slashCommandHandler';

export interface VoiceTranscriptResult {
  response: string;
  success?: boolean;
  data?: Record<string, any>;
  needsProgressiveHandling?: boolean;
}

/**
 * Main entry point for processing voice transcripts
 * Parses transcript and either executes immediately or handles progressively
 */
export async function handleVoiceTranscript(
  transcript: string,
  context: { navigate?: (path: string) => void; currentProjectId?: string } = {}
): Promise<VoiceTranscriptResult> {
  if (!transcript.trim()) {
    return { response: "I didn't catch that." };
  }

  // Parse the transcript into structured intent
  const parsedIntent: ParsedIntent = parseNLUCommand(transcript);

  // Handle unknown intents
  if (parsedIntent.intent === 'unknown' || parsedIntent.confidence < 0.3) {
    return { response: "I didn't catch that. Could you try rephrasing?" };
  }

  // Validate if all required fields are present
  const validation = validateIntent(parsedIntent);

  if (validation.isValid) {
    // All fields present - execute immediately
    try {
      const result: CommandResult = await executeSlashCommand(parsedIntent, {
        navigate: context.navigate,
        currentProjectId: context.currentProjectId
      });

      return {
        response: result.message,
        success: result.success,
        data: result.data
      };
    } catch (error) {
      console.error('Command execution failed:', error);
      return { 
        response: "Sorry, I encountered an error executing that command.",
        success: false 
      };
    }
  } else {
    // Missing fields - handle progressively
    const progressiveResult = await handleIntentProgressively(parsedIntent, context);
    return {
      ...progressiveResult,
      needsProgressiveHandling: true
    };
  }
} 