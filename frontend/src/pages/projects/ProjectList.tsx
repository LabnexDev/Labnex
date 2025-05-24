import { useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { SearchBar } from '../../components/common/SearchBar/SearchBar';
import { Filter } from '../../components/common/Filter/Filter';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import type { Project } from '../../api/projects';
import type { SearchParams, SearchResponse } from '../../api/search';

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Last Updated' }
];

const filterOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

// Define initialParams outside the component to ensure stability
const projectListInitialParams: Partial<SearchParams> = {
  sortBy: 'updatedAt',
  sortOrder: 'desc' // This is a valid 'asc' | 'desc' value
};

export function ProjectList() {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    params,
    updateParams,
    setPage,
    clearSearch
  } = useSearch({
    type: 'projects',
    initialParams: projectListInitialParams // Use the stable object
  });

  // Define callback handlers with useCallback to prevent recreation on each render
  const handleSearch = useCallback((query: string) => {
    updateParams({ query: query || undefined });
  }, [updateParams]);

  const handleSortChange = useCallback((value: string) => {
    updateParams({ sortBy: value });
  }, [updateParams]);

  const handleStatusChange = useCallback((value: string) => {
    updateParams({ status: value || undefined });
  }, [updateParams]);

  // Cleanup search state when component unmounts
  useEffect(() => {
    return () => {
      clearSearch();
      queryClient.removeQueries({ queryKey: ['projects'] });
    };
  }, [clearSearch, queryClient]);

  // Safe access to data with fallbacks - using useMemo to prevent recalculation on every render
  const projects = useMemo(() => (data as SearchResponse<Project>)?.data || [], [data]);
  const totalPages = useMemo(() => (data as SearchResponse<Project>)?.totalPages || 0, [data]);
  const hasSearchFilters = useMemo(() => !!params.query || !!params.status, [params.query, params.status]);

  // Content rendering function wrapped in useMemo to prevent recreation on every render
  const content = useMemo(() => {
    // Initial loading with no data
    if (isLoading && !projects.length) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      );
    }

    // No results state
    if (!isLoading && projects.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-800/30 rounded-lg">
          {hasSearchFilters ? (
            <>
              <p className="text-gray-400">No projects match your search criteria</p>
              <button 
                onClick={() => clearSearch()}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-4">You don't have any projects yet</p>
              <Link to="/projects/new" className="btn btn-primary">
                Create Your First Project
              </Link>
            </>
          )}
        </div>
      );
    }

    // Projects grid with optional loading overlay
    return (
      <div className={isLoading ? "opacity-60 pointer-events-none" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      </div>
    );
  }, [isLoading, projects, hasSearchFilters, clearSearch]);

  // Memoize the pagination element to prevent recreation on every render
  const paginationElement = useMemo(() => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setPage(page)}
            className={`px-3 py-1 rounded transition-colors ${
              page === params.page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    );
  }, [totalPages, params.page, setPage]);

  return (
    <div className="space-y-6">
      {/* Header with title and create button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Link to="/projects/new" className="btn btn-primary">
          Create Project
        </Link>
      </div>
      
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar
          placeholder="Search projects..."
          onSearch={handleSearch}
        />
        <div className="flex gap-4">
          <Filter
            label="Sort by"
            options={sortOptions}
            value={params.sortBy || 'updatedAt'}
            onChange={handleSortChange}
          />
          <Filter
            label="Status"
            options={filterOptions}
            value={params.status || ''}
            onChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Error handling */}
      {error && (
        <div className="my-4">
          <ErrorMessage message="Failed to load projects. Please try again." />
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content */}
      {content}

      {/* Pagination */}
      {paginationElement}
    </div>
  );
} 