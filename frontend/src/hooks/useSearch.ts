import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import type { SearchParams, SearchResponse } from '../api/search';

interface UseSearchOptions {
  type: 'projects' | 'testCases';
  initialParams?: Partial<SearchParams>;
}

export function useSearch({ type, initialParams = {} }: UseSearchOptions) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<SearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialParams
  });

  // Use a ref to track the initial load 
  const initialLoadDoneRef = useRef(false);
  
  // Track the previous search query state to avoid unnecessary effect triggers
  const prevSearchQueryRef = useRef(false);
  
  // Unique key for this parameter set to stabilize renders
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);
  
  // Determine if this is a search query or an initial load - memoize to prevent recalculation
  const isSearchQuery = useMemo(() => 
    !!params.query || !!params.status || params.page !== 1, 
    [params.query, params.status, params.page]
  );

  const { data, isLoading, error } = useQuery<SearchResponse<any>>({
    queryKey: [type, paramsKey],
    queryFn: async () => {
      // Mark initial load as done after first fetch
      initialLoadDoneRef.current = true;
      
      // Make the actual API call
      try {
        if (type === 'projects') {
          return await searchApi.searchProjects(params);
        } else {
          return await searchApi.searchTestCases(params);
        }
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
        throw error;
      }
    },
    // Enable query only in these cases:
    // 1. Initial load (when initialLoadDoneRef.current is false)
    // 2. When there are active search parameters
    // 3. When explicitly refetching (handled by React Query)
    enabled: !initialLoadDoneRef.current || isSearchQuery,
    // Control refetching
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    // For errors
    retry: 1,
    retryDelay: 2000,
    // Provide fallback empty data to prevent crashes
    placeholderData: {
      data: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0
    },
    // Tell React Query not to refetch this query when window regains focus
    refetchOnWindowFocus: false
  });

  // Reset initial load flag ONLY when transitioning from non-search to search state
  useEffect(() => {
    // Only trigger when isSearchQuery actually changes from false to true
    if (isSearchQuery && !prevSearchQueryRef.current) {
      initialLoadDoneRef.current = false;
    }
    // Update the ref for next comparison
    prevSearchQueryRef.current = isSearchQuery;
  }, [isSearchQuery]);

  // For parameter updates (search, filters, etc)
  const updateParams = useCallback((newParams: Partial<SearchParams>) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  // For pagination
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  // For clearing the search
  const clearSearch = useCallback(() => {
    queryClient.removeQueries({ queryKey: [type] });
    initialLoadDoneRef.current = false;
    prevSearchQueryRef.current = false;
    setParams({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...initialParams
    });
  }, [queryClient, type, initialParams]);

  return {
    data,
    isLoading,
    error,
    params,
    updateParams,
    setPage,
    clearSearch
  };
} 