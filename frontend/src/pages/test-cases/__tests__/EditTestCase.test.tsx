import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditTestCase } from '../EditTestCase';
import { getTestCase, updateTestCase } from '../../../api/testCases';

// Mock the API functions
jest.mock('../../../api/testCases', () => ({
  getTestCase: jest.fn(),
  updateTestCase: jest.fn(),
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
      <MemoryRouter initialEntries={[`/projects/1/test-cases/1/edit`]}>
        <Routes>
          <Route path="/projects/:id/test-cases/:testCaseId/edit" element={<EditTestCase />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EditTestCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getTestCase as jest.Mock).mockResolvedValue(mockTestCase);
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders form with test case data after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Login Functionality')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Verify user can login with valid credentials')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Enter valid email')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User should be logged in successfully')).toBeInTheDocument();
    });
  });

  it('adds new test step when clicking Add Step button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Step')).toBeInTheDocument();
    });

    const addStepButton = screen.getByText('Add Step');
    fireEvent.click(addStepButton);

    const stepInputs = screen.getAllByPlaceholderText(/Step \d+/);
    expect(stepInputs.length).toBe(mockTestCase.steps.length + 1);
  });

  it('removes test step when clicking Remove button', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Step')).toBeInTheDocument();
    });

    const addStepButton = screen.getByText('Add Step');
    fireEvent.click(addStepButton);

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    const stepInputs = screen.getAllByPlaceholderText(/Step \d+/);
    expect(stepInputs.length).toBe(mockTestCase.steps.length);
  });

  it('shows error message when submitting empty form', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Step')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('Enter test case title');
    fireEvent.change(titleInput, { target: { value: '' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('submits form with updated data', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Add Step')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('Enter test case title');
    fireEvent.change(titleInput, { target: { value: 'Updated Test Case' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateTestCase).toHaveBeenCalledWith('1', '1', expect.objectContaining({
        title: 'Updated Test Case',
      }));
    });
  });

  it('handles error state', async () => {
    (getTestCase as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error loading test case')).toBeInTheDocument();
    });
  });
}); 