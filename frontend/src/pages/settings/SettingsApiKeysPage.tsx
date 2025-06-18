import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { getApiKeys, createApiKey, revokeApiKey } from '../../api/users';
import type { ApiKey, NewApiKeyResponse } from '../../api/users';

import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function SettingsApiKeysPage() {
    const queryClient = useQueryClient();
    const [newKeyLabel, setNewKeyLabel] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isShowKeyModalOpen, setShowKeyModalOpen] = useState(false);

    const { data: apiKeys = [], isLoading, isError } = useQuery<ApiKey[], Error>({
        queryKey: ['apiKeys'],
        queryFn: getApiKeys,
    });

    const createMutation = useMutation<NewApiKeyResponse, Error, string>({
        mutationFn: createApiKey,
        onSuccess: (data) => {
            toast.success('API Key created successfully!');
            setGeneratedKey(data.token);
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setCreateModalOpen(false); // Close the creation modal
            setShowKeyModalOpen(true); // Open the modal to show the key
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create API key.');
        }
    });

    const revokeMutation = useMutation<{ message: string }, Error, string>({
        mutationFn: revokeApiKey,
        onSuccess: () => {
            toast.success('API Key revoked.');
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to revoke API key.');
        }
    });

    const handleGenerateClick = () => {
        if (!newKeyLabel.trim()) {
            toast.error("Label cannot be empty.");
            return;
        }
        createMutation.mutate(newKeyLabel);
    };

    const handleRevokeClick = (id: string) => {
        if (window.confirm("Are you sure you want to revoke this key? This action cannot be undone.")) {
            revokeMutation.mutate(id);
        }
    };
    
    const closeAndResetShowKeyModal = () => {
        setShowKeyModalOpen(false);
        setGeneratedKey(null);
        setNewKeyLabel("");
    }

    return (
        <>
            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">API Keys</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Manage API keys for programmatic access to the Labnex API.
                    </p>

                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setCreateModalOpen(true)}>Generate new key</Button>
                    </div>

                    <div className="space-y-2">
                        {isLoading && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
                        {isError && <p className="text-center text-red-500">Failed to load API keys.</p>}
                        {!isLoading && !isError && (
                            apiKeys.length === 0
                                ? <p className="text-center text-gray-500 dark:text-gray-400 py-4">No API keys have been generated yet.</p>
                                : apiKeys.map((key) => (
                                    <div key={key._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{key.label}</p>
                                            <p className="font-mono text-sm text-gray-500 dark:text-gray-400 break-all">{key.prefix}••••••••</p>
                                        </div>
                                        <Button 
                                            variant="danger" 
                                            size="sm" 
                                            onClick={() => handleRevokeClick(key._id)} 
                                            isLoading={revokeMutation.isPending && revokeMutation.variables === key._id}
                                            disabled={revokeMutation.isPending}
                                        >
                                            Revoke
                                        </Button>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </Card>

            {/* Modal for Creating a Key */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Generate new API key"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Give your key a descriptive label to remember its purpose.
                    </p>
                    <div>
                        <label htmlFor="key-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Label
                        </label>
                        <Input
                            id="key-label"
                            type="text"
                            value={newKeyLabel}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyLabel(e.target.value)}
                            placeholder="e.g., 'My Dev Laptop'"
                            disabled={createMutation.isPending}
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateClick} isLoading={createMutation.isPending} disabled={createMutation.isPending}>
                        Generate Key
                    </Button>
                </div>
            </Modal>

            {/* Modal for Showing the Generated Key */}
            <Modal
                isOpen={isShowKeyModalOpen}
                onClose={closeAndResetShowKeyModal}
                title="API Key Generated"
            >
                 <div className="space-y-4">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 p-3 rounded-lg">
                        Please copy this key and store it securely. You will not be able to see it again.
                    </p>
                    <p className="p-3 bg-gray-100 dark:bg-gray-800 font-mono text-sm break-all rounded-md">
                        {generatedKey}
                    </p>
                    <Button onClick={() => navigator.clipboard.writeText(generatedKey || '')} className="w-full">
                        Copy to Clipboard
                    </Button>
                </div>
                <div className="mt-6 flex justify-end">
                     <Button variant="secondary" onClick={closeAndResetShowKeyModal}>Close</Button>
                </div>
            </Modal>
        </>
    );
} 