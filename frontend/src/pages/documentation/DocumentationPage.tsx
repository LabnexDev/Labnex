import React, { useState, useEffect } from 'react';
import DocumentationSidebar from './DocumentationSidebar';
import DocumentationContent from './DocumentationContent';

const DocumentationPage: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>('introduction'); // Default to introduction

  useEffect(() => {
    // Handle initial topic selection from URL hash if present
    const hash = window.location.hash.replace('#doc-', '');
    if (hash) {
      setSelectedTopic(hash);
    }
  }, []);

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    window.location.hash = `doc-${topicId}`; // Update URL hash for deep linking
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-h-[calc(100vh-var(--header-height,4rem))] bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-100 p-4 md:p-6 lg:p-8 gap-6">
      <DocumentationSidebar selectedTopic={selectedTopic} onSelectTopic={handleSelectTopic} />
      <DocumentationContent selectedTopic={selectedTopic} />
    </div>
  );
};

export default DocumentationPage; 