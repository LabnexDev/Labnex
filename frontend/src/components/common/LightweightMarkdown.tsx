import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface LightweightMarkdownProps {
  children: string;
  className?: string;
}

const LightweightMarkdown: React.FC<LightweightMarkdownProps> = ({ 
  children, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && children) {
      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false,
      });

      // Convert markdown to HTML
      const html = marked(children);
      
      // Sanitize HTML
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
          'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'hr'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
        ALLOW_DATA_ATTR: false,
      });

      containerRef.current.innerHTML = sanitizedHtml;
    }
  }, [children]);

  return (
    <div 
      ref={containerRef} 
      className={'prose prose-sm max-w-none ' + className}
    />
  );
};

export default LightweightMarkdown;