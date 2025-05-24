import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestCase, type TestCase, type CreateTestCaseData } from '../../api/testCases';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

export function CreateTestCase() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [expectedResult, setExpectedResult] = useState('');
  const [priority, setPriority] = useState<CreateTestCaseData['priority']>('MEDIUM');
  const [formError, setFormError] = useState(''); // For form validation errors

  useEffect(() => {
    if (!projectId || projectId === "undefined") {
      toast.error('Project ID is invalid or missing. Redirecting to dashboard.');
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  const { mutate, isPending } = useMutation<TestCase, Error, CreateTestCaseData>({
    mutationFn: (data) => {
      if (!projectId || projectId === "undefined") {
        toast.error('Cannot create test case: Project ID is invalid or missing.');
        return Promise.reject(new Error('Project ID is invalid or missing'));
      }
      return createTestCase(projectId, data);
    },
    onSuccess: (data) => {
      const successMessage = data.taskReferenceId 
        ? `Test case "${data.title}" (${data.taskReferenceId}) created successfully!`
        : `Test case "${data.title}" created successfully!`;
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['testCases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }); // Invalidate project too for testCaseCount and recentTestCases
      if (projectId && projectId !== "undefined") {
        navigate(`/projects/${projectId}/test-cases`);
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create test case. Please try again.';
      if (errorMessage.includes('E11000') && errorMessage.toLowerCase().includes('title')) {
        toast.error('Test case title already exists in this project. Please use a different name.');
        setFormError('Test case title already exists in this project.'); // Optionally set form error too
      } else {
        toast.error(errorMessage);
        setFormError(''); // Clear any previous form-specific error
      }
    },
  });

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
    setFormError('');

    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }

    if (steps.some(step => !step.trim())) {
      setFormError('All step descriptions are required and cannot be empty.');
      return;
    }
    if (steps.length === 0) {
      setFormError('At least one test step is required.');
      return;
    }

    if (!expectedResult.trim()) {
      setFormError('Expected result is required');
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

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Test Case</h1>
        <Button
          variant="secondary"
          onClick={() => {
            if (projectId && projectId !== "undefined") {
              navigate(`/projects/${projectId}/test-cases`);
            } else {
              navigate('/dashboard');
            }
          }}
          leftIcon={<ArrowUturnLeftIcon className="h-5 w-5" />}
        >
          Back to Test Cases
        </Button>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-md relative" role="alert">
              <strong className="font-bold">Validation Error: </strong>
              <span className="block sm:inline">{formError}</span>
            </div>
          )}

          <Input
            id="title"
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter test case title"
            required
          />

          <Input
            id="description"
            label="Description (Optional)"
            as="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the test case"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Steps
            </label>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">#{index + 1}</span>
                  <Input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    className="flex-1 !mt-0"
                    placeholder={`Describe step ${index + 1}`}
                    required
                    hideLabel
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveStep(index)}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                      aria-label="Remove step"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddStep}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                className="w-full sm:w-auto"
              >
                Add Step
              </Button>
            </div>
          </div>

          <Input
            id="expectedResult"
            label="Expected Result"
            as="textarea"
            rows={4}
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
            placeholder="What is the expected outcome after performing the steps?"
            required
          />
          
          <Input
            id="priority"
            label="Priority"
            as="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as CreateTestCaseData['priority'])}
            required
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Input>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="tertiary"
              onClick={() => {
                if (projectId && projectId !== "undefined") {
                  navigate(`/projects/${projectId}/test-cases`);
                } else {
                  navigate('/dashboard');
                }
              }}
              disabled={isPending || !projectId || projectId === "undefined"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending || !projectId || projectId === "undefined"}
              disabled={isPending || !projectId || projectId === "undefined"}
            >
              {isPending ? 'Creating Test Case...' : 'Create Test Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 