import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Placeholder for where individual topic content components would be imported
// import IntroductionContent from './topics/IntroductionContent';
// import GettingStartedContent from './topics/GettingStartedContent';

interface DocumentationContentProps {
  selectedTopic: string;
}

const DocumentationContent: React.FC<DocumentationContentProps> = ({ selectedTopic }) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTopic) return;

    const fetchMarkdown = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ensure BASE_URL ends with a slash if it's not just "/"
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') || import.meta.env.BASE_URL === '/' 
                        ? import.meta.env.BASE_URL 
                        : `${import.meta.env.BASE_URL}/`;
        
        // Construct the correct path ensuring no double slashes if documentation_md already starts with one
        const filePath = `documentation_md/topics/${selectedTopic}.md`;
        const fullPath = `${baseUrl}${filePath.startsWith('/') ? filePath.substring(1) : filePath}`;

        const response = await fetch(fullPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation for "${selectedTopic}" from ${fullPath}. Status: ${response.status}`);
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (err: any) {
        console.error("Error fetching markdown:", err);
        setError(err.message || 'Could not load documentation content.');
        setMarkdownContent(''); // Clear content on error
      }
      setIsLoading(false);
    };

    fetchMarkdown();
  }, [selectedTopic]);

  return (
    <main className="flex-1 p-4 md:p-6 bg-[var(--lnx-surface)] dark:bg-slate-800/50 backdrop-blur-md rounded-lg shadow-xl overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 border border-[var(--lnx-border)] dark:border-slate-700/50">
      {isLoading && (
        <div className="flex justify-center items-center h-full">
          <p className="text-lg text-gray-400">Loading documentation...</p> {/* Replace with a proper loader component if available */}
        </div>
      )}
      {error && (
        <div className="text-red-400 p-4 bg-red-900/30 rounded-md">
          <h3 className="font-semibold text-lg mb-2">Error Loading Content</h3>
          <p>{error}</p>
          <p>Please try selecting another topic or refreshing the page.</p>
        </div>
      )}
      {!isLoading && !error && (
        <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl prose-headings:text-blue-300 prose-headings:border-b prose-headings:border-slate-700 prose-headings:pb-2 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-blue-200 prose-code:bg-slate-700/50 prose-code:text-amber-300 prose-code:p-1 prose-code:rounded-md prose-blockquote:border-l-blue-400 prose-blockquote:text-gray-300 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 break-words dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </article>
      )}
      {!isLoading && !error && !markdownContent && selectedTopic && (
        <div className="text-center text-gray-400 py-10">
           <h2 className="text-2xl font-semibold mb-4">Content Not Found</h2>
           <p>The content for "{selectedTopic}" could not be loaded or is not yet available.</p>
           <p>It might be that the corresponding <code>{selectedTopic}.md</code> file is missing in the topics directory.</p>
        </div>
      )}
    </main>
  );
};

export default DocumentationContent; 