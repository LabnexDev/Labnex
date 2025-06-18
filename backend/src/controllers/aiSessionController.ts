import { Request, Response } from 'express';
import { AISession } from '../models/AISession';
import { JwtPayload } from '../middleware/auth';

interface AuthRequest extends Request { user?: JwtPayload; }

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId, title } = req.body;
    const session = await AISession.create({ userId: currentUser.id, projectId, title });
    res.json({ success: true, data: session });
  } catch (e: any) {
    console.error('createSession', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

export const listSessions = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.query;
    const filter: any = { userId: currentUser.id, archived: false };
    if (projectId) filter.projectId = projectId;
    const sessions = await AISession.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (e: any) {
    console.error('listSessions', e);
    res.status(500).json({ success: false, error: e.message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const sessionId = req.params.id;
    const session = await AISession.findOne({ _id: sessionId, userId: currentUser.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    session.archived = true;
    await session.save();
    res.json({ success: true });
  } catch (e: any) {
    console.error('deleteSession', e);
    res.status(500).json({ success: false, error: e.message });
  }
}; 