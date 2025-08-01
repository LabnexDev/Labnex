import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supportRecipientEmail = process.env.SUPPORT_RECIPIENT_EMAIL || 'labnexcontact@gmail.com';

interface SupportEmailOptions {
    from: string;
    name: string;
    subject: string;
    message: string;
    category: 'technical' | 'billing' | 'feedback' | 'other';
}

export const sendSupportEmail = async (options: SupportEmailOptions) => {
    const { from, name, subject, message, category } = options;

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set. Email not sent.');
        // In a real app, you might want to handle this more gracefully
        // For this context, we'll throw an error to make it clear.
        throw new Error('Email service is not configured.');
    }

    try {
        await resend.emails.send({
            from: 'Labnex Support <support@contact.labnex.dev>', // Must be a verified domain on Resend
            to: [supportRecipientEmail],
            subject: `[Labnex Support] [${category.toUpperCase()}] ${subject}`,
            replyTo: from,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>New Support Request from Labnex</h2>
                    <p><strong>From:</strong> ${name} (${from})</p>
                    <p><strong>Category:</strong> ${category}</p>
                    <hr>
                    <h3>Message:</h3>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><small>This email was sent from the Labnex support form.</small></p>
                </div>
            `,
        });
        console.log(`Support email sent to ${supportRecipientEmail}`);
    } catch (error) {
        console.error('Error sending support email via Resend:', error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (toEmail: string, resetLink: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not set. Password reset email not sent.');
        return;
    }
    try {
        await resend.emails.send({
            from: 'Labnex Support <support@contact.labnex.dev>',
            to: [toEmail],
            subject: 'Labnex Password Reset',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your Labnex password. Click the button below to choose a new password:</p>
                    <p style="text-align:center; margin: 32px 0;">
                        <a href="${resetLink}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
                    </p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p>Link not working? Copy and paste this URL into your browser: <br />${resetLink}</p>
                    <hr />
                    <p style="font-size: 12px;">This link will expire in 1 hour for your security.</p>
                </div>
            `,
        });
        console.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}; 