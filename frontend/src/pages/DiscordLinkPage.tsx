import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { linkDiscordAccountApi } from '../api/discordIntegration';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';

const DiscordLinkPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [discordUserId, setDiscordUserId] = useState<string | null>(null);
    const [discordUsername, setDiscordUsername] = useState<string | null>(null);

    useEffect(() => {
        console.log('Current window.location.href:', window.location.href);
        console.log('Current location.hash:', location.hash);

        const hashParams = location.hash.substring(1);
        const queryParams = new URLSearchParams(hashParams);
        const extractedToken = queryParams.get('token');
        const extractedDiscordId = queryParams.get('discord_id');
        const extractedDiscordUsername = queryParams.get('discord_username');
        
        if (extractedToken) {
            setToken(extractedToken);
        } else {
            toast.error('Link token is missing. Please try the link from Discord again.');
            navigate('/');
        }
        if (extractedDiscordId) {
            setDiscordUserId(extractedDiscordId);
        }
        if (extractedDiscordUsername) {
            setDiscordUsername(decodeURIComponent(extractedDiscordUsername));
        }
    }, [location.hash, navigate]);

    const mutation = useMutation({
        mutationFn: linkDiscordAccountApi,
        onSuccess: (data: any) => {
            toast.success(data.message || 'Discord account linked successfully!');
            navigate('/settings/integrations');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to link account. Please try again.');
        },
    });

    const handleLinkAccount = () => {
        if (token) {
            mutation.mutate({ token });
        } else {
            toast.error('Cannot link account: Token is missing.');
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    if (!token && !mutation.isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 text-white">
                <Card className="w-full max-w-md">
                    <Card.Title>Invalid Link</Card.Title>
                    <Card.Content>
                        <p>The account linking token is missing or invalid. Please try the link from Discord again or generate a new one.</p>
                        <Button onClick={() => navigate('/')} variant="primary" className="mt-4">Go to Homepage</Button>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900 p-4 text-white">
            <Card className="w-full max-w-md glassmorphism">
                <Card.Title>Link Discord Account</Card.Title>
                <Card.Content>
                    <p className="mb-6 text-center text-lg">
                        You are about to link your Labnex account with Discord.
                        {discordUserId && <span className="block mt-2 text-sm text-gray-300">Discord User ID: {discordUserId}</span>}
                        {discordUsername && <span className="block mt-1 text-sm text-gray-300">Discord Username: <span className='font-semibold'>{discordUsername}</span></span>}
                    </p>
                    <p className="mb-6 text-center">
                        Please confirm that you want to proceed.
                    </p>
                    <div className="flex flex-col space-y-4">
                        <Button 
                            onClick={handleLinkAccount} 
                            disabled={mutation.isPending || !token}
                            variant="primary" 
                            className="w-full glowing-button-effect"
                        >
                            {mutation.isPending ? 'Linking...' : 'Confirm & Link Account'}
                        </Button>
                        <Button 
                            onClick={handleCancel} 
                            variant="secondary" 
                            className="w-full"
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                    {mutation.isError && (
                        <p className="mt-4 text-center text-red-400">{(mutation.error as Error)?.message || 'An unexpected error occurred.'}</p>
                    )}
                </Card.Content>
            </Card>
        </div>
    );
};

export default DiscordLinkPage; 