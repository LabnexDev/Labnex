export function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const voiceReplies = {
  taskCreated: () => random([
    'Task created!',
    'All set. Task is ready.',
    'Done. What else can I help with?'
  ]),
  projectCreated: () => random([
    'Project created successfully.',
    'Great! Your project is live.',
    'Done! What should we do next?'
  ]),
  fallbackHelp: () => random([
    "I didn't catch that. Try saying 'Create a task' or 'Go to dashboard.'",
    'Hmm, not sure I understood. You can ask me to show test cases or create something new.'
  ]),
  acknowledgement: () => random([
    'Sure thing.',
    'Gotcha.',
    'Alright, let me take care of that.'
  ]),
  encouragement: () => random([
    'You\'re really knocking things out!',
    'Great momentum — keep it up!',
    'Awesome progress so far.',
    'Let me know when you\'re ready to review everything.'
  ]),
  missingField: (field: string) => {
    switch (field) {
      case 'title':
        return random([
          'What should I call it?',
          'What\'s the title?',
          'Can you give me a name for it?'
        ]);
      case 'assignee':
        return random([
          'Who should I assign it to?',
          'Anyone in particular to handle it?'
        ]);
      default:
        return 'Can you give me that detail?';
    }
  }
}; 