import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { INote, UpdateNotePayload } from '../../api/notes'; // Removed CreateNotePayload, CreateNoteWithAIPayload
import { getNotes, createNote, updateNote, deleteNote, createNoteWithAI } from '../../api/notes'; // added createNoteWithAI
import type { Project } from '../../api/projects'; // type-only import
import { getProjects } from '../../api/projects'; // To list projects for linking
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TrashIcon, PencilIcon, PlusCircleIcon, BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/common/Modal';

// Themed NoteItem
const NoteItem: React.FC<{ note: INote; onEdit: (note: INote) => void; onDelete: (noteId: string) => void }> = ({ note, onEdit, onDelete }) => {
    return (
        <div className="mb-4 break-inside-avoid-column bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-lg shadow-md hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 group">
            <div className="p-4 flex-grow">
                <p className="text-slate-100 whitespace-pre-wrap flex-grow break-words text-sm leading-relaxed">{note.content}</p>
            </div>
            <div className="px-4 py-3 border-t border-slate-700/70 flex justify-between items-center">
                <div className="text-xs text-slate-400 space-x-2">
                    {note.project && typeof note.project === 'object' && (
                        <span className="inline-block bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-medium">
                            Project: {note.project.name}
                        </span>
                    )}
                    <span>Last updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex-shrink-0 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" onClick={() => onEdit(note)} title="Edit Note">
                        <PencilIcon className="h-5 w-5 text-slate-400 hover:text-blue-400 transition-colors" />
                    </Button>
                    <Button color="danger" size="sm" onClick={() => onDelete(note._id)} title="Delete Note">
                        <TrashIcon className="h-5 w-5 text-slate-400 hover:text-red-400 transition-colors" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const NotesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [showNoteModal, setShowNoteModal] = useState(false); // Consolidated modal state
    const [noteToEdit, setNoteToEdit] = useState<INote | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
    const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined); // For filtering notes by project

    // State for AI Note Creation
    const [showAINoteModal, setShowAINoteModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedProjectIdForAI, setSelectedProjectIdForAI] = useState<string | undefined>(undefined);

    // Fetch notes, re-fetch when filterProjectId changes
    const { data: notes, isLoading: isLoadingNotes, error: notesError, isFetching: isFetchingNotes } = useQuery<INote[]>({
        queryKey: ['notes', filterProjectId], // Include filterProjectId in queryKey
        queryFn: () => getNotes(filterProjectId),
    });

    // Fetch projects for dropdowns
    const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
        queryKey: ['projectsListForNotes'],
        queryFn: () => getProjects(), // Corrected: getProjects takes no arguments
    });

    // Create note mutation
    const createNoteMutation = useMutation<INote, Error, { title: string; content: string; projectId?: string; tags?: string[] }>({
        mutationFn: createNote,
        onSuccess: () => {
            toast.success('Note created successfully!');
            queryClient.invalidateQueries({ queryKey: ['notes', selectedProjectId] });
            setShowNoteModal(false);
            setNoteContent('');
            setSelectedProjectId(undefined);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create note.');
        },
    });

    // Update note mutation
    const updateNoteMutation = useMutation({
        mutationFn: (payload: {noteId: string, data: UpdateNotePayload}) => updateNote(payload.noteId, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] }); // Invalidate all notes queries
            toast.success('Note updated successfully!');
            setShowNoteModal(false); // Use consolidated state
            setNoteToEdit(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update note.');
        },
    });

    // Delete note mutation
    const deleteNoteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            toast.success('Note deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete note.');
        },
    });

    // AI Note Creation Mutation
    const createNoteWithAIMutation = useMutation({
        mutationFn: createNoteWithAI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            toast.success('AI-generated note created successfully!');
            setShowAINoteModal(false);
            setAiPrompt('');
            setSelectedProjectIdForAI(undefined);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create note with AI.');
        },
    });

    const handleCreateNote = () => {
        if (noteContent.trim() === '') {
            toast.error('Note content cannot be empty.');
            return;
        }
        const noteTitle = noteContent.substring(0, 30) + (noteContent.length > 30 ? '...' : ''); // Simple title
        createNoteMutation.mutate({ title: noteTitle, content: noteContent, projectId: selectedProjectId });
    };
    
    const handleEditNote = () => {
        if (!noteToEdit) return;
        if (noteContent.trim() === '') {
            toast.error('Note content cannot be empty.');
            return;
        }
        updateNoteMutation.mutate({ 
            noteId: noteToEdit._id, 
            data: { content: noteContent, projectId: selectedProjectId === '' ? null : selectedProjectId }
        });
    };

    const handleCreateNoteWithAI = () => {
        if (aiPrompt.trim() === '') {
            toast.error('AI prompt cannot be empty.');
            return;
        }
        createNoteWithAIMutation.mutate({ prompt: aiPrompt, projectId: selectedProjectIdForAI });
    };

    const openEditModal = (note: INote) => {
        setNoteToEdit(note);
        setNoteContent(note.content);
        if (note.project && typeof note.project === 'object') {
            setSelectedProjectId(note.project._id);
        } else if (typeof note.project === 'string') {
            setSelectedProjectId(note.project);
        } else {
            setSelectedProjectId(undefined);
        }
        setShowNoteModal(true); // Use consolidated state
    };

    const handleDeleteNote = (noteId: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            deleteNoteMutation.mutate(noteId);
        }
    };

    if (isLoadingNotes && !notes) { // Show full screen loader only on initial load
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-slate-100 p-6">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-lg">Loading your notes...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-slate-100 p-4 md:p-6 lg:p-8">
            <div className="container mx-auto">
                <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-300 flex items-center self-start md:self-center">
                        <BookOpenIcon className="h-8 w-8 md:h-10 md:w-10 mr-3 text-blue-400" /> My Notes
                    </h1>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <Input
                            as="select"
                            value={filterProjectId || ''}
                            onChange={(e) => setFilterProjectId(e.target.value || undefined)}
                            className="w-full md:w-56 bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 text-sm rounded-md shadow-sm"
                        >
                            <option value="" className="bg-slate-800">All Projects</option>
                            {isLoadingProjects && <option value="" disabled className="bg-slate-800">Loading projects...</option>}
                            {projects && projects.map(proj => (
                                <option key={proj._id} value={proj._id} className="bg-slate-800">{proj.name}</option>
                            ))}
                        </Input>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setNoteToEdit(null);
                                setNoteContent('');
                                setSelectedProjectId(filterProjectId);
                                setShowNoteModal(true);
                            }}
                            leftIcon={<PlusCircleIcon className="h-5 w-5" />}
                            className="flex-shrink-0 shadow-md hover:shadow-blue-500/40"
                        >
                            Add Note
                        </Button>
                        <Button
                            variant="secondary" // Or a new 'ai' variant if created
                            onClick={() => {
                                setAiPrompt('');
                                setSelectedProjectIdForAI(filterProjectId);
                                setShowAINoteModal(true);
                            }}
                            leftIcon={<SparklesIcon className="h-5 w-5" />} // Updated Icon
                            className="flex-shrink-0 shadow-md"
                        >
                            AI Assistant
                        </Button>
                    </div>
                </header>

                {isFetchingNotes && !isLoadingNotes && ( // Subtle loading indicator for filtering/refetching
                    <div className="fixed top-4 right-4 z-50">
                        <div className="flex items-center bg-slate-700/80 backdrop-blur-md text-slate-200 px-3 py-2 rounded-lg shadow-lg">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2 text-sm">Refreshing notes...</span>
                        </div>
                    </div>
                )}

                {notesError && (
                    <Card className="bg-red-900/30 border-red-700 text-red-300 p-4 rounded-lg shadow-lg">
                        <Card.Content className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Error loading notes: {(notesError as any).message || "An unknown error occurred."}
                        </Card.Content>
                    </Card>
                )}

                {notes && notes.length > 0 ? (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
                        {notes.map(note => (
                            <NoteItem key={note._id} note={note} onEdit={openEditModal} onDelete={handleDeleteNote} />
                        ))}
                    </div>
                ) : (
                    !isLoadingNotes && !notesError && ( // Ensure error isn't also shown
                        <div className="text-center py-16 bg-slate-800/40 backdrop-blur-sm rounded-lg shadow-md">
                            <BookOpenIcon className="h-20 w-20 text-slate-500 mx-auto mb-6" />
                            <h3 className="text-2xl font-semibold text-slate-300">No Notes Yet</h3>
                            <p className="text-slate-400 mt-3 max-w-md mx-auto">
                                {filterProjectId ? 'No notes match the current filter.' : 'Click "Add Note" or use the "AI Assistant" to create your first note!'}
                            </p>
                            <Button
                                variant="primary"
                                className="mt-8 shadow-lg hover:shadow-blue-500/50"
                                onClick={() => {
                                    setNoteToEdit(null);
                                    setNoteContent('');
                                    setSelectedProjectId(filterProjectId);
                                    setShowNoteModal(true);
                                }}
                                leftIcon={<PlusCircleIcon className="h-5 w-5" />}
                            >
                                Create Your First Note
                            </Button>
                        </div>
                    )
                )}

                {/* Note Creation/Edit Modal */}
                {showNoteModal && (
                    <Modal
                        isOpen={showNoteModal}
                        onClose={() => {
                            setShowNoteModal(false);
                            setNoteToEdit(null); // Clear edit state on close
                            setNoteContent(''); // Clear content
                            setSelectedProjectId(undefined); // Clear project
                        }}
                        title={noteToEdit ? 'Edit Note' : 'Create New Note'}
                    >
                        <div className="space-y-6">
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Enter your note content here..."
                                rows={8}
                                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <div>
                                <label htmlFor="projectSelect" className="block text-sm font-medium text-slate-300 mb-1">Link to Project (Optional)</label>
                                <select
                                    id="projectSelect"
                                    value={selectedProjectId || ''}
                                    onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
                                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="" className="bg-slate-800">No Project</option>
                                    {isLoadingProjects && <option value="" disabled className="bg-slate-800">Loading projects...</option>}
                                    {projects && projects.map(proj => (
                                        <option key={proj._id} value={proj._id} className="bg-slate-800">{proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowNoteModal(false);
                                        setNoteToEdit(null);
                                        setNoteContent('');
                                        setSelectedProjectId(undefined);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={noteToEdit ? handleEditNote : handleCreateNote}
                                    isLoading={createNoteMutation.isPending || updateNoteMutation.isPending}
                                    className="shadow-md hover:shadow-blue-500/40"
                                >
                                    {noteToEdit ? 'Save Changes' : 'Create Note'}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* AI Note Creation Modal */}
                {showAINoteModal && (
                    <Modal
                        isOpen={showAINoteModal}
                        onClose={() => {
                            setShowAINoteModal(false);
                            setAiPrompt('');
                            setSelectedProjectIdForAI(undefined);
                        }}
                        title="Create Note with AI Assistant"
                    >
                        <div className="space-y-6">
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Describe the note you want the AI to create (e.g., 'Brainstorm ideas for a new feature', 'Summarize the key points of the last meeting')..."
                                rows={5}
                                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <div>
                                <label htmlFor="aiProjectSelect" className="block text-sm font-medium text-slate-300 mb-1">Link to Project (Optional)</label>
                                <select
                                    id="aiProjectSelect"
                                    value={selectedProjectIdForAI || ''}
                                    onChange={(e) => setSelectedProjectIdForAI(e.target.value || undefined)}
                                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="" className="bg-slate-800">No Project</option>
                                    {isLoadingProjects && <option value="" disabled className="bg-slate-800">Loading projects...</option>}
                                    {projects && projects.map(proj => (
                                        <option key={proj._id} value={proj._id} className="bg-slate-800">{proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <Button variant="secondary" onClick={() => setShowAINoteModal(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateNoteWithAI}
                                    isLoading={createNoteWithAIMutation.isPending}
                                    leftIcon={<SparklesIcon className="h-5 w-5" />}
                                    className="shadow-md hover:shadow-blue-500/40"
                                >
                                    Generate Note
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}; 