import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardSubComponents {
  Title: React.FC<{ children: ReactNode; className?: string }>;
  Content: React.FC<{ children: ReactNode; className?: string }>;
}

const Card: React.FC<CardProps> & CardSubComponents = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const Title: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <h2 className={`p-4 sm:p-5 text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700/50 ${className}`}>
      {children}
    </h2>
  );
};

const Content: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = Title;
Card.Content = Content;

export { Card }; 