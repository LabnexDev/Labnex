import React, { useState, useEffect } from 'react';
import Seo from '../../components/common/Seo';
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
    <>
      <Seo title="Labnex Documentation" description="Browse topics and guides to make the most of Labnex features." canonical="https://www.labnex.dev/documentation" />
      <div className="flex flex-col md:flex-row w-full p-4 md:p-6 lg:p-8 gap-6 bg-[var(--lnx-bg)] dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 text-gray-900 dark:text-gray-100">
        <DocumentationSidebar selectedTopic={selectedTopic} onSelectTopic={handleSelectTopic} />
        <DocumentationContent selectedTopic={selectedTopic} />
      </div>
    </>
  );
};

export default DocumentationPage; 