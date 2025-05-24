import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ErrorMessageProps {
  message: string;
  title?: string;
}

export function ErrorMessage({ message, title = "An Error Occurred" }: ErrorMessageProps) {
  return (
    <div className="card bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600/70 p-4 sm:p-6 my-6" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-md font-semibold text-red-800 dark:text-red-200">{title}</h3>
          <div className="mt-1 text-sm text-red-700 dark:text-red-300">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 