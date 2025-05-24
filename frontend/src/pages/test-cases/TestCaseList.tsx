import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSearch } from '../../hooks/useSearch';
import { getProject } from '../../api/projects';
import { SearchBar } from '../../components/common/SearchBar/SearchBar';
import { Filter } from '../../components/common/Filter/Filter';
import { TestCaseCard } from '../../components/test-cases/TestCaseCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import { Button } from '../../components/common/Button';
import { PlusIcon, ArrowUturnLeftIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { TestCase } from '../../api/testCases';
import { toast } from 'react-hot-toast';

const sortOptions = [
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

// Filter options for status - ensure these values match backend expectations
const statusFilterOptions = [
  { value: 'ALL', label: 'All Statuses' }, // Added ALL option
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
  // Add other relevant statuses like 'BLOCKED', 'SKIPPED' if they exist in your system
];

export function TestCaseList() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  console.log('TestCaseList.tsx - projectId for useSearch:', projectId);

  // Fetch project details for the name
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => {
      if (!projectId || projectId === "undefined") { // Guard
        return Promise.reject(new Error('Invalid project ID'));
      }
      return getProject(projectId);
    },
    enabled: !!projectId && projectId !== "undefined", // Corrected
    staleTime: Infinity, // Project name doesn't change often
  });

  const {
    data,
    isLoading,
    error,
    params,
    updateParams,
    setPage,
    clearSearch
  } = useSearch({
    type: 'testCases',
    initialParams: {
      projectId,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      status: undefined,
      page: 1,
      limit: 9,
    }
  });

  useEffect(() => {
    return () => {
      // Optional: Decide if search should clear on unmount
    };
  }, [clearSearch, queryClient]);

  // Effect to redirect if projectId is invalid after initial checks
  useEffect(() => {
    if (!projectId || projectId === "undefined") {
      toast.error("Invalid project context. Redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  const handleSearch = (query: string) => updateParams({ query, page: 1 });
  const handleSortChange = (sortBy: string) => updateParams({ sortBy, page: 1 });
  const handleStatusChange = (status: string) => updateParams({ status: status === 'ALL' ? undefined : status, page: 1 });

  if (isLoading && (!data || !data.data || data.data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error.message || "Failed to load test cases. Please check your connection or try again later."} title="Error Loading Test Cases" />;
  }

  const testCases = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = params.page || 1;

  const pageTitle = project ? `Test Cases for ${project.name}` : 'Test Cases';

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <div>
            <Button
                variant="tertiary"
                onClick={() => {
                  if (projectId && projectId !== "undefined") {
                    navigate(`/projects/${projectId}`);
                  } else {
                    navigate('/dashboard'); // Fallback
                  }
                }}
                leftIcon={<ArrowUturnLeftIcon className="h-5 w-5" />}
                className="text-sm mb-2 p-0 hover:bg-transparent dark:hover:bg-transparent focus:ring-0 text-blue-600 dark:text-blue-400 hover:underline"
            >
                Back to Project Details
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            if (projectId && projectId !== "undefined") {
              navigate(`/projects/${projectId}/test-cases/new`);
            } else {
              toast.error("Cannot add test case: Invalid project context.");
            }
          }}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Add New Test Case
        </Button>
      </div>

      <div className="card p-4 sm:p-6 relative">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="w-full sm:max-w-xs">
            <SearchBar
              placeholder="Search by title, description..."
              onSearch={handleSearch}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Filter
              label="Sort by"
              options={sortOptions}
              value={params.sortBy || 'updatedAt'}
              onChange={handleSortChange}
              className="w-full sm:w-auto"
            />
            <Filter
              label="Status"
              options={statusFilterOptions}
              value={params.status || 'ALL'}
              onChange={handleStatusChange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {isLoading && data && data.data && data.data.length > 0 && (
            <div className="absolute top-4 right-4 z-10 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-full shadow">
                <LoadingSpinner size="sm" />
            </div>
        )}

        {testCases.length === 0 && !isLoading ? (
          <div className="text-center py-10 sm:py-16 card border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
            <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">No Test Cases Found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {params.query ? `No test cases matched your search for "${params.query}".` : (params.status && params.status !=='ALL') ? `No test cases found with status "${params.status}".` : 'Get started by adding a new test case.'}
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => {
                  if (projectId && projectId !== "undefined") {
                    navigate(`/projects/${projectId}/test-cases/new`);
                  } else {
                    toast.error("Cannot add test case: Invalid project context.");
                  }
                }}
                leftIcon={<PlusIcon className="h-5 w-5" />}
              >
                Add New Test Case
              </Button>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${isLoading && data && data.data && data.data.length > 0 ? 'opacity-70' : ''}`}>
            {testCases.map((testCase: TestCase) => (
              <TestCaseCard key={testCase._id} testCase={testCase} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
                onClick={() => setPage(currentPage - 1)} 
                disabled={currentPage === 1 || isLoading}
                variant="secondary"
                size="sm"
            >Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => setPage(page)}
                variant={page === currentPage ? 'primary' : 'secondary'}
                size="sm"
                disabled={isLoading}
                className="min-w-[36px]"
              >
                {page}
              </Button>
            ))}
            <Button 
                onClick={() => setPage(currentPage + 1)} 
                disabled={currentPage === totalPages || isLoading}
                variant="secondary"
                size="sm"
            >Next</Button>
          </div>
        )}
      </div>
    </div>
  );
} 