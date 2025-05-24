import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasksForProject, createTask, updateTask, deleteTask, TaskStatus, TaskPriority } from '../../api/tasks';
import type { ITask, CreateTaskPayload, UpdateTaskPayload } from '../../api/tasks';
import { getProject } from '../../api/projects';
import type { Project as IProject } from '../../api/projects';
import { getTestCases, type TestCase as ITestCase } from '../../api/testCases';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const getStatusClass = (status: TaskStatus): string => {
    if (status === TaskStatus.DONE) return 'bg-green-500 hover:bg-green-400';
    if (status === TaskStatus.IN_PROGRESS) return 'bg-yellow-500 hover:bg-yellow-400';
    if (status === TaskStatus.BLOCKED) return 'bg-red-600 hover:bg-red-500';
    if (status === TaskStatus.IN_REVIEW) return 'bg-purple-500 hover:bg-purple-400';
    if (status === TaskStatus.CANCELLED) return 'bg-slate-500 hover:bg-slate-400';
    return 'bg-sky-600 hover:bg-sky-500';
};

const getPriorityClass = (priority: TaskPriority): string => {
    if (priority === TaskPriority.HIGH) return 'bg-red-500 hover:bg-red-400';
    if (priority === TaskPriority.MEDIUM) return 'bg-orange-400 hover:bg-orange-300';
    return 'bg-sky-500 hover:bg-sky-400';
};

const initialTaskFormData: CreateTaskPayload | UpdateTaskPayload = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    assignedTo: undefined,
    testCases: [],
    dueDate: '',
};

const TasksPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentTask, setCurrentTask] = useState<ITask | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null);
    const [taskFormData, setTaskFormData] = useState<CreateTaskPayload | UpdateTaskPayload>(initialTaskFormData);

    const { data: tasks, isLoading: isLoadingTasks, isError: isErrorTasks, error: errorTasksResponse } = useQuery<ITask[], Error>({
        queryKey: ['tasks', projectId],
        queryFn: () => getTasksForProject(projectId!),
        enabled: !!projectId,
    });

    const { data: projectData, isLoading: isLoadingProject, isError: isErrorProject, error: errorProjectResponse } = useQuery<IProject, Error>({
        queryKey: ['project', projectId],
        queryFn: () => getProject(projectId!),
        enabled: !!projectId,
    });

    const { data: projectTestCases, isLoading: isLoadingTestCases, isError: isErrorTestCases, error: errorTestCasesResponse } = useQuery<ITestCase[], Error>({
        queryKey: ['projectTestCases', projectId],
        queryFn: () => getTestCases(projectId!),
        enabled: !!projectId,
    });

    const createTaskMutation = useMutation<ITask, Error, CreateTaskPayload>({
        mutationFn: (newTaskData: CreateTaskPayload) => createTask(projectId!, newTaskData),
        onSuccess: (data: ITask) => {
            const successMessage = data.taskReferenceId
                ? `Task "${data.title}" (${data.taskReferenceId}) created successfully!`
                : `Task "${data.title}" created successfully!`;
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            setIsModalOpen(false);
        },
        onError: (err: Error) => {
            toast.error(`Failed to create task: ${err.message}`);
        },
    });

    const updateTaskMutation = useMutation<ITask, Error, { taskId: string; data: UpdateTaskPayload }>({
        mutationFn: ({ taskId, data }) => updateTask(projectId!, taskId, data),
        onSuccess: (data: ITask) => {
            toast.success(`Task "${data.title}" updated successfully!`);
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['task', projectId, data._id] });
            setIsModalOpen(false);
        },
        onError: (err: Error) => {
            toast.error(`Failed to update task: ${err.message}`);
        },
    });

    const { mutate: deleteTaskMutate, isPending: isDeletingTask } = useMutation({
        mutationFn: ({ projId, taskId }: { projId: string; taskId: string }) => deleteTask(projId, taskId),
        onSuccess: () => {
            toast.success('Task deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete task.');
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        },
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'select-multiple') {
            const selectedOptions = (e.target as HTMLSelectElement).selectedOptions;
            const values = Array.from(selectedOptions).map(option => option.value);
            setTaskFormData(prev => ({ ...prev, [name]: values }));
        } else {
            setTaskFormData(prev => ({ 
                ...prev, 
                [name]: value === '' && (name === 'assignedTo' || name === 'dueDate') ? undefined : value 
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.title || !taskFormData.title.trim()) {
            toast.error('Title is required.');
            return;
        }
        
        const payload = {
            ...taskFormData,
            assignedTo: taskFormData.assignedTo || undefined,
            dueDate: taskFormData.dueDate || undefined,
            testCases: taskFormData.testCases || [],
        };

        if (modalMode === 'create') {
            createTaskMutation.mutate(payload as CreateTaskPayload);
        } else if (currentTask?._id) {
            updateTaskMutation.mutate({ taskId: currentTask._id, data: payload as UpdateTaskPayload });
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCurrentTask(null);
        setTaskFormData(initialTaskFormData);
        setIsModalOpen(true);
    };

    const openEditModal = (task: ITask) => {
        setModalMode('edit');
        setCurrentTask(task);
        setTaskFormData({
            title: task.title,
            description: task.description || '',
            assignedTo: task.assignedTo?.id,
            priority: task.priority,
            status: task.status,
            testCases: task.testCases?.map(tc => tc._id) || [],
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (task: ITask) => {
        setTaskToDelete(task);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (taskToDelete && projectId) {
            deleteTaskMutate({ projId: projectId, taskId: taskToDelete._id });
        }
    };

    if (isLoadingTasks || isLoadingProject || isLoadingTestCases) return (
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100 flex flex-col justify-center items-center">
            <svg className="animate-spin h-12 w-12 text-blue-400 mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-200 text-xl font-semibold">Loading Project Tasks...</p>
            <p className="text-slate-400 text-sm">Hang tight, we're getting everything ready!</p>
        </div>
    );

    const renderErrorState = (title: string, message: string, details?: string) => (
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100 flex flex-col justify-center items-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-semibold text-red-300 mb-2">{title}</h2>
            <p className="text-slate-300 text-center">{message}</p>
            {details && <p className="text-xs text-slate-500 mt-2">Details: {details}</p>}
        </div>
    );

    if (isErrorTasks) return renderErrorState("Error Loading Tasks", "Could not fetch tasks for this project. Please try again later.", errorTasksResponse?.message);
    if (isErrorProject) return renderErrorState("Error Loading Project Details", "Could not fetch project information. Please try again.", errorProjectResponse?.message);
    if (isErrorTestCases) return renderErrorState("Error Loading Test Cases", "There was an issue fetching test case details for this project. Please try refreshing the page.", errorTestCasesResponse?.message);

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300">
                    {projectData?.name ? `Tasks: ${projectData.name}` : 'Project Tasks'}
                </h1>
                <Button 
                    onClick={openCreateModal}
                    variant="primary"
                    className="shadow-md hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                >
                    <PlusIcon className="h-5 w-5 mr-1.5" /> Create New Task
                </Button>
            </div>

            {tasks && tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                    {tasks.map(task => (
                        <div 
                            key={task._id} 
                            className="bg-slate-800/70 backdrop-blur-md border border-slate-700/80 p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/40 focus-within:shadow-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/70 transition-all duration-300 ease-in-out flex flex-col justify-between group relative cursor-pointer"
                            onClick={() => !isModalOpen && !isDeleteModalOpen && openEditModal(task)}
                        >
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-full overflow-hidden">
                                        {task.taskReferenceId && (
                                            <span className="block text-xs font-mono text-slate-400 mb-0.5 bg-slate-700/50 px-1.5 py-0.5 rounded-sm inline-block">
                                                {task.taskReferenceId}
                                            </span>
                                        )}
                                        <h2 
                                            className="text-lg sm:text-xl font-semibold text-blue-300 group-hover:text-blue-200 transition-colors duration-150 truncate pr-2"
                                            title={task.title}
                                        >
                                            {task.title}
                                        </h2>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center space-x-1.5">
                                        <span className={`px-2.5 py-1 rounded-full text-[0.68rem] leading-tight font-medium text-white shadow-sm transition-colors duration-150 ${getStatusClass(task.status)}`}>{task.status.replace('_', ' ')}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-[0.68rem] leading-tight font-medium text-white shadow-sm transition-colors duration-150 ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                                    </div>
                                </div>
                                <p className="text-slate-300/80 mb-4 text-sm min-h-[40px] overflow-hidden line-clamp-2 leading-relaxed group-hover:text-slate-200 transition-colors duration-150">{task.description || 'No description provided.'}</p>
                                
                                <div className="space-y-1.5 text-xs text-slate-400/90 mb-4 border-t border-slate-700/80 pt-3 mt-3">
                                    {task.assignedTo && (
                                        <p><span className="font-semibold text-slate-500">Assigned:</span> {task.assignedTo.name}</p>
                                    )}
                                    <p><span className="font-semibold text-slate-500">Reporter:</span> {task.createdBy.name}</p>
                                    {task.dueDate && (
                                        <p><span className="font-semibold text-slate-500">Due:</span> {new Date(task.dueDate).toLocaleDateString()}</p>
                                    )}
                                </div>

                                {task.testCases && task.testCases.length > 0 && (
                                    <div className="mt-auto pt-3 border-t border-slate-700/80">
                                        <p className="text-xs text-slate-500 mb-1.5 font-semibold">Related Test Cases:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {task.testCases.slice(0, 2).map(tc => (
                                                <span key={tc._id} className="px-2 py-1 text-[0.7rem] bg-slate-700 hover:bg-slate-600/70 text-blue-300 transition-colors duration-150 rounded-md truncate cursor-default shadow-sm" title={tc.title}>{tc.title}</span>
                                            ))}
                                            {task.testCases.length > 2 && (
                                                 <span className="px-2 py-1 text-[0.7rem] bg-slate-600 text-blue-200 rounded-md cursor-default shadow-sm">+ {task.testCases.length - 2} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-700/80 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                    variant="secondary"
                                    size="sm"
                                    className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                    aria-label={`Edit task ${task.title}`}
                                >
                                    <PencilIcon className="h-4 w-4" /> <span className="ml-1.5 hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(task); }}
                                    variant="danger"
                                    size="sm"
                                    className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                    disabled={isDeletingTask}
                                    aria-label={`Delete task ${task.title}`}
                                >
                                    <TrashIcon className="h-4 w-4" /> <span className="ml-1.5 hidden sm:inline">Delete</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="col-span-full text-center py-12 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/70 shadow-xl mt-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6m-7-10V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-2m0-4h14M5 11V9a2 2 0 012-2h2" />
                    </svg>
                    <p className="text-slate-200 text-xl font-semibold">No tasks found for this project.</p>
                    <p className="text-slate-400/80 mt-1.5 mb-6 text-sm max-w-md mx-auto">Be the first to add a task and get things moving! Click the button below to create one.</p>
                    <Button 
                        onClick={openCreateModal}
                        variant="primary"
                        size="lg"
                        className="shadow-md hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" /> Create First Task
                    </Button>
                </div>
            )}

            {isModalOpen && (
                <Modal title={modalMode === 'create' ? "Create New Task" : "Edit Task"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-6 p-1">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title <span className="text-red-400">*</span></label>
                            <input 
                                type="text" 
                                name="title" 
                                id="title" 
                                value={taskFormData.title}
                                onChange={handleFormChange} 
                                required 
                                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                                placeholder="Enter task title"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea 
                                name="description" 
                                id="description" 
                                rows={4} 
                                value={taskFormData.description || ''}
                                onChange={handleFormChange} 
                                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm min-h-[100px]"
                                placeholder="Provide a detailed description of the task"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                                <select 
                                    name="status" 
                                    id="status" 
                                    value={taskFormData.status} 
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none"
                                >
                                    {Object.values(TaskStatus).map(status => (
                                        <option key={status} value={status} className="bg-slate-800 text-slate-100">{status.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                                <select 
                                    name="priority" 
                                    id="priority" 
                                    value={taskFormData.priority} 
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none"
                                >
                                    {Object.values(TaskPriority).map(priority => (
                                        <option key={priority} value={priority} className="bg-slate-800 text-slate-100">{priority}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
                                <select 
                                    name="assignedTo" 
                                    id="assignedTo" 
                                    value={taskFormData.assignedTo || ''} 
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none"
                                >
                                    <option value="" className="bg-slate-800 text-slate-400">Unassigned</option>
                                    {projectData?.members.map(member => (
                                        <option key={member._id} value={member._id} className="bg-slate-800 text-slate-100">{member.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                                <input 
                                    type="date" 
                                    name="dueDate" 
                                    id="dueDate" 
                                    value={taskFormData.dueDate || ''}
                                    onChange={handleFormChange} 
                                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="testCases" className="block text-sm font-medium text-slate-300 mb-1">Link Test Cases</label>
                            <select 
                                multiple 
                                name="testCases" 
                                id="testCases" 
                                value={taskFormData.testCases || []} 
                                onChange={handleFormChange}
                                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm min-h-[120px]"
                            >
                                {projectTestCases && projectTestCases.length > 0 ? (
                                    projectTestCases.map(tc => (
                                        <option key={tc._id} value={tc._id} className="p-1.5 hover:bg-blue-500/20 bg-slate-800 text-slate-100">{tc.title}</option>
                                    ))
                                ) : (
                                    <option value="" disabled className="italic text-slate-500">No test cases available in this project</option>
                                )}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple test cases.</p>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-5">
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" isLoading={createTaskMutation.isPending || updateTaskMutation.isPending} className="px-5">
                                {modalMode === 'create' ? 'Create Task' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {isDeleteModalOpen && taskToDelete && (
                <Modal 
                    title="Confirm Deletion" 
                    isOpen={isDeleteModalOpen} 
                    onClose={() => setIsDeleteModalOpen(false)}
                    size="md"
                >
                    <div className="p-1">
                        <p className="text-slate-300 mb-1">Are you sure you want to delete the task:</p>
                        <p className="text-xl font-semibold text-blue-300 mb-6 truncate">{taskToDelete.title}</p>
                        <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="px-5">
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeletingTask} className="px-5">
                                Delete Task
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TasksPage; 