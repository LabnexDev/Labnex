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
import botStatusRoutes from './routes/botStatus.routes';
import discordIntegrationRoutes from './routes/discordIntegrationRoutes';
import noteRoutes from './routes/noteRoutes';
import codeSnippetRoutes from './routes/codeSnippetRoutes';
import myTaskRoutes from './routes/myTaskRoutes';
import testRunnerRoutes from './routes/testRunnerRoutes';
import aiRoutes from './routes/aiRoutes';
import statsRoutes from './routes/statsRoutes';
import adminRoutes from './routes/adminRoutes';
import { setupWebSocket } from './utils/websocket';
import { createServer } from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
//line  
const app = express();
app.set('trust proxy', 1); // Trust the first hop from the proxy
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.LABNEX_FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bots', botStatusRoutes);
app.use('/api/integrations/discord', discordIntegrationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/snippets', codeSnippetRoutes);
app.use('/api/tasks', myTaskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', testRunnerRoutes);

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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start(); 