import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { TestCase } from '../models/TestCase';

export const searchController = {
  // Search projects with filtering and sorting
  async searchProjects(req: Request, res: Response) {
    try {
      const { query, sortBy = 'createdAt', sortOrder = 'desc', status, page = 1, limit = 10 } = req.query;
      
      const searchQuery: any = {};
      
      // Add text search if query exists
      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Add status filter if provided
      if (status) {
        searchQuery.status = status;
      }
      
      // Build sort object
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [projects, total] = await Promise.all([
        Project.find(searchQuery)
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .populate('owner', 'name email'),
        Project.countDocuments(searchQuery)
      ]);
      
      res.json({
        data: projects,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Error searching projects:', error);
      res.status(500).json({ message: 'Error searching projects', error });
    }
  },

  // Search test cases with filtering and sorting
  async searchTestCases(req: Request, res: Response) {
    try {
      const { 
        query, 
        projectId,
        sortBy = 'createdAt', 
        sortOrder = 'desc', 
        status,
        priority,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const searchQuery: any = {};
      
      // Add project filter if provided
      if (projectId) {
        searchQuery.project = projectId;
      }
      
      // Add text search if query exists
      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Add status filter if provided
      if (status) {
        searchQuery.status = status;
      }
      
      // Add priority filter if provided
      if (priority) {
        searchQuery.priority = priority;
      }
      
      // Build sort object
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [testCases, total] = await Promise.all([
        TestCase.find(searchQuery)
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .populate('project', 'name'),
        TestCase.countDocuments(searchQuery)
      ]);
      
      res.json({
        data: testCases,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Error searching test cases:', error);
      res.status(500).json({ message: 'Error searching test cases', error });
    }
  }
}; 