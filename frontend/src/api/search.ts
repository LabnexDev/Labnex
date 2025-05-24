import axiosInstance from './axios';
import { getProjects } from './projects';

export interface SearchParams {
  query?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  projectId?: string;
}

export interface SearchResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Request throttling mechanism to prevent excessive API calls
const requestCache: Record<string, { timestamp: number; response: any }> = {};
const CACHE_TTL = 60000; // 1 minute cache validity (increased from 5s)
const MIN_REQUEST_INTERVAL = 1000; // Minimum time between identical requests (increased from 500ms)

// Function to check if we should use a cached response
const shouldUseCache = (cacheKey: string): boolean => {
  const cachedItem = requestCache[cacheKey];
  if (!cachedItem) return false;
  
  const now = Date.now();
  return (now - cachedItem.timestamp) < CACHE_TTL;
};

// Function to check if requests are too frequent
const isTooFrequent = (cacheKey: string): boolean => {
  const cachedItem = requestCache[cacheKey];
  if (!cachedItem) return false;
  
  const now = Date.now();
  return (now - cachedItem.timestamp) < MIN_REQUEST_INTERVAL;
};

// Function to cache a response
const cacheResponse = (cacheKey: string, response: any): void => {
  requestCache[cacheKey] = {
    timestamp: Date.now(),
    response
  };
};

// Helper to format getProjects response to match SearchResponse format
const formatProjectsResponse = (projects: any[], page = 1, limit = 10) => {
  return {
    data: projects,
    total: projects.length,
    page,
    totalPages: Math.ceil(projects.length / limit)
  };
};

export const searchApi = {
  // Search projects
  searchProjects: async (params: SearchParams): Promise<SearchResponse<any>> => {
    const cacheKey = `projects-${JSON.stringify(params)}`;
    
    // Use cached response if available and recent
    if (shouldUseCache(cacheKey)) {
      // Removed console.log to reduce noise
      return requestCache[cacheKey].response;
    }
    
    // Throttle requests if they're too frequent
    if (isTooFrequent(cacheKey)) {
      // Reduced log frequency - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Request throttled to prevent excessive API calls');
      }
      
      // Return cached response if available, even if expired
      if (requestCache[cacheKey]) {
        return requestCache[cacheKey].response;
      }
      
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        totalPages: 0
      };
    }
    
    try {
      // If no search params are provided, use getProjects instead of search API
      if (!params.query && !params.status) {
        const projects = await getProjects();
        const formattedResponse = formatProjectsResponse(
          projects, 
          params.page || 1,
          params.limit || 10
        );
        cacheResponse(cacheKey, formattedResponse);
        return formattedResponse;
      }
      
      // Otherwise use the search API
      const response = await axiosInstance.get<SearchResponse<any>>('/search/projects', { params });
      
      // Cache the successful response
      cacheResponse(cacheKey, response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error searching projects:', error);
      
      // If we have a cached response, use it as fallback
      if (requestCache[cacheKey]) {
        return requestCache[cacheKey].response;
      }
      
      try {
        // As a fallback, try to get all projects
        const projects = await getProjects();
        const formattedResponse = formatProjectsResponse(
          projects,
          params.page || 1,
          params.limit || 10
        );
        return formattedResponse;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Return empty results as a last resort
        return {
          data: [],
          total: 0,
          page: params.page || 1,
          totalPages: 0
        };
      }
    }
  },

  // Search test cases
  searchTestCases: async (params: SearchParams): Promise<SearchResponse<any>> => {
    const cacheKey = `test-cases-${JSON.stringify(params)}`;
    
    // Use cached response if available and recent
    if (shouldUseCache(cacheKey)) {
      return requestCache[cacheKey].response;
    }
    
    // Throttle requests if they're too frequent
    if (isTooFrequent(cacheKey)) {
      // Reduced log frequency - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Request throttled to prevent excessive API calls');
      }
      
      // Return cached response if available, even if expired
      if (requestCache[cacheKey]) {
        return requestCache[cacheKey].response;
      }
      
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        totalPages: 0
      };
    }
    
    try {
      const response = await axiosInstance.get<SearchResponse<any>>('/search/test-cases', { params });
      
      // Cache the successful response
      cacheResponse(cacheKey, response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error searching test cases:', error);
      
      // If we have a cached response, use it as fallback
      if (requestCache[cacheKey]) {
        return requestCache[cacheKey].response;
      }
      
      // Return empty results instead of throwing
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        totalPages: 0
      };
    }
  }
}; 