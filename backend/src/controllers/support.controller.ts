import { Request, Response } from 'express';
import { sendSupportEmail } from '../services/email.service';

export const handleSupportRequest = async (req: Request, res: Response) => {
    const { subject, message, category, name: bodyName, email: bodyEmail } = req.body;
    const user = req.user;

    const fromEmail = user?.email || bodyEmail;
    const fromName = user?.name || bodyName;

    if (!subject || !message || !category || !fromName || !fromEmail) {
        return res.status(400).json({ message: 'Name, email, subject, message, and category are required' });
    }

    try {
        await sendSupportEmail({
            from: fromEmail,
            name: fromName,
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