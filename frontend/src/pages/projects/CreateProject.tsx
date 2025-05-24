import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject, type Project, type CreateProjectData } from '../../api/projects';
import axios from 'axios';

export function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<Project, Error, CreateProjectData>({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      let specificMessage = 'Failed to create project';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        specificMessage = error.response.data.message;
      } else if (error.message) {
        specificMessage = error.message;
      }
      setError(specificMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!projectCode.trim()) {
      setError('Project code is required');
      return;
    }

    if (!/^[a-zA-Z0-9]{3,5}$/.test(projectCode.trim())) {
      setError('Project code must be 3-5 alphanumeric characters.');
      return;
    }

    const projectData: CreateProjectData = {
      name: name.trim(),
      projectCode: projectCode.trim().toUpperCase(),
      ...(description.trim() && { description: description.trim() })
    };

    mutate(projectData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create New Project</h1>

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
          <label htmlFor="projectCode" className="block text-sm font-medium text-gray-300 mb-2">
            Project Code
          </label>
          <input
            id="projectCode"
            type="text"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            className="input w-full"
            placeholder="Enter project code (e.g., PROJ1)"
            required
            minLength={3}
            maxLength={5}
            pattern="^[a-zA-Z0-9]{3,5}$"
          />
          <p className="mt-1 text-xs text-gray-400">3-5 alphanumeric characters. This cannot be changed later.</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description (Optional)
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
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
} 