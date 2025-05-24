import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TestCaseDetails } from '../TestCaseDetails';
import { getTestCase, updateTestCaseStatus, deleteTestCase } from '../../../api/testCases';

// Mock the API functions
jest.mock('../../../api/testCases', () => ({
  getTestCase: jest.fn(),
  updateTestCaseStatus: jest.fn(),
  deleteTestCase: jest.fn(),
}));

const mockTestCase = {
  id: '1',
  title: 'Test Login Functionality',
  description: 'Verify user can login with valid credentials',
  steps: ['Enter valid email', 'Enter valid password', 'Click login button'],
  expectedResult: 'User should be logged in successfully',
  status: 'PENDING',
  priority: 'HIGH',
  createdBy: { id: '1', name: 'John Doe' },
  createdAt: '2024-03-20T10:00:00Z',
  updatedAt: '2024-03-20T10:00:00Z',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/1/test-cases/1`]}>
        <Routes>
          <Route path="/projects/:id/test-cases/:testCaseId" element={<TestCaseDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TestCaseDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getTestCase as jest.Mock).mockResolvedValue(mockTestCase);
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders test case details after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Login Functionality')).toBeInTheDocument();
      expect(screen.getByText('Verify user can login with valid credentials')).toBeInTheDocument();
      expect(screen.getByText('Enter valid email')).toBeInTheDocument();
      expect(screen.getByText('User should be logged in successfully')).toBeInTheDocument();
    });
  });

  it('updates test case status when clicking status buttons', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Login Functionality')).toBeInTheDocument();
    });

    const passButton = screen.getByText('Pass');
    fireEvent.click(passButton);

    await waitFor(() => {
      expect(updateTestCaseStatus).toHaveBeenCalledWith('1', '1', 'PASSED');
    });
  });

  it('shows confirmation dialog when deleting test case', async () => {
    const mockConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Login Functionality')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete Test Case');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this test case?');
    expect(deleteTestCase).toHaveBeenCalledWith('1', '1');
  });

  it('handles error state', async () => {
    (getTestCase as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error loading test case')).toBeInTheDocument();
      expect(screen.getByText('Please try again later')).toBeInTheDocument();
    });
  });
}); 