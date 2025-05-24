import React, { useState, useEffect, useCallback } from 'react';
import { getBotStatus, startBot, stopBot } from '../../../api/botStatus';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { ClockIcon, PaperAirplaneIcon, ArrowDownOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface BotStatus {
    botId: string;
    status: 'running' | 'stopped' | 'starting' | 'error' | 'unknown';
    pid?: number;
    message?: string;
    startTime?: number;
    uptime?: number;
    messagesSent: number;
    messagesReceived: number;
}

const BOT_ID = 'labnexAI';

const formatUptime = (milliseconds: number | undefined): string => {
    if (typeof milliseconds !== 'number' || milliseconds < 0) return 'N/A';
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
};

const DiscordIntegrationPage: React.FC = () => {
    const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load and manual refresh
    const [actionLoading, setActionLoading] = useState<boolean>(false); // For start/stop actions
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async (options?: { showLoadingIndicator?: boolean }) => {
        if (options?.showLoadingIndicator) {
            setIsLoading(true);
        }
        // Don't clear global error on background polls, only on explicit actions or initial load.
        // setError(null); 
        try {
            const statusData = await getBotStatus(BOT_ID);
            console.log('[DEBUG DiscordIntegrationPage] Received statusData:', statusData); // Log received data
            setBotStatus(statusData);
            if (options?.showLoadingIndicator) setError(null); // Clear error only if it was a foreground fetch
        } catch (err: any) {
            console.error("Failed to fetch bot status:", err);
            // For background polls, we might not want to show a global error prominently
            // but update the status to 'unknown' or 'error'
            if (options?.showLoadingIndicator) {
                setError(err.message || 'Failed to fetch bot status. Is the backend running?');
            }
            setBotStatus(prev => ({
                ...(prev || { 
                    botId: BOT_ID, 
                    status: 'unknown', 
                    pid: undefined, 
                    uptime: undefined, 
                    startTime: undefined, 
                    messagesSent: 0,  // Ensure default for new error state
                    messagesReceived: 0 // Ensure default for new error state
                }),
                status: 'error', 
                message: err.message || 'Bot status fetch failed.',
                // If prev existed, its messagesSent/Received are spread. If not, the above defaults are used before this override.
                // However, for an error state, we might want to preserve existing stats if available, or reset them.
                // Let's ensure they are explicitly part of the new state object if prev existed or use 0.
                messagesSent: prev?.messagesSent ?? 0,
                messagesReceived: prev?.messagesReceived ?? 0
            }));
        } finally {
            if (options?.showLoadingIndicator) {
                setIsLoading(false);
            }
        }
    }, []); // Removed botStatus from dependencies

    useEffect(() => {
        fetchStatus({ showLoadingIndicator: true }); // Initial fetch
        const intervalId = setInterval(() => {
            fetchStatus({ showLoadingIndicator: false }); // Polling without global loading indicator
        }, 10000); // Poll every 10 seconds
        return () => clearInterval(intervalId);
    }, [fetchStatus]);

    const handleStartBot = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const response = await startBot(BOT_ID);
            setBotStatus({ 
                botId: BOT_ID, 
                status: 'starting', 
                message: response.message, 
                startTime: response.startTime, 
                messagesSent: 0, // Initialize on starting
                messagesReceived: 0 // Initialize on starting
            });
            setTimeout(() => fetchStatus({ showLoadingIndicator: false }), 2000); // Refresh after a short delay
        } catch (err: any) {
            console.error("Failed to start bot:", err);
            setError(err.message || 'Failed to start bot.');
            fetchStatus({ showLoadingIndicator: false });
        } finally {
            setActionLoading(false);
        }
    };

    const handleStopBot = async () => {
        setActionLoading(true);
        setError(null);
        try {
            await stopBot(BOT_ID);
            // Optimistically update
            setBotStatus(prev => prev ? { ...prev, status: 'stopped', uptime: undefined, startTime: undefined, pid: undefined } : null);
            setTimeout(() => fetchStatus({ showLoadingIndicator: false }), 2000); // Refresh after a short delay
        } catch (err: any) {
            console.error("Failed to stop bot:", err);
            setError(err.message || 'Failed to stop bot.');
            fetchStatus({ showLoadingIndicator: false });
        } finally {
            setActionLoading(false);
        }
    };

    let statusDisplay = 'Loading status...';
    let statusColorClass = 'bg-gray-500';
    let statusTextClass = 'text-gray-400';

    if (!botStatus && isLoading) statusDisplay = 'Initializing...'; // Initial state before first fetch completes
    else if (botStatus) {
        switch (botStatus.status) {
            case 'running':
                statusDisplay = `Online (PID: ${botStatus.pid || 'N/A'})`;
                statusColorClass = 'bg-green-500';
                statusTextClass = 'text-green-400';
                break;
            case 'stopped':
                statusDisplay = 'Offline';
                statusColorClass = 'bg-red-500';
                statusTextClass = 'text-red-400';
                break;
            case 'starting':
                statusDisplay = botStatus.message || 'Starting...';
                statusColorClass = 'bg-yellow-500';
                statusTextClass = 'text-yellow-400';
                break;
            case 'error':
                statusDisplay = `Error: ${botStatus.message || 'Unknown error'}`;
                statusColorClass = 'bg-red-700'; // A more distinct error color
                statusTextClass = 'text-red-500';
                break;
            case 'unknown': // This case might be less frequent now if fetch error sets status to 'error'
                statusDisplay = `Unknown (${botStatus.message || 'Could not determine status'})`;
                statusColorClass = 'bg-purple-500';
                statusTextClass = 'text-purple-400';
                break;
            default:
                statusDisplay = 'Status N/A';
                statusColorClass = 'bg-gray-600';
                statusTextClass = 'text-gray-500';
        }
    }

    return (
        <div className="p-6 text-gray-100 min-h-screen">
            <h1 className="text-3xl font-semibold mb-8">Discord Bot Integration</h1>
            
            <Card className="max-w-lg shadow-xl bg-gray-800 border border-gray-700">
                 <Card.Title className="text-xl font-semibold text-white border-b border-gray-700 pb-4 mb-5">
                    Labnex AI Bot Management
                 </Card.Title>
                 <Card.Content className="space-y-6">
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm border border-red-700">Error: {error}</p>}
                    
                    <div className="flex items-center space-x-4 p-3 bg-gray-750 rounded-lg border border-gray-600">
                        <span 
                            className={`w-4 h-4 rounded-full ${statusColorClass} ring-2 ring-offset-2 ring-offset-gray-750 ${botStatus?.status === 'running' || botStatus?.status === 'starting' ? 'animate-pulse' : ''}`}
                            title={`Status: ${botStatus?.status}`}
                        ></span>
                        <p className={`text-lg font-medium ${statusTextClass}`}>{statusDisplay}</p>
                    </div>

                    {botStatus?.status === 'running' && botStatus.uptime !== undefined && (
                        <div className="p-4 bg-gray-750 rounded-lg border border-gray-600">
                            <h3 className="text-md font-semibold text-gray-200 mb-2 flex items-center">
                                <ClockIcon className="w-5 h-5 mr-2 text-blue-400" /> Current Session Uptime
                            </h3>
                            <p className="text-2xl text-blue-300 font-mono tracking-wide">{formatUptime(botStatus.uptime)}</p>
                        </div>
                    )}
                    
                    {/* Display stats section if the bot is running */}
                    {botStatus?.status === 'running' && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="bg-gray-750 p-3 border border-gray-600 shadow-md">
                                <Card.Title className="text-sm font-medium text-gray-300 flex items-center mb-1">
                                    <PaperAirplaneIcon className="w-4 h-4 mr-2 text-green-400"/> Messages Sent
                                </Card.Title>
                                <Card.Content className="text-xl font-semibold text-green-300">
                                    {botStatus.messagesSent}
                                </Card.Content>
                            </Card>
                            <Card className="bg-gray-750 p-3 border border-gray-600 shadow-md">
                                <Card.Title className="text-sm font-medium text-gray-300 flex items-center mb-1">
                                    <ArrowDownOnSquareIcon className="w-4 h-4 mr-2 text-purple-400"/> Messages Received
                                </Card.Title>
                                <Card.Content className="text-xl font-semibold text-purple-300">
                                    {botStatus.messagesReceived}
                                </Card.Content>
                            </Card>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-5 border-t border-gray-700">
                        <Button 
                            onClick={handleStartBot} 
                            disabled={isLoading || actionLoading || botStatus?.status === 'running' || botStatus?.status === 'starting'}
                            variant="primary"
                            className="w-full sm:w-auto flex-grow sm:flex-grow-0"
                        >
                            {actionLoading && (botStatus?.status !== 'running' && botStatus?.status !== 'starting') ? 'Starting...' : 'Start Bot'}
                        </Button>
                        <Button 
                            onClick={handleStopBot} 
                            disabled={isLoading || actionLoading || botStatus?.status === 'stopped' || botStatus?.status === 'error' || botStatus?.status === 'unknown'}
                            variant="danger"
                            className="w-full sm:w-auto flex-grow sm:flex-grow-0"
                        >
                            {actionLoading && botStatus?.status === 'running' ? 'Stopping...' : 'Stop Bot'}
                        </Button>
                        <Button 
                            onClick={() => fetchStatus({ showLoadingIndicator: true })}
                            disabled={actionLoading} //isLoading is handled by the button text itself
                            variant="secondary"
                            className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center"
                        >
                            <ArrowPathIcon className={`w-5 h-5 mr-2 ${isLoading && !actionLoading ? 'animate-spin' : ''}`} />
                            {isLoading && !actionLoading ? 'Refreshing...' : 'Refresh Status'}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 pt-2 text-center sm:text-left">
                        This bot leverages ChatGPT to answer questions about Labnex. 
                        Ensure backend environment variables for Discord and OpenAI are correctly configured.
                    </p>
                 </Card.Content>
            </Card>
        </div>
    );
};

export default DiscordIntegrationPage; 