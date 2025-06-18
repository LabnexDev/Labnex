import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projectRoutes';
import testCaseRoutes from './routes/testCaseRoutes';
import roleRoutes from './routes/roleRoutes';
import notificationRoutes from './routes/notificationRoutes';
import searchRoutes from './routes/searchRoutes';
import userRoutes from './routes/userRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import botStatusRoutes from './routes/botStatus.routes';
import discordIntegrationRoutes from './routes/discordIntegrationRoutes';
import noteRoutes from './routes/noteRoutes';
import codeSnippetRoutes from './routes/codeSnippetRoutes';
import myTaskRoutes from './routes/myTaskRoutes';
import testRunnerRoutes from './routes/testRunnerRoutes';
import aiRoutes from './routes/aiRoutes';
import statsRoutes from './routes/statsRoutes';
import adminRoutes from './routes/adminRoutes';
import supportRoutes from './routes/support.routes';
import { setupWebSocket } from './utils/websocket';
import { createServer } from 'http';
import { fork, ChildProcess } from 'child_process';
import { proxyOpenAITTS } from './controllers/aiTtsController';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

let botProcess: ChildProcess | null = null;

function startBot() {
  console.log('[BotManager] Attempting to start the bot...');
  const botScriptPath = path.resolve(__dirname, 'bots/labnexAI/labnexAI.bot.js');
  console.log(`[BotManager] Bot script path resolved to: ${botScriptPath}`);
  
  botProcess = fork(botScriptPath, [], {
    // Pass parent process's env variables to child, crucial for .env to work
    env: process.env,
    // Use 'pipe' to capture stdout/stderr from the bot
    silent: false 
  });

  botProcess.on('message', (message: any) => {
    console.log('[BotManager] Received message from bot:', message);
    // Here you could handle stats or other IPC messages
  });

  botProcess.on('error', (err) => {
    console.error('[BotManager] Bot process error:', err);
  });

  botProcess.on('exit', (code, signal) => {
    console.log(`[BotManager] Bot process exited with code ${code} and signal ${signal}.`);
    // Optional: Implement a restart mechanism
    botProcess = null; // Clear the process handle
    // Consider adding a delay or max-retry logic before restarting
    console.log('[BotManager] Restarting bot in 5 seconds...');
    setTimeout(startBot, 5000);
  });

  console.log('[BotManager] Bot process has been forked.');
}

const app = express();
app.set('trust proxy', 1); // Trust the first hop from the proxy
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'https://www.labnex.dev',
  'https://labnex.dev',
  'http://localhost:5173',
  'https://labnexdev.github.io' // Old domain, can be removed later
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Routes (order matters: place testRunnerRoutes before generic project routes)
app.use('/api/auth', authRoutes);
app.use('/api', testRunnerRoutes); // includes /projects/:projectId/test-runs etc.
app.use('/api/projects', projectRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/bots', botStatusRoutes);
app.use('/api/integrations/discord', discordIntegrationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/snippets', codeSnippetRoutes);
app.use('/api/tasks', myTaskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Public TTS proxy (no auth) temporary
app.post('/api/openai/tts', proxyOpenAITTS);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let mongoStatus = 'Unknown';
  let mongoResponseTime = null;

  try {
    if (mongoose.connection.readyState === 1) {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoResponseTime = `${Date.now() - startTime}ms`;
      mongoStatus = 'Operational';
    } else {
      mongoStatus = 'Disconnected';
    }
  } catch (e) {
    mongoStatus = 'Error';
    console.error('MongoDB ping error:', e);
  }

  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: [
      { name: 'Express API', status: 'Operational', responseTime: `${Math.floor(process.uptime())}s uptime` },
      { name: 'MongoDB', status: mongoStatus, responseTime: mongoResponseTime },
      { name: 'Discord Bot', status: 'Not Monitored', responseTime: 'N/A' },
      { name: 'OpenAI Integration', status: 'Not Monitored', responseTime: 'N/A' }
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Replace app.listen with server setup
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Update the start function
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`WebSocket server is running`);

      // Start the bot only in production or if explicitly enabled
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BOT === 'true') {
        startBot();
      } else {
        console.log('[BotManager] Bot is disabled in the current environment. Set NODE_ENV to "production" or ENABLE_BOT to "true" to start it.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start(); 