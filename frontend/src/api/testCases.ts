import axios from './axios';

export interface TestCase {
  _id: string;
  taskReferenceId?: string;
  project: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestCaseData {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedToId?: string;
}

export const getTestCases = async (projectId: string): Promise<TestCase[]> => {
  const { data } = await axios.get<TestCase[]>(`/projects/${projectId}/test-cases`);
  return data;
};

export const getTestCase = async (projectId: string, testCaseId: string): Promise<TestCase> => {
  const { data } = await axios.get<TestCase>(`/projects/${projectId}/test-cases/${testCaseId}`);
  return data;
};

export const createTestCase = async (
  projectId: string,
  testCaseData: CreateTestCaseData
): Promise<TestCase> => {
  const { data } = await axios.post<TestCase>(`/projects/${projectId}/test-cases`, testCaseData);
  return data;
};

export const updateTestCase = async (
  projectId: string,
  testCaseId: string,
  testCaseData: Partial<CreateTestCaseData>
): Promise<TestCase> => {
  const { data } = await axios.put<TestCase>(
    `/projects/${projectId}/test-cases/${testCaseId}`,
    testCaseData
  );
  return data;
};

export const updateTestCaseStatus = async (
  projectId: string,
  testCaseId: string,
  status: TestCase['status']
): Promise<TestCase> => {
  const { data } = await axios.patch<TestCase>(
    `/projects/${projectId}/test-cases/${testCaseId}/status`,
    { status }
  );
  return data;
};

export const deleteTestCase = async (projectId: string, testCaseId: string): Promise<void> => {
  await axios.delete(`/projects/${projectId}/test-cases/${testCaseId}`);
}; 