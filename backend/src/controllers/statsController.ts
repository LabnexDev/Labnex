import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TestCase } from '../models/TestCase';
import { User } from '../models/User';
// Temporarily commented out due to missing model
// import { AICommand } from '../models/AICommand';
import { CodeSnippet } from '../models/CodeSnippet';
import { WaitlistEntry } from '../models/WaitlistEntry';
import { Resend } from 'resend';

// Instantiate Resend with API Key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Fetch platform statistics
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();
    const testCaseCount = await TestCase.countDocuments();
    const userCount = await User.countDocuments();
    // Placeholder for AICommand as model doesn't exist yet
    const aiCommandCount = 0;
    const snippetCount = await CodeSnippet.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        projects: projectCount,
        tasks: taskCount,
        testCases: testCaseCount,
        users: userCount,
        aiCommands: aiCommandCount,
        snippets: snippetCount
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add a new waitlist entry
export const addWaitlistEntry = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const existingEntry = await WaitlistEntry.findOne({ email });
    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in waitlist'
      });
    }

    const newEntry = new WaitlistEntry({ email });
    await newEntry.save();

    // Send welcome email after successfully saving to waitlist
    try {
      const emailHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Labnex!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #111827; /* slate-900 approximation */
      font-family: 'Inter', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1f2937; /* slate-800 approximation */
      color: #f3f4f6; /* gray-100 approximation */
      padding: 30px;
      border-radius: 8px;
    }
    .header h2 {
      color: #8b5cf6; /* A vibrant purple, similar to Labnex branding */
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
      color: #d1d5db; /* gray-300 approximation */
    }
    .content a {
      color: #60a5fa; /* A nice blue for links */
      text-decoration: none;
      font-weight: 600;
    }
    .button-cta {
      display: inline-block;
      background-color: #6366f1; /* Indigo, similar to your button gradients */
      color: #ffffff;
      padding: 12px 25px;
      text-align: center;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      color: #6b7280; /* gray-500 approximation */
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid #374151; /* slate-700 for divider */
      padding-top: 20px;
    }
    /* Responsive adjustments */
    @media screen and (max-width: 600px) {
      .email-container {
        padding: 20px;
      }
      .header h2 {
        font-size: 22px;
      }
      .content p {
        font-size: 15px;
      }
      .button-cta {
        padding: 10px 20px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111827;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="email-container" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              <div class="header">
                <h2>🎉 You're on the Labnex Waitlist!</h2>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>Thanks for signing up for the Labnex waitlist! We're thrilled to have you interested in revolutionizing the development and testing workflow.</p>
                <p>You're now officially on the list, and we'll be in touch as soon as your early access account is ready. We're working hard to get Labnex into your hands.</p>
                <p>In the meantime, you can learn more about our vision at <a href="https://labnexdev.github.io/Labnex">labnexdev.github.io/Labnex</a>.</p>
                <a href="https://labnexdev.github.io/Labnex" class="button-cta">Explore Labnex</a>
                <p>Stay tuned!</p>
                <p>Best regards,<br>The Labnex Team</p>
              </div>
              <div class="footer">
                <p>If you did not request to join this waitlist, please ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} Labnex. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      await resend.emails.send({
        from: 'Labnex Waitlist <onboarding@resend.dev>', // Using your Resend provided email
        to: email,
        subject: '🎉 You\'re on the Labnex Waitlist!',
        html: emailHtmlContent,
      });
      console.log(`Welcome email sent successfully to ${email} via Resend.`);

    } catch (emailError) {
      console.error(`Failed to send welcome email to ${email}:`, emailError);
      // Do not send error back to client for email failure, as waitlist entry was successful.
      // The primary operation (adding to waitlist) succeeded.
    }

    res.status(201).json({
      success: true,
      message: 'Successfully added to waitlist'
    });
  } catch (error) {
    console.error('Error adding waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 