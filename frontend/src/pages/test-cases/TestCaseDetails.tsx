import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTestCase, updateTestCaseStatus, deleteTestCase, type TestCase } from '../../api/testCases';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage/ErrorMessage';
import { toast } from 'react-hot-toast';
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useEffect } from 'react';

const statusBadgeColors: Record<TestCase['status'], string> = {
  PASSED: 'bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300',
};

const priorityBadgeColors: Record<TestCase['priority'], string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300 font-medium',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300 font-medium',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-600/30 dark:text-blue-300 font-medium',
};

export function TestCaseDetails() {
  const { id: projectId, testCaseId } = useParams<{ id: string; testCaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
      toast.error("Invalid project or test case ID. Redirecting...");
      if (projectId && projectId !== "undefined") {
        navigate(`/projects/${projectId}/test-cases`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [projectId, testCaseId, navigate]);

  const { data: testCase, isLoading, error } = useQuery<TestCase>({
    queryKey: ['testCase', projectId, testCaseId],
    queryFn: () => {
      if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
        return Promise.reject(new Error('Invalid project or test case ID'));
      }
      return getTestCase(projectId, testCaseId);
    },
    enabled: !!projectId && projectId !== "undefined" && !!testCaseId && testCaseId !== "undefined",
  });

  const updateStatusMutation = useMutation<TestCase, Error, TestCase['status']>({
    mutationFn: (status: TestCase['status']) => {
      if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
        toast.error('Cannot update status: Invalid project or test case ID.');
        return Promise.reject(new Error('Invalid project or test case ID'));
      }
      return updateTestCaseStatus(projectId, testCaseId, status);
    },
    onSuccess: (updatedTC) => {
      queryClient.setQueryData(['testCase', projectId, testCaseId], updatedTC);
      queryClient.invalidateQueries({ queryKey: ['testCases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success(`Test case status updated to ${updatedTC.status}.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  });

  const deleteTestCaseMutation = useMutation<void, Error>({
    mutationFn: () => {
      if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
        toast.error('Cannot delete: Invalid project or test case ID.');
        return Promise.reject(new Error('Invalid project or test case ID'));
      }
      return deleteTestCase(projectId, testCaseId);
    },
    onSuccess: () => {
      toast.success('Test case deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['testCases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      if (projectId && projectId !== "undefined") {
        navigate(`/projects/${projectId}/test-cases`);
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete test case.');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this test case? This action cannot be undone.')) {
      deleteTestCaseMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !testCase) {
    return (
      <ErrorMessage 
        title="Error Loading Test Case" 
        message={error?.message || "Could not find the requested test case. It might have been deleted or the link is incorrect."}
      />
    );
  }

  const detailsList = [
    {
      label: 'Created By',
      value: testCase.createdBy.name,
      icon: UserCircleIcon,
    },
    {
      label: 'Created Date',
      value: new Date(testCase.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }),
      icon: CalendarDaysIcon,
    },
    {
      label: 'Last Updated',
      value: new Date(testCase.updatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }),
      icon: ClockIcon,
    },
    ...(testCase.assignedTo ? [{
      label: 'Assigned To',
      value: testCase.assignedTo.name,
      icon: UserCircleIcon,
    }] : []),
  ];

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <Button
            variant="tertiary"
            onClick={() => {
              if (projectId && projectId !== "undefined") {
                navigate(`/projects/${projectId}/test-cases`);
              } else {
                navigate('/dashboard');
              }
            }}
            leftIcon={<ArrowUturnLeftIcon className="h-5 w-5" />}
            className="text-sm mb-2 pl-0 p-0 hover:bg-transparent dark:hover:bg-transparent focus:ring-0 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Test Cases
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white break-all">{testCase.title}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={() => {
              if (projectId && projectId !== "undefined" && testCaseId && testCaseId !== "undefined") {
                navigate(`/projects/${projectId}/test-cases/${testCaseId}/edit`);
              } else {
                toast.error("Cannot edit: Invalid project or test case context.");
              }
            }}
            leftIcon={<PencilSquareIcon className="h-5 w-5" />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            leftIcon={<TrashIcon className="h-5 w-5" />}
            isLoading={deleteTestCaseMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {testCase.description && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <InformationCircleIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Description
              </h2>
              <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {testCase.description}
              </div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ListBulletIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Test Steps
            </h2>
            {testCase.steps && testCase.steps.length > 0 ? (
              <ol className="space-y-3 pl-1">
                {testCase.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-3 mt-0.5 flex-shrink-0 h-6 w-6 rounded-full bg-blue-500 dark:bg-blue-400 text-white dark:text-gray-900 text-sm flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap pt-0.5">
                        {step}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No steps defined for this test case.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Expected Result
            </h2>
            <div className="prose prose-sm sm:prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {testCase.expectedResult || "No expected result defined."}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TagIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Status & Priority
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${statusBadgeColors[testCase.status] || 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}
                  `}
                >
                  {testCase.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                <span
                    className={`px-3 py-1 rounded-full text-sm ${priorityBadgeColors[testCase.priority] || 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}
                    `}
                >
                  {testCase.priority}
                </span>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Status:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={testCase.status === 'PASSED' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatusMutation.mutate('PASSED')}
                    isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'PASSED'}
                    leftIcon={<CheckCircleIcon className="h-4 w-4"/>}
                  >
                    Pass
                  </Button>
                  <Button
                    variant={testCase.status === 'FAILED' ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatusMutation.mutate('FAILED')}
                    isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'FAILED'}
                    leftIcon={<XCircleIcon className="h-4 w-4"/>}
                  >
                    Fail
                  </Button>
                  <Button
                    variant={testCase.status === 'PENDING' ? 'tertiary' : 'secondary'}
                    size="sm"
                    onClick={() => updateStatusMutation.mutate('PENDING')}
                    isLoading={updateStatusMutation.isPending && updateStatusMutation.variables === 'PENDING'}
                    leftIcon={<ExclamationTriangleIcon className="h-4 w-4"/>}
                  >
                    Pending
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <InformationCircleIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400"/> Details
            </h2>
            <dl className="space-y-3 text-sm">
              {detailsList.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <dt className="flex items-center font-medium text-gray-600 dark:text-gray-400">
                    <item.icon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400/80 flex-shrink-0" />
                    {item.label}:
                  </dt>
                  <dd className="text-gray-800 dark:text-gray-200 text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
} 