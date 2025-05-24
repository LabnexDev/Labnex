import { useNavigate } from 'react-router-dom';
import type { TestCase } from '../../api/testCases';
import { UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface TestCaseCardProps {
  testCase: TestCase;
}

const statusColors = {
  PASSED: 'bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300',
};

const priorityColors = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-600/30 dark:text-red-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-600/30 dark:text-blue-300',
};

export function TestCaseCard({ testCase }: TestCaseCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${testCase.project._id}/test-cases/${testCase._id}`)}
      className="card p-5 group flex flex-col justify-between h-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-glow-blue-md"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            {testCase.taskReferenceId && (
              <span className="block text-xs font-mono text-gray-500 dark:text-gray-400 mb-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-sm inline-block">
                {testCase.taskReferenceId}
              </span>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
              {testCase.title}
            </h2>
          </div>
          <div className="flex flex-col space-y-1.5 items-end flex-shrink-0 ml-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-200 ${statusColors[testCase.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                }`}
            >
              {testCase.status}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-200 ${priorityColors[testCase.priority] || 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                }`}
            >
              {testCase.priority}
            </span>
          </div>
        </div>

        {testCase.description && (
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {testCase.description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
        {testCase.assignedTo && (
          <div className="flex items-center">
            <UserIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span>Assigned to: {testCase.assignedTo.name}</span>
          </div>
        )}
        <div className="flex items-center">
            <UserIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span>Created by: {testCase.createdBy.name}</span>
        </div>
        <div className="flex items-center">
          <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          <span>
            Last updated: {new Date(testCase.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
} 