import { Request, Response } from 'express';
import { AIMessage } from '../models/AIMessage';
import { JwtPayload } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const fetchMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { projectId, page = '1', limit = '30' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;

    const filter: any = { userId: currentUser.id };
    if (projectId) filter.projectId = projectId;

    const messages = await AIMessage.find(filter)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: messages.reverse() });
  } catch (error: any) {
    console.error('Error fetching AI messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveMessage = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { projectId, role, text, action } = req.body;
    if (!role || !text) {
      return res.status(400).json({ success: false, error: 'role and text are required' });
    }

    const msg = await AIMessage.create({
      projectId: projectId || undefined,
      userId: currentUser.id,
      role,
      text,
      action,
    });

    // Keep at most 500 messages per user/project to limit DB size
    if (projectId) {
      const count = await AIMessage.countDocuments({ userId: currentUser.id, projectId });
      if (count > 500) {
        const toDelete = await AIMessage.find({ userId: currentUser.id, projectId })
          .sort({ timestamp: 1 })
          .limit(count - 500);
        const ids = toDelete.map(d => d._id);
        await AIMessage.deleteMany({ _id: { $in: ids } });
      }
    }

    res.json({ success: true, data: msg });
  } catch (error: any) {
    console.error('Error saving AI message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}; 