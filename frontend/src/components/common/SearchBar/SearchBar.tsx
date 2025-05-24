import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Track initial render to avoid triggering search on mount
  const isInitialMount = useRef(true);
  // Track previous query to avoid unnecessary updates
  const prevQueryRef = useRef('');

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  useEffect(() => {
    // Skip the first render to prevent unwanted initial search
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevQueryRef.current = debouncedSearchQuery;
      return;
    }
    
    // Skip if the query hasn't actually changed to prevent needless rerenders
    if (prevQueryRef.current === debouncedSearchQuery) {
      return;
    }

    // Update previous query
    prevQueryRef.current = debouncedSearchQuery;
    
    // Trigger search
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg
          className="w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}; 