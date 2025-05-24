import React from 'react';

interface Topic {
  id: string;
  title: string;
  subTopics?: Topic[]; // For nested navigation
}

// Define documentation topics - this can be expanded significantly
const topics: Topic[] = [
  { id: 'introduction', title: 'Introduction to Labnex' },
  {
    id: 'getting-started',
    title: 'Getting Started',
    subTopics: [
      { id: 'account-creation', title: 'Account Creation' },
      { id: 'discord-linking', title: 'Linking Discord Account' },
    ],
  },
  {
    id: 'website-usage',
    title: 'Website Usage',
    subTopics: [
      { id: 'dashboard', title: 'Dashboard Overview' },
      { id: 'project-management', title: 'Project Management' },
      { id: 'task-management', title: 'Task Management' },
      { id: 'test-case-management', title: 'Test Case Management' },
      { id: 'notes-snippets', title: 'Notes & Snippets' },
      { id: 'user-settings', title: 'User Settings' },
    ],
  },
  {
    id: 'discord-bot-usage',
    title: 'Discord Bot Usage',
    subTopics: [
      { id: 'bot-commands', title: 'Available Commands' },
      { id: 'bot-task-creation', title: 'Creating Tasks via Bot' },
      { id: 'bot-note-snippet', title: 'Notes & Snippets via Bot' },
    ],
  },
  { id: 'faq', title: 'FAQ' },
  {
    id: 'advanced-topics',
    title: 'Advanced Topics',
    subTopics: [
      { id: 'api-reference', title: 'API Reference (Overview)' },
      { id: 'developer-guide', title: 'Developer Guide (Contributing)' },
    ],
  },
];

interface DocumentationSidebarProps {
  selectedTopic: string;
  onSelectTopic: (topicId: string) => void;
}

const DocumentationSidebar: React.FC<DocumentationSidebarProps> = ({ selectedTopic, onSelectTopic }) => {
  // Recursive function to render topics and subtopics
  const renderTopics = (topicList: Topic[], level = 0) => {
    return topicList.map(topic => {
      const isActive = selectedTopic === topic.id;
      return (
        <li key={topic.id} className={`${level > 0 ? 'ml-4' : ''}`}>
          <a
            href={`#doc-${topic.id}`}
            onClick={(e) => {
              e.preventDefault(); // Prevent default hash jump, navigation handled by onSelectTopic
              onSelectTopic(topic.id);
            }}
            className={`block p-2 rounded-md transition-colors duration-150 ease-in-out 
                        ${level === 0 ? 'font-semibold' : 'text-sm'} 
                        ${isActive 
                          ? 'bg-blue-600/30 text-blue-300' 
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-blue-300'}`}
          >
            {topic.title}
          </a>
          {topic.subTopics && topic.subTopics.length > 0 && (
            <ul className="mt-1">
              {renderTopics(topic.subTopics, level + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <aside className="w-full md:w-1/4 md:min-w-[280px] md:max-w-[320px] p-4 bg-slate-800/70 backdrop-blur-md rounded-lg shadow-xl md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
      <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-slate-700 pb-2">Documentation</h2>
      <nav>
        <ul className="space-y-1">
          {renderTopics(topics)}
        </ul>
      </nav>
    </aside>
  );
};

export default DocumentationSidebar; 