import { getCommandDefinition } from '../commands/registry';

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

// Very small tokenizer supporting quoted strings
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && ch === ' ') {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

export function parseCommand(input: string): ParsedCommand | null {
  if (!input.startsWith('/')) return null;
  const withoutSlash = input.slice(1);
  const tokens = tokenize(withoutSlash);
  if (tokens.length === 0) return null;
  const commandName = tokens[0];
  const cmdDef = getCommandDefinition(commandName);
  if (!cmdDef) return null;

  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 1;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.startsWith('--')) {
      const flagName = tok;
      const next = tokens[i + 1];
      if (next && !next.startsWith('--')) {
        flags[flagName] = next;
        i += 2;
      } else {
        flags[flagName] = true;
        i += 1;
      }
    } else {
      args.push(tok);
      i += 1;
    }
  }

  return { command: commandName, args, flags };
} 