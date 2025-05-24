import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTestCase, updateTestCase, type TestCase, type CreateTestCaseData } from '../../api/testCases';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export function EditTestCase() {
  const { id: projectId, testCaseId } = useParams<{ id: string; testCaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [expectedResult, setExpectedResult] = useState('');
  const [priority, setPriority] = useState<CreateTestCaseData['priority']>('MEDIUM');
  const [error, setError] = useState('');

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

  const { data: testCase, isLoading } = useQuery<TestCase>({
    queryKey: ['testCase', projectId, testCaseId],
    queryFn: () => {
      if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
        return Promise.reject(new Error('Invalid project or test case ID'));
      }
      return getTestCase(projectId, testCaseId);
    },
    enabled: !!projectId && projectId !== "undefined" && !!testCaseId && testCaseId !== "undefined",
  });

  const { mutate, isPending } = useMutation<TestCase, Error, CreateTestCaseData>({
    mutationFn: (data) => {
      if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
        toast.error("Cannot update test case: Invalid ID(s).");
        return Promise.reject(new Error('Invalid project or test case ID'));
      }
      return updateTestCase(projectId, testCaseId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCase', projectId, testCaseId] });
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      toast.success('Test Case updated successfully!');
      if (projectId && projectId !== "undefined" && testCaseId && testCaseId !== "undefined") {
        navigate(`/projects/${projectId}/test-cases/${testCaseId}`);
      } else if (projectId && projectId !== "undefined") {
        navigate(`/projects/${projectId}/test-cases`);
      } else {
        navigate('/dashboard');
      }
    },
    onError: () => {
      setError('Failed to update test case');
    },
  });

  useEffect(() => {
    if (testCase) {
      setTitle(testCase.title);
      setDescription(testCase.description);
      setSteps(testCase.steps);
      setExpectedResult(testCase.expectedResult);
      setPriority(testCase.priority);
    }
  }, [testCase]);

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (steps.some(step => !step.trim())) {
      setError('All steps must be filled');
      return;
    }

    if (!expectedResult.trim()) {
      setError('Expected result is required');
      return;
    }

    mutate({
      title,
      description,
      steps: steps.filter(step => step.trim()),
      expectedResult,
      priority,
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined") {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Test Case</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder="Enter test case title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full h-32 resize-none"
            placeholder="Enter test case description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Test Steps
          </label>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  className="input flex-1"
                  placeholder={`Step ${index + 1}`}
                  required
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddStep}
              className="btn btn-secondary w-full"
            >
              Add Step
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="expectedResult" className="block text-sm font-medium text-gray-300 mb-2">
            Expected Result
          </label>
          <textarea
            id="expectedResult"
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
            className="input w-full h-32 resize-none"
            placeholder="Enter expected result"
            required
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as CreateTestCaseData['priority'])}
            className="input w-full"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (projectId && projectId !== "undefined" && testCaseId && testCaseId !== "undefined") {
                navigate(`/projects/${projectId}/test-cases/${testCaseId}`);
              } else if (projectId && projectId !== "undefined") {
                navigate(`/projects/${projectId}/test-cases`);
              } else {
                navigate('/dashboard');
              }
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || isLoading || !projectId || projectId === "undefined" || !testCaseId || testCaseId === "undefined"}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 