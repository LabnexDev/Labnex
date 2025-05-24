import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ILinkedDiscordAccount } from '../../api/discordIntegration';
import { getLinkedDiscordAccountsApi, unlinkDiscordAccountApi } from '../../api/discordIntegration';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal'; // Assuming a Modal component exists
import toast from 'react-hot-toast';
import { TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns'; // For formatting dates

const SettingsIntegrationsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccountToUnlink, setSelectedAccountToUnlink] = useState<ILinkedDiscordAccount | null>(null);

    const { data: linkedAccounts, isLoading, error } = useQuery<ILinkedDiscordAccount[], Error>({
        queryKey: ['linkedDiscordAccounts'],
        queryFn: getLinkedDiscordAccountsApi,
    });

    const unlinkMutation = useMutation<unknown, Error, string>({
        mutationFn: unlinkDiscordAccountApi,
        onSuccess: () => {
            toast.success('Discord account unlinked successfully!');
            queryClient.invalidateQueries({ queryKey: ['linkedDiscordAccounts'] });
            setIsModalOpen(false);
            setSelectedAccountToUnlink(null);
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to unlink account.');
            setIsModalOpen(false);
        },
    });

    const handleUnlinkClick = (account: ILinkedDiscordAccount) => {
        setSelectedAccountToUnlink(account);
        setIsModalOpen(true);
    };

    const confirmUnlink = () => {
        if (selectedAccountToUnlink) {
            unlinkMutation.mutate(selectedAccountToUnlink.discordUserId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                <p>Error loading linked accounts: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-3xl font-semibold text-white">Discord Integrations</h1>
            
            <Card className="glassmorphism">
                <Card.Title>Linked Discord Accounts</Card.Title>
                <Card.Content>
                    {linkedAccounts && linkedAccounts.length > 0 ? (
                        <ul className="divide-y divide-gray-700">
                            {linkedAccounts.map((account) => (
                                <li key={account.discordUserId} className="py-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <UserCircleIcon className="h-10 w-10 text-purple-400" />
                                        <div>
                                            <p className="text-lg font-medium text-white">{account.discordUsername}</p>
                                            <p className="text-sm text-gray-400">
                                                ID: {account.discordUserId} - Linked on: {format(new Date(account.linkedAt), 'PPP')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleUnlinkClick(account)}
                                        className="flex items-center space-x-1.5"
                                        size="sm"
                                    >
                                        <TrashIcon className="h-4 w-4"/>
                                        <span>Unlink</span>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-center py-8">No Discord accounts linked yet.</p>
                    )}
                </Card.Content>
            </Card>

            {selectedAccountToUnlink && (
                <Modal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    title="Confirm Unlink"
                >
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to unlink the Discord account 
                        <span className="font-semibold text-white"> {selectedAccountToUnlink.discordUsername}</span> ({selectedAccountToUnlink.discordUserId})?
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={unlinkMutation.isPending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmUnlink} isLoading={unlinkMutation.isPending}>
                            Confirm Unlink
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SettingsIntegrationsPage; 