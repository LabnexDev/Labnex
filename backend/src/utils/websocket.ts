import WebSocket from 'ws';
import { Server } from 'http';
import { handleWebSocketConnection } from '../controllers/testRunnerController';
import jwt from 'jsonwebtoken';
import { parse } from 'url';

export function setupWebSocket(server: Server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const { pathname, query } = parse(req.url || '', true);
    
    // Extract test run ID from path
    const pathMatch = pathname?.match(/\/test-runs\/([^\/]+)\/stream/);
    if (!pathMatch) {
      ws.close(1000, 'Invalid path');
      return;
    }

    const runId = pathMatch[1];

    // Authenticate WebSocket connection
    const token = req.headers.authorization?.replace('Bearer ', '') || query.token as string;
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      handleWebSocketConnection(ws, runId);
    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  return wss;
}
