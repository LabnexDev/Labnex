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
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4F46E5;">🎉 You're on the Labnex Waitlist!</h2>
          <p>Hi there,</p>
          <p>Thanks for signing up for the Labnex waitlist! We're thrilled to have you interested in revolutionizing the development and testing workflow.</p>
          <p>You're now officially on the list, and we'll be in touch as soon as your early access account is ready. We're working hard to get Labnex into your hands.</p>
          <p>In the meantime, you can learn more about our vision at <a href="https://labnexdev.github.io/Labnex" style="color: #4F46E5; text-decoration: none;">labnexdev.github.io/Labnex</a>.</p>
          <p>Stay tuned!</p>
          <p>Best regards,<br>The Labnex Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;"/>
          <p style="font-size: 0.8em; color: #777;">If you did not request to join this waitlist, please ignore this email.</p>
        </div>
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