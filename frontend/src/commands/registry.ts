export interface CommandDefinition {
  name: string; // slash name e.g. create-project
  alias?: string; // camelCase alias used in AI JSON blocks etc.
  description: string;
  args?: string[]; // positional args in order
  flags?: string[]; // allowed flags (e.g. --desc)
}

export const commandRegistry: CommandDefinition[] = [
  {
    name: 'create-project',
    alias: 'createProject',
    description: 'Create a new project',
    args: ['name'],
    flags: ['--desc', '--code'],
  },
  {
    name: 'new-task',
    alias: 'createTask',
    description: 'Create a new task for the current or specified project',
    args: ['projectId', 'title'],
    flags: ['--due', '--assignee', '--priority'],
  },
  {
    name: 'note',
    alias: 'createNote',
    description: 'Add a personal note (optional link to project)',
    args: ['content'],
    flags: [],
  },
  {
    name: 'summarize',
    alias: 'summarize',
    description: 'Summarize current activity',
    args: [],
  },
];

export function getCommandDefinition(cmdName: string): CommandDefinition | undefined {
  return commandRegistry.find(c => c.name === cmdName || c.alias === cmdName);
} 