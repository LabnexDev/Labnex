import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getMyAssignedTasks, TaskStatus, TaskPriority, type ITask } from '../../api/tasks';
import { getProjects, type Project as IProject } from '../../api/projects';
import { Button } from '../../components/common/Button';
import { EyeIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon, XCircleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Updated helper functions from TasksPage.tsx for consistency
const getStatusClass = (status: TaskStatus): string => {
    if (status === TaskStatus.DONE) return 'bg-green-500 hover:bg-green-400';
    if (status === TaskStatus.IN_PROGRESS) return 'bg-yellow-500 hover:bg-yellow-400';
    if (status === TaskStatus.BLOCKED) return 'bg-red-600 hover:bg-red-500';
    if (status === TaskStatus.IN_REVIEW) return 'bg-purple-500 hover:bg-purple-400';
    if (status === TaskStatus.CANCELLED) return 'bg-slate-500 hover:bg-slate-400';
    return 'bg-sky-600 hover:bg-sky-500'; // Sky for TODO
};

const getPriorityClass = (priority: TaskPriority): string => {
    if (priority === TaskPriority.HIGH) return 'bg-red-500 hover:bg-red-400';
    if (priority === TaskPriority.MEDIUM) return 'bg-orange-400 hover:bg-orange-300';
    return 'bg-sky-500 hover:bg-sky-400'; // Sky for LOW
};

const MyTasksPage: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<Record<string, string | undefined>>({});
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { data: tasksData, isLoading, isError, error, isFetching } = useQuery<{tasks: ITask[], total: number}, Error>({
        queryKey: ['myAssignedTasks', filters, sortBy, sortOrder],
        queryFn: async () => {
            // Assuming getMyAssignedTasks returns { tasks: ITask[], total: number }
            // If it only returns ITask[], you might need to adjust this or the backend
            const result = await getMyAssignedTasks(filters as Record<string,string>, sortBy, sortOrder);
            // Ensure result is in the expected shape, or adapt
            if (Array.isArray(result)) { // If API returns array directly
                return { tasks: result, total: result.length }; // Or fetch total count separately if available
            }
            return result as {tasks: ITask[], total: number}; // Assuming API returns object with tasks and total
        },
        placeholderData: keepPreviousData,
    });
    const tasks = tasksData?.tasks;

    const { data: projects, isLoading: isLoadingProjects } = useQuery<IProject[], Error>({
        queryKey: ['projectsListForFilter'],
        queryFn: () => getProjects(), // Assuming this fetches all projects for filter
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value === '' ? undefined : value,
        }));
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const clearFilters = () => {
        setFilters({});
        // Reset select elements visually if they are not controlled by state directly
        const projectFilter = document.getElementById('filter-project') as HTMLSelectElement;
        const statusFilter = document.getElementById('filter-status') as HTMLSelectElement;
        const priorityFilter = document.getElementById('filter-priority') as HTMLSelectElement;
        if(projectFilter) projectFilter.value = '';
        if(statusFilter) statusFilter.value = '';
        if(priorityFilter) priorityFilter.value = '';
        toast.success("Filters cleared", {id: 'filters-cleared'});
    };

    if (isLoading && !isFetching) return (
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100 flex flex-col justify-center items-center">
            <svg className="animate-spin h-12 w-12 text-blue-400 mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-200 text-xl font-semibold">Loading Your Tasks...</p>
            <p className="text-slate-400 text-sm">Fetching your assigned tasks, please wait.</p>
        </div>
    );
    if (isError) return (
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100 flex flex-col justify-center items-center">
            <XCircleIcon className="h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-semibold text-red-300 mb-2">Error Loading Tasks</h2>
            <p className="text-slate-300 text-center">Could not fetch your assigned tasks. Please try again later.</p>
            {error?.message && <p className="text-xs text-slate-500 mt-2">Details: {error.message}</p>}
        </div>
    );

    const commonSelectClasses = "w-full p-2.5 bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none text-sm";

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 min-h-screen text-slate-100">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500">
                    My Assigned Tasks
                </h1>
            </div>

            {/* Filters and Sorting Section */}
            <div className="mb-8 p-4 sm:p-5 bg-slate-800/60 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="filter-project" className="block text-sm font-medium text-slate-300 mb-1.5">Project</label>
                        <select id="filter-project" name="projectId" onChange={handleFilterChange} value={filters.projectId || ''} className={commonSelectClasses} disabled={isLoadingProjects}>
                            <option value="" className="bg-slate-800 text-slate-400">All Projects</option>
                            {projects?.map(p => <option key={p._id} value={p._id} className="bg-slate-800 text-slate-100">{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-status" className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                        <select id="filter-status" name="status" onChange={handleFilterChange} value={filters.status || ''} className={commonSelectClasses}>
                            <option value="" className="bg-slate-800 text-slate-400">All Statuses</option>
                            {Object.values(TaskStatus).map(s => <option key={s} value={s} className="bg-slate-800 text-slate-100">{s.replace('_',' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-priority" className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                        <select id="filter-priority" name="priority" onChange={handleFilterChange} value={filters.priority || ''} className={commonSelectClasses}>
                            <option value="" className="bg-slate-800 text-slate-400">All Priorities</option>
                            {Object.values(TaskPriority).map(p => <option key={p} value={p} className="bg-slate-800 text-slate-100">{p}</option>)}
                        </select>
                    </div>
                    <Button onClick={clearFilters} variant="secondary" className="h-10 w-full lg:w-auto shadow-sm hover:shadow-md focus:ring-offset-slate-800">
                        <XCircleIcon className="h-5 w-5 mr-1.5"/> Clear Filters
                    </Button>
                </div>
                
                <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 items-center border-t border-slate-700/80 pt-4">
                    <span className="text-sm font-medium text-slate-300 mr-2">Sort by:</span>
                    {[ 'createdAt', 'dueDate', 'priority'].map(field => (
                        <Button 
                            key={field}
                            variant={sortBy === field ? "primary" : "tertiary"} 
                            size="sm" 
                            onClick={() => toggleSort(field)}
                            className={`capitalize ${sortBy === field ? 'shadow-md hover:shadow-blue-500/50' : 'hover:bg-slate-700/70'}`}
                            rightIcon={sortBy === field ? (sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />) : <FunnelIcon className="h-4 w-4 opacity-50"/>}
                        >
                            {field.replace('createdAt', 'Date Created').replace('dueDate', 'Due Date')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Task List/Grid */}
            {isFetching && (
                <div className="p-6 md:p-8 flex flex-col justify-center items-center text-slate-400">
                     <svg className="animate-spin h-8 w-8 text-blue-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Updating task list...</p>
                </div>
            )}
            {!isFetching && tasks && tasks.length > 0 ? (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 ${isFetching ? 'opacity-50' : ''}`}>
                    {tasks.map((task: ITask) => (
                        <div 
                            key={task._id} 
                            className="bg-slate-800/70 backdrop-blur-md border border-slate-700/80 p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/40 focus-within:shadow-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/70 transition-all duration-300 ease-in-out flex flex-col justify-between group relative cursor-pointer"
                            onClick={() => navigate(`/projects/${typeof task.project === 'object' ? task.project._id : task.project}/tasks`)} // Navigate to project tasks page, not individual task edit
                            title={`View tasks for project: ${typeof task.project === 'object' ? task.project.name : 'N/A'}`}
                        >
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 
                                        className="text-lg sm:text-xl font-semibold text-blue-300 group-hover:text-blue-200 transition-colors duration-150 truncate pr-2"
                                    >
                                        {task.title}
                                    </h2>
                                    <div className="flex-shrink-0 flex items-center space-x-1.5">
                                        <span className={`px-2.5 py-1 rounded-full text-[0.68rem] leading-tight font-medium text-white shadow-sm transition-colors duration-150 ${getStatusClass(task.status)}`}>{task.status.replace('_', ' ')}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-[0.68rem] leading-tight font-medium text-white shadow-sm transition-colors duration-150 ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                                    </div>
                                </div>
                                <Link 
                                    to={`/projects/${typeof task.project === 'object' ? task.project._id : task.project}`}
                                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking project link
                                    className="text-xs text-slate-400 hover:text-sky-400 hover:underline transition-colors duration-150 mb-2 block truncate font-medium"
                                    title={`Go to project: ${typeof task.project === 'object' ? task.project.name : 'N/A'}`}
                                >
                                    Project: {typeof task.project === 'object' ? task.project.name : 'Unknown Project'}
                                </Link>

                                <p className="text-slate-300/80 mb-4 text-sm min-h-[40px] overflow-hidden line-clamp-2 leading-relaxed group-hover:text-slate-200 transition-colors duration-150">{task.description || 'No description provided.'}</p>
                                
                                <div className="space-y-1.5 text-xs text-slate-400/90 mb-4 border-t border-slate-700/80 pt-3 mt-3">
                                    <p><span className="font-semibold text-slate-500">Reporter:</span> {task.createdBy.name}</p>
                                    {task.dueDate && (
                                        <p><span className="font-semibold text-slate-500">Due:</span> {new Date(task.dueDate).toLocaleDateString()}</p>
                                    )}
                                </div>

                                {task.testCases && task.testCases.length > 0 && (
                                    <div className="mt-auto pt-3 border-t border-slate-700/80">
                                        <p className="text-xs text-slate-500 mb-1.5 font-semibold">Related Test Cases:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {task.testCases.slice(0, 2).map((tc: { _id: string; title: string }) => (
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
                                    variant="primary" // Changed to primary for more emphasis as it's the main action on this page per card
                                    size="sm" 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card navigation
                                        navigate(`/projects/${typeof task.project === 'object' ? task.project._id : task.project}/tasks`);
                                    }}
                                    className="focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md hover:shadow-lg hover:shadow-sky-500/50"
                                    leftIcon={<EyeIcon className="h-4 w-4" />}
                                >
                                    View in Project
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !isFetching && (
                    <div className="col-span-full text-center py-12 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/70 shadow-xl mt-8">
                        <DocumentMagnifyingGlassIcon className="h-16 w-16 text-slate-500 mx-auto mb-5" />
                        <p className="text-slate-200 text-xl font-semibold">No tasks assigned to you match the current filters.</p>
                        <p className="text-slate-400/80 mt-1.5 mb-6 text-sm max-w-md mx-auto">Try adjusting your filters or check back later. If you have no tasks, enjoy the quiet moment!</p>
                        <Button onClick={clearFilters} variant="primary" size="lg" className="shadow-md hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                            <XCircleIcon className="h-5 w-5 mr-2"/> Clear All Filters
                        </Button>
                    </div>
                )
            )}
        </div>
    );
};

export default MyTasksPage; 