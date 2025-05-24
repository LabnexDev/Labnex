import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProject, type Project, type CreateProjectData } from '../../api/projects';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID'));
      }
      return getProject(id);
    },
    enabled: !!id && id !== "undefined",
  });

  const { mutate, isPending } = useMutation<Project, Error, CreateProjectData>({
    mutationFn: (data) => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID for update'));
      }
      return updateProject(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      if (id && id !== "undefined") {
        navigate(`/projects/${id}`);
      } else {
        navigate('/dashboard');
      }
    },
    onError: () => {
      setError('Failed to update project');
    },
  });

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!project || !project.projectCode) {
      setError('Project data is incomplete, cannot update.');
      return;
    }

    mutate({ name, description, projectCode: project.projectCode });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            placeholder="Enter project name"
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
            placeholder="Enter project description"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (id && id !== "undefined") {
                navigate(`/projects/${id}`);
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
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 