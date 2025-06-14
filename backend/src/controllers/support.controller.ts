import { Request, Response } from 'express';
import { sendSupportEmail } from '../services/email.service';

export const handleSupportRequest = async (req: Request, res: Response) => {
    const { subject, message, category } = req.body;
    const user = req.user;

    if (!subject || !message || !category) {
        return res.status(400).json({ message: 'Subject, message, and category are required' });
    }

    if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        await sendSupportEmail({
            from: user.email,
            name: user.name,
            subject,
            message,
            category
        });
        res.status(200).json({ message: 'Support request sent successfully' });
    } catch (error) {
        console.error('Failed to send support email:', error);
        res.status(500).json({ message: 'Failed to send support request' });
    }
}; 