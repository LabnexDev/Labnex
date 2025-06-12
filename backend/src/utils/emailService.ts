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
  from = 'Labnex Notifications <noreply@contact.labnex.dev>' 
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
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`Resend API returned an error for ${to}:`, error);
      // throw new Error(`Resend API Error: ${error.message}`); // Optionally rethrow
      return; // Stop further processing if Resend itself reported an error in the response object
    }

    console.log(`Email sent successfully via Resend to ${to} with subject "${subject}". Resend ID: ${data?.id}`);
  } catch (error: any) { // Catching 'any' to inspect the error object more broadly
    console.error(`Failed to send email to ${to} due to an exception:`, error);
    // Log the full error object if possible, or specific properties
    if (error.response && error.response.data) {
      console.error('Resend error response data:', error.response.data);
    }
    // Decide if this error should be re-thrown or handled
    // throw error; // Re-throwing to see it clearly in Render logs for now
  }
}; 