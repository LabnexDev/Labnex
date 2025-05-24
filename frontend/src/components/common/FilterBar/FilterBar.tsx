import React from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  sortOptions: FilterOption[];
  filterOptions: FilterOption[];
  onSortChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  sortOptions,
  filterOptions,
  onSortChange,
  onFilterChange,
  onSortOrderChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {/* Sort Dropdown */}
      <div className="flex items-center space-x-2">
        <label className="text-gray-400 text-sm">Sort by:</label>
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Sort Order Toggle */}
        <button
          onClick={() => onSortOrderChange('asc')}
          className="p-1.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
        <button
          onClick={() => onSortOrderChange('desc')}
          className="p-1.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center space-x-2">
        <label className="text-gray-400 text-sm">Filter by:</label>
        <select
          onChange={(e) => onFilterChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}; 