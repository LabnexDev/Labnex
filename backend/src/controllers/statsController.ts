import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TestCase } from '../models/TestCase';
import { User } from '../models/User';
// Temporarily commented out due to missing model
// import { AICommand } from '../models/AICommand';
import { CodeSnippet } from '../models/CodeSnippet';
import { WaitlistEntry } from '../models/WaitlistEntry';

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