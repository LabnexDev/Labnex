import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSnippets, createSnippet, updateSnippet, deleteSnippet, getAISuggestion } from '../../api/snippets';
import type { ICodeSnippet, CreateSnippetPayload, UpdateSnippetPayload, AISuggestionPayload } from '../../api/snippets';
import { getProjects } from '../../api/projects';
import type { Project } from '../../api/projects';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { LazySyntaxHighlighter } from '../../components/common/LazySyntaxHighlighter';
import { toast } from 'react-hot-toast';
import { PlusCircleIcon, CodeBracketSquareIcon, PencilIcon, TrashIcon, SparklesIcon, InformationCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface SnippetFormData {
    title: string;
    description: string;
    language: string;
    code: string;
    projectId?: string;
}

export const SnippetsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [showSnippetModal, setShowSnippetModal] = useState(false);
    const [snippetToEdit, setSnippetToEdit] = useState<ICodeSnippet | null>(null);
    const [formData, setFormData] = useState<SnippetFormData>({
        title: '',
        description: '',
        language: 'javascript', // Default language
        code: '',
        projectId: undefined,
    });

    // AI Assist State
    const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
    const [currentSnippetForAI, setCurrentSnippetForAI] = useState<ICodeSnippet | null>(null);
    const [aiSuggestion, setAISuggestion] = useState<string | null>(null);
    const [aiAction, setAIAction] = useState<'cleanup' | 'fix_errors' | null>(null);
    const [aiLoading, setAiLoading] = useState(false); // For AI suggestion loading state

    // Delete Confirmation Modal State
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [snippetToDelete, setSnippetToDelete] = useState<ICodeSnippet | null>(null);

    const { data: snippets, isLoading: isLoadingSnippets, error: snippetsError } = useQuery<ICodeSnippet[]>({
        queryKey: ['snippets'],
        queryFn: () => getSnippets(), // Later add projectId filter if needed
    });

    const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
        queryKey: ['projectsListForSnippets'],
        queryFn: getProjects,
    });

    const createSnippetMutation = useMutation({
        mutationFn: createSnippet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            toast.success('Snippet created successfully!');
            setShowSnippetModal(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create snippet.');
        },
    });

    const updateSnippetMutation = useMutation({
        mutationFn: ({ snippetId, payload }: { snippetId: string; payload: UpdateSnippetPayload }) => updateSnippet(snippetId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            toast.success('Snippet updated successfully!');
            setShowSnippetModal(false);
            setSnippetToEdit(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update snippet.');
        },
    });

    const deleteSnippetMutation = useMutation({
        mutationFn: deleteSnippet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snippets'] });
            toast.success('Snippet deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete snippet.');
        },
    });

    const aiSuggestionMutation = useMutation({
        mutationFn: ({ snippetId, payload }: { snippetId: string; payload: AISuggestionPayload }) => getAISuggestion(snippetId, payload),
        onSuccess: (data) => {
            setAISuggestion(data.suggestion);
            setShowAISuggestionModal(true);
            toast.success('AI suggestion received!');
            setAiLoading(false);
        },
        onError: (error: any) => {
            setAISuggestion(null);
            toast.error(error.response?.data?.message || 'Failed to get AI suggestion.');
            setAiLoading(false);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.language || !formData.code) {
            toast.error('Title, language, and code are required.');
            return;
        }
        const payload: CreateSnippetPayload | UpdateSnippetPayload = {
            ...formData,
            projectId: formData.projectId === '' ? undefined : formData.projectId,
        };
        if (snippetToEdit) {
            updateSnippetMutation.mutate({ snippetId: snippetToEdit._id, payload });
        } else {
            createSnippetMutation.mutate(payload as CreateSnippetPayload);
        }
    };

    const openCreateModal = () => {
        setSnippetToEdit(null);
        setFormData({
            title: '',
            description: '',
            language: 'javascript',
            code: '',
            projectId: undefined,
        });
        setShowSnippetModal(true);
    };

    const openEditModal = (snippet: ICodeSnippet) => {
        setSnippetToEdit(snippet);
        setFormData({
            title: snippet.title,
            description: snippet.description || '',
            language: snippet.language,
            code: snippet.code,
            projectId: typeof snippet.projectId === 'object' && snippet.projectId ? snippet.projectId._id : typeof snippet.projectId === 'string' ? snippet.projectId : undefined,
        });
        setShowSnippetModal(true);
    };

    const openDeleteConfirmModal = (snippet: ICodeSnippet) => {
        setSnippetToDelete(snippet);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteSnippet = () => {
        if (snippetToDelete) {
            deleteSnippetMutation.mutate(snippetToDelete._id);
            setShowDeleteConfirmModal(false);
            setSnippetToDelete(null);
        }
    };

    const handleAIAssist = (snippet: ICodeSnippet, action: 'cleanup' | 'fix_errors') => {
        setCurrentSnippetForAI(snippet);
        setAIAction(action);
        setAISuggestion(null); // Clear previous suggestion
        setAiLoading(true); // Set AI loading true
        aiSuggestionMutation.mutate({ snippetId: snippet._id, payload: { action } });
    };

    if (isLoadingSnippets && !snippets) { // Show full screen loader only on initial load
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-lg">Loading your snippets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 flex items-center self-start md:self-center">
                    <CodeBracketSquareIcon className="h-8 w-8 md:h-10 md:w-10 mr-3 text-sky-400" /> Code Snippets
                </h1>
                <Button variant="primary" onClick={openCreateModal} leftIcon={<PlusCircleIcon className="h-5 w-5" />} className="shadow-md hover:shadow-sky-500/40">
                    Add Snippet
                </Button>
            </header>

            {isLoadingSnippets && snippets && (
                 <div className="fixed top-4 right-4 z-50">
                    <div className="flex items-center bg-slate-700/80 backdrop-blur-md text-slate-200 px-3 py-2 rounded-lg shadow-lg">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm">Refreshing snippets...</span>
                    </div>
                </div>
            )}

            {snippetsError && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg shadow-lg flex items-center">
                    <InformationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">Error Loading Snippets</h4>
                        <p className="text-sm">{(snippetsError as any).message || "An unknown error occurred. Please try again."}</p>
                    </div>
                </div>
            )}

            {snippets && snippets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {snippets.map(snippet => (
                        <div key={snippet._id} className="card hover:shadow-glow-blue transition-shadow duration-300 flex flex-col group">
                            <div className="p-4 flex-grow">
                                <h3 className="text-xl font-semibold text-slate-100 mb-1 truncate group-hover:text-sky-300 transition-colors">{snippet.title}</h3>
                                <p className="text-xs text-slate-400 mb-2 font-mono bg-slate-700/50 px-2 py-0.5 rounded-full inline-block">{snippet.language}</p>
                                {snippet.description && <p className="text-sm text-slate-300 mb-3 line-clamp-2 h-10">{snippet.description}</p>}
                                <div className="bg-slate-900/70 border border-slate-700 p-0 rounded-md max-h-60 overflow-y-auto mb-3 text-sm shadow-inner" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A5568 #1A202C' }}>
                                    <LazySyntaxHighlighter
                                        language={snippet.language.toLowerCase()}
                                        showLineNumbers={false}
                                        wrapLines={true}
                                        customStyle={{ padding: '0.75rem', margin: 0, background: 'transparent', fontSize: '0.8rem'}}
                                        lineNumberStyle={{ minWidth: '2.25em' }}
                                        className="!bg-transparent"
                                    >
                                        {String(snippet.code).substring(0, 400) + (String(snippet.code).length > 400 ? '\n... (code truncated)' : '')}
                                    </LazySyntaxHighlighter>
                                </div>
                                {snippet.projectId && typeof snippet.projectId === 'object' && (
                                    <p className="text-xs text-slate-400 mb-3">
                                        Project: <span className="font-medium text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">{snippet.projectId.name}</span>
                                    </p>
                                )}
                            </div>
                            <div className="border-t border-slate-700/70 p-3 flex flex-wrap justify-end items-center gap-2">
                                <Button size="sm" variant="tertiary" title="AI Cleanup" className="text-teal-400 hover:text-teal-300" onClick={() => handleAIAssist(snippet, 'cleanup')} isLoading={aiLoading && currentSnippetForAI?._id === snippet._id && aiAction === 'cleanup'}>
                                    <SparklesIcon className="h-4 w-4 mr-1" /> Cleanup
                                </Button>
                                <Button size="sm" variant="tertiary" title="AI Fix Errors" className="text-purple-400 hover:text-purple-300" onClick={() => handleAIAssist(snippet, 'fix_errors')} isLoading={aiLoading && currentSnippetForAI?._id === snippet._id && aiAction === 'fix_errors'}>
                                    <SparklesIcon className="h-4 w-4 mr-1" /> Fix Errors
                                </Button>
                                <Button size="sm" title="Edit Snippet" className="text-slate-400 hover:text-sky-400" onClick={() => openEditModal(snippet)}><PencilIcon className="h-4 w-4" /></Button>
                                <Button size="sm" color="danger" title="Delete Snippet" className="text-slate-400 hover:text-red-400" onClick={() => openDeleteConfirmModal(snippet)}><TrashIcon className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 !isLoadingSnippets && !snippetsError && (
                    <div className="card text-center py-16 min-h-[60vh] flex flex-col items-center justify-center gap-4">
                        <CodeBracketSquareIcon className="h-20 w-20 text-slate-500 mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-slate-300">No Snippets Here</h3>
                        <p className="text-slate-400 mt-3 max-w-md mx-auto">
                            It looks a bit empty. Start by adding your first code snippet!
                        </p>
                        <Button variant="primary" className="mt-8 shadow-lg hover:shadow-sky-500/50" onClick={openCreateModal} leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
                            Add First Snippet
                        </Button>
                    </div>
                )
            )}

            {/* Snippet Create/Edit Modal */}
            {showSnippetModal && (
                <Modal
                    isOpen={showSnippetModal}
                    onClose={() => {
                        setShowSnippetModal(false);
                        setSnippetToEdit(null);
                    }}
                    title={snippetToEdit ? 'Edit Code Snippet' : 'Create New Code Snippet'}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <Input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., React Fetch Hook" required className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-slate-300 mb-1">Language</label>
                            <Input type="text" name="language" id="language" value={formData.language} onChange={handleInputChange} placeholder="e.g., javascript, python" required className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                            <Input as="textarea" name="description" id="description" value={formData.description} onChange={handleInputChange} placeholder="Briefly describe what this snippet does" rows={3} className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1">Code</label>
                            <Input as="textarea" name="code" id="code" value={formData.code} onChange={handleInputChange} placeholder="Paste your code here..." rows={10} required className="w-full bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 font-mono text-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="projectId" className="block text-sm font-medium text-slate-300 mb-1">Link to Project (Optional)</label>
                            <select name="projectId" id="projectId" value={formData.projectId || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors">
                                <option value="" className="bg-slate-800">No Project</option>
                                {isLoadingProjects && <option value="" disabled className="bg-slate-800">Loading projects...</option>}
                                {projects && projects.map(proj => (
                                    <option key={proj._id} value={proj._id} className="bg-slate-800">{proj.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button type="button" variant="secondary" onClick={() => { setShowSnippetModal(false); setSnippetToEdit(null); }}>Cancel</Button>
                            <Button type="submit" variant="primary" className="hover:shadow-sky-500/40" isLoading={createSnippetMutation.isPending || updateSnippetMutation.isPending}>
                                {snippetToEdit ? 'Save Changes' : 'Create Snippet'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* AI Suggestion Modal */}
            {showAISuggestionModal && currentSnippetForAI && (
                <Modal
                    isOpen={showAISuggestionModal}
                    onClose={() => {
                        setShowAISuggestionModal(false);
                        setAISuggestion(null);
                        setCurrentSnippetForAI(null); // Clear current snippet for AI
                    }}
                    title={`AI Suggestion for "${currentSnippetForAI.title}"`}
                    size="xl" // Make AI modal larger - Changed from 2xl to xl
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-md">
                            <h4 className="text-lg font-semibold text-sky-300 mb-2 flex items-center">
                                <LightBulbIcon className="h-6 w-6 mr-2 text-sky-400" /> Suggested {aiAction === 'cleanup' ? 'Cleanup' : 'Fixes'}:
                            </h4>
                            {aiSuggestionMutation.isPending || aiLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <LoadingSpinner />
                                    <p className="ml-3 text-slate-300">AI is thinking...</p>
                                </div>
                            ) : aiSuggestion ? (
                                <pre className="whitespace-pre-wrap text-slate-200 text-sm bg-slate-800/70 p-3 rounded-md max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A5568 #1A202C' }}>
                                    {aiSuggestion}
                                </pre>
                            ) : (
                                <p className="text-slate-400">No suggestion available or an error occurred.</p>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 italic">
                            AI suggestions are for guidance only. Always review and test code changes.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => { setShowAISuggestionModal(false); setAISuggestion(null); setCurrentSnippetForAI(null); }}>Close</Button>
                            {aiSuggestion && !aiLoading && (
                                <Button 
                                    variant='primary'
                                    onClick={() => {
                                        // Copy suggestion to clipboard
                                        navigator.clipboard.writeText(aiSuggestion);
                                        toast.success('Suggestion copied to clipboard!');
                                        // Optionally, pre-fill the edit modal with the suggestion
                                        // const updatedSnippet = { ...currentSnippetForAI, code: aiSuggestion };
                                        // openEditModal(updatedSnippet as ICodeSnippet);
                                        // setShowAISuggestionModal(false);
                                    }}
                                    className="hover:shadow-sky-500/40"
                                >
                                    Copy Suggestion
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && snippetToDelete && (
                <Modal
                    isOpen={showDeleteConfirmModal}
                    onClose={() => {
                        setShowDeleteConfirmModal(false);
                        setSnippetToDelete(null);
                    }}
                    title={`Delete Snippet: "${snippetToDelete.title}"?`}
                    size="lg"
                >
                    <div className="space-y-6">
                        <p className="text-slate-300">
                            Are you sure you want to delete this snippet? This action cannot be undone.
                        </p>
                        <div className="bg-slate-700/50 p-3 rounded-md border border-slate-600">
                            <p className="text-sm text-slate-400"><strong>Title:</strong> {snippetToDelete.title}</p>
                            <p className="text-sm text-slate-400"><strong>Language:</strong> {snippetToDelete.language}</p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={() => { setShowDeleteConfirmModal(false); setSnippetToDelete(null); }}>Cancel</Button>
                            <Button 
                                variant="danger" 
                                onClick={confirmDeleteSnippet} 
                                isLoading={deleteSnippetMutation.isPending}
                                className="hover:shadow-red-500/40"
                            >
                                Yes, Delete Snippet
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}; 