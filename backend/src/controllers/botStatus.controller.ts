import { Request, Response } from 'express';
import { fork, ChildProcess, ForkOptions } from 'child_process';
import path from 'path';

interface ActiveBotInfo {
  process: ChildProcess;
  startTime: number;
  // We can add more stats here later from IPC
  messagesSent?: number;
  messagesReceived?: number;
}

// In-memory store for active bot processes
// Key: botId (e.g., 'labnexAI'), Value: ActiveBotInfo
const activeBots: Map<string, ActiveBotInfo> = new Map();

// Determine the correct path to the bot script based on the environment
const isProduction = process.env.NODE_ENV === 'production';
const labnexAIBotScriptPath = isProduction
  ? path.join(__dirname, '..', 'bots', 'labnexAI', 'labnexAI.bot.js') // Path in production (dist folder)
  : path.join(__dirname, '..', 'bots', 'labnexAI', 'labnexAI.bot.ts'); // Path in development (src folder)

// Get status of a specific bot
export const getBotStatus = async (req: Request, res: Response) => {
    const { botId } = req.params;
    if (botId !== 'labnexAI') { // For now, only one bot is supported
        return res.status(404).json({ message: `Bot with ID '${botId}' not found or not supported.` });
    }

    const botInfo = activeBots.get(botId);
    if (botInfo && !botInfo.process.killed && botInfo.process.connected) {
        const uptime = Date.now() - botInfo.startTime;
        
        // Ensure messagesSent and messagesReceived are numbers, default to 0
        const messagesSent = typeof botInfo.messagesSent === 'number' ? botInfo.messagesSent : 0;
        const messagesReceived = typeof botInfo.messagesReceived === 'number' ? botInfo.messagesReceived : 0;

        // Log the stats right before sending
        console.log(`[DEBUG getBotStatus - ${botId}] Sending stats:`, {
            messagesSent, // Use the sanitized variables
            messagesReceived, // Use the sanitized variables
            startTime: botInfo.startTime,
            uptime
        });
        res.status(200).json({ 
            botId, 
            status: 'running', 
            pid: botInfo.process.pid,
            startTime: botInfo.startTime,
            uptime,
            messagesSent, // Explicitly use the sanitized variables
            messagesReceived // Explicitly use the sanitized variables
        });
    } else {
        // For a 'stopped' bot, explicitly define these fields for type consistency
        res.status(200).json({ 
            botId, 
            status: 'stopped', 
            messagesSent: 0, 
            messagesReceived: 0 
        });
    }
};

// Start a specific bot
export const startBot = async (req: Request, res: Response) => {
    const { botId } = req.params;
    if (botId !== 'labnexAI') {
        return res.status(404).json({ message: `Bot '${botId}' cannot be started.` });
    }

    if (activeBots.has(botId) && !activeBots.get(botId)?.process.killed) {
        return res.status(400).json({ message: `Bot '${botId}' is already running.` });
    }

    console.log(`Starting bot process for ${botId} from ${labnexAIBotScriptPath}...`);
    
    // Forking options that differ between production and development
    const forkOptions: ForkOptions = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'], // Always pipe stdio and enable IPC
        execArgv: isProduction
          ? [] // No special exec arguments needed for production
          : ['-r', 'ts-node/register'], // Use ts-node for development
    };

    const botProcess = fork(labnexAIBotScriptPath, [], forkOptions);

    if (botProcess.pid) {
        console.log(`[startBot] Successfully forked bot process with PID: ${botProcess.pid}`);
    } else {
        // This case is rare, as fork() usually throws an error instead of returning a process without a PID.
        console.error(`[startBot] Failed to fork bot process. Path: ${labnexAIBotScriptPath}`);
        // It's possible the response has already been sent, but we try to send an error response if not.
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to create bot process.' });
        }
        return; // Stop execution
    }

    const startTime = Date.now();
    activeBots.set(botId, { 
        process: botProcess, 
        startTime, 
        messagesSent: 0, // Initialize stats to 0
        messagesReceived: 0 // Initialize stats to 0
    });

    botProcess.stdout?.on('data', (data) => {
        console.log(`[${botId}-stdout]: ${data.toString().trim()}`);
    });

    botProcess.stderr?.on('data', (data) => {
        console.error(`[${botId}-stderr]: ${data.toString().trim()}`);
    });

    // Listen for messages from the bot process (for future stats)
    botProcess.on('message', (message: any) => {
        console.log(`[${botId}-ipc-message]:`, message);
        if (message && typeof message === 'object' && message.type === 'stats') {
            const botInfo = activeBots.get(botId);
            if (botInfo) {
                activeBots.set(botId, {
                    ...botInfo,
                    messagesSent: message.data?.messagesSent,
                    messagesReceived: message.data?.messagesReceived,
                });
            }
        }
    });

    botProcess.on('exit', (code, signal) => {
        console.log(`Bot '${botId}' process exited with code ${code} and signal ${signal}`);
        activeBots.delete(botId);
    });

    botProcess.on('error', (err) => {
        console.error(`Error in bot '${botId}' process:`, err);
        activeBots.delete(botId);
    });

    res.status(202).json({ message: `Bot '${botId}' is starting...`, botId, startTime });
};

// Stop a specific bot
export const stopBot = async (req: Request, res: Response) => {
    const { botId } = req.params;
    if (botId !== 'labnexAI') {
        return res.status(404).json({ message: `Bot '${botId}' cannot be stopped.` });
    }

    const botInfo = activeBots.get(botId);
    if (!botInfo || botInfo.process.killed) {
        return res.status(400).json({ message: `Bot '${botId}' is not running or already stopped.` });
    }

    console.log(`Stopping bot process for ${botId}...`);
    const killed = botInfo.process.kill('SIGTERM'); 
    if (killed) {
        res.status(200).json({ message: `Stop signal sent to bot '${botId}'.`, botId });
    } else {
        res.status(500).json({ message: `Failed to send stop signal to bot '${botId}'. It might be already stopped or unresponsive.` });
    }
}; 