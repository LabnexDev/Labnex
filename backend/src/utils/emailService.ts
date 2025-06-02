import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ 
  to, 
  subject, 
  html, 
  from = 'Labnex Onboarding <onboarding@resend.dev>' 
}: EmailOptions): Promise<void> => {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Skipping email sending.');
    // In a development environment, you might want to log the email content instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('---- EMAIL TO BE SENT ----');
      console.log('To:', to);
      console.log('From:', from);
      console.log('Subject:', subject);
      console.log('HTML (first 200 chars):', html.substring(0, 200) + '...');
      console.log('---- END OF EMAIL ----');
    }
    // For non-development, throw an error if not configured, or handle as per project policy
    // For now, we'll just log and return to avoid breaking flow if not critical for this step.
    // throw new Error('Email service is not configured: RESEND_API_KEY missing.');
    return; 
  }

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    // Decide if this error should be re-thrown or handled (e.g., logged to an error tracking service)
    // For now, re-throwing to make it visible during development if sending fails.
    throw error;
  }
}; 