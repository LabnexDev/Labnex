export interface CommandDefinition {
  name: string; // slash name e.g. create-project
  alias?: string; // camelCase alias used in AI JSON blocks etc.
  description: string;
  args?: string[]; // positional args in order
  flags?: string[]; // allowed flags (e.g. --desc)
}

export const commandRegistry: CommandDefinition[] = [
  {
    name: 'projects',
    description: 'List your Labnex projects',
    args: [],
  },
  {
    name: 'create-project',
    alias: 'createProject',
    description: 'Create a new project',
    args: ['name'],
    flags: ['--desc', '--code'],
  },
  {
    name: 'tasks',
    description: 'List tasks for a project',
    args: ['project'],
  },
  {
    name: 'new-task',
    alias: 'createTask',
    description: 'Create a new task for the current or specified project',
    args: ['projectId', 'title'],
    flags: ['--due', '--assignee', '--priority'],
  },
  {
    name: 'notes',
    description: 'List your recent notes',
    args: [],
  },
  {
    name: 'note',
    alias: 'createNote',
    description: 'Add a personal note',
    args: ['content'],
    flags: [],
  },
  {
    name: 'snippets',
    description: 'List your recent code snippets',
    args: [],
  },
  {
    name: 'add-snippet',
    description: 'Create a new code snippet',
    args: ['language', 'title', 'code'],
  },
  {
    name: 'summarize',
    alias: 'summarize',
    description: 'Summarize current activity',
    args: [],
  },
  {
    name: 'help',
    description: 'Show available commands and help',
    args: [],
  },
  {
    name: 'voice',
    description: 'Switch to voice mode',
    args: [],
  },
];

export function getCommandDefinition(cmdName: string): CommandDefinition | undefined {
  return commandRegistry.find(c => c.name === cmdName || c.alias === cmdName);
} 