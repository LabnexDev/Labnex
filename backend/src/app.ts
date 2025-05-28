import express from 'express';
import aiRoutes from './routes/aiRoutes';

const app = express();

// ... existing code ...

app.use('/api/ai', aiRoutes);

// ... existing code ... 