import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, deleteProject, updateProject, type Project } from '../../api/projects';
import { getUserRole } from '../../api/roles';
import { TeamManagement } from '../../components/projects/TeamManagement';
import { RoleType } from '../../types/role';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { PencilIcon, TrashIcon, PlusCircleIcon, DocumentTextIcon, UsersIcon, CalendarDaysIcon, ClockIcon, InformationCircleIcon, PowerIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, disabled, label }) => {
  return (
    <div className="flex items-center">
      {label && <label htmlFor={id} className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</label>}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
          checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id || id === "undefined") {
      toast.error("Invalid project ID in URL. Redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [id, navigate]);

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID'));
      }
      return getProject(id);
    },
    enabled: !!id && id !== "undefined",
    retry: 1,
  });

  const { data: userRole, isLoading: isRoleLoading } = useQuery({
    queryKey: ['userRole', id],
    queryFn: () => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID for userRole'));
      }
      return getUserRole(id);
    },
    enabled: !!id && id !== "undefined" && !!project,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (updatedData: Partial<Project> & { isActive?: boolean }) => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID for update'));
      }
      const payload = {
        name: project?.name,
        description: project?.description,
        ...updatedData,
      };
      return updateProject(id, payload);
    },
    onSuccess: (data) => {
      toast.success(`Project "${data.name}" status updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update project status.');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => {
      if (!id || id === "undefined") {
        return Promise.reject(new Error('Invalid project ID for deletion'));
      }
      return deleteProject(id);
    },
    onSuccess: () => {
      toast.success(`Project "${project?.name || 'Unknown'}" deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project.');
    }
  });

  const handleDeleteProject = () => {
    if (window.confirm(`Are you sure you want to delete the project \"${project?.name}\"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate();
    }
  };

  const canManageProject = userRole?.type === RoleType.PROJECT_OWNER;

  const handleStatusChange = (newIsActive: boolean) => {
    if (!project) return;
    updateProjectMutation.mutate({ isActive: newIsActive });
  };

  if (isProjectLoading || (id && project && isRoleLoading)) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="card text-center p-12">
        <InformationCircleIcon className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We couldn't find the project you were looking for. It might have been deleted or the ID is incorrect.
        </p>
        <Button variant="primary" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-md text-gray-600 dark:text-gray-400 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {canManageProject && (
            <Button variant="secondary" onClick={() => {
              if (id && id !== "undefined") navigate(`/projects/${id}/edit`);
              else toast.error("Cannot edit: Invalid project context.");
            }} leftIcon={<PencilIcon className="h-5 w-5"/>} className="w-full sm:w-auto">
              Edit Project
            </Button>
          )}
          <Button variant="primary" onClick={() => {
            if (id && id !== "undefined") navigate(`/projects/${id}/test-cases/new`);
            else toast.error("Cannot add test case: Invalid project context.");
          }} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="w-full sm:w-auto">
            Add Test Case
          </Button>
          <Button variant="secondary" onClick={() => {
            if (id && id !== "undefined") navigate(`/projects/${id}/tasks`);
            else toast.error("Cannot view tasks: Invalid project context.");
          }} leftIcon={<ListBulletIcon className="h-5 w-5"/>} className="w-full sm:w-auto">
            View Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Project Overview
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1.5" /> Created Date
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5" /> Last Updated
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(project.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-1.5" /> Project ID
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block">
                  {project._id}
                </dd>
              </div>
              {project.projectCode && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1.5" /> Project Code
                  </dt>
                  <dd className="mt-1 text-gray-900 dark:text-white font-mono text-sm bg-blue-100 dark:bg-blue-700/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded inline-block">
                    {project.projectCode}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1.5" /> Project Owner
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{project.owner.name} ({project.owner.email})</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <PowerIcon className="h-4 w-4 mr-1.5" /> Active Status
                </dt>
                <dd className="mt-1 flex items-center">
                  {canManageProject ? (
                    <ToggleSwitch
                      id={`project-status-toggle-${project._id}`}
                      checked={project.isActive}
                      onChange={handleStatusChange}
                      disabled={updateProjectMutation.isPending}
                    />
                  ) : (
                    <span className={`px-2 py-0.5 inline-block text-xs font-semibold rounded-full ${project.isActive ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                  <span className={`ml-2 text-xs font-semibold ${project.isActive ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    ({project.isActive ? 'Active' : 'Inactive'})
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Test Cases ({project.testCaseCount || 0})
                </h2>
                <Button variant="secondary" size="sm" onClick={() => {
                  console.log('ProjectDetails.tsx - Navigating to test cases with id:', id);
                  if (id && id !== "undefined") navigate(`/projects/${id}/test-cases`);
                  else toast.error("Cannot view test cases: Invalid project context.");
                }}>
                    View All Test Cases
                </Button>
            </div>
            {project.recentTestCases && project.recentTestCases.length > 0 ? (
              <ul className="space-y-3 mt-4">
                {project.recentTestCases.map((tc) => (
                  <li key={tc._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        {tc.taskReferenceId && (
                          <span className="mr-2 text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded">
                            {tc.taskReferenceId}
                          </span>
                        )}
                        <Link to={`/projects/${id}/test-cases/${tc._id}`} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate align-middle" title={tc.name}>
                          {tc.name}
                        </Link>
                      </div>
                      <span className={`px-2 py-0.5 inline-block text-xs font-semibold rounded-full ${ 
                        tc.status === 'pass' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 
                        tc.status === 'fail' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' 
                      }`}>
                        {tc.status.charAt(0).toUpperCase() + tc.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last updated: {new Date(tc.updatedAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">No test cases yet. Start by adding one!</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <UsersIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" /> Team Management
            </h2>
            <TeamManagement
              projectId={project._id}
              userRole={userRole?.type || RoleType.VIEWER} 
            />
          </section>
          
          {canManageProject && (
             <section className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrashIcon className="h-6 w-6 mr-2 text-red-500 dark:text-red-400" /> Delete Project
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete this project and all its associated data, including test cases. This action cannot be undone.
                </p>
                <Button variant="danger" onClick={handleDeleteProject} isLoading={deleteProjectMutation.isPending} className="w-full">
                    Delete This Project
                </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}; 