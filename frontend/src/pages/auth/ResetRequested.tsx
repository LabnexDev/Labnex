import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export default function ResetRequested() {
  const [params] = useSearchParams();
  const email = params.get('email');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lnx-bg)] dark:bg-gray-900 p-6">
      <div className="max-w-md w-full bg-[var(--lnx-surface)] dark:bg-gray-800/70 dark:glassmorphic shadow-2xl rounded-xl p-8 space-y-6 border border-[var(--lnx-border)] dark:border-gray-700/50 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your inbox</h2>
        <p className="text-gray-700 dark:text-gray-300">
          {email ? (
            <>We just sent a password reset link to <span className="font-medium">{email}</span>. It may take a couple of minutes to arrive.</>
          ) : (
            <>If an account with the provided email exists, a reset link is on its way.</>
          )}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Didn't receive anything after a few minutes? Check your spam folder or request a new link.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">Back to login</Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="tertiary" className="w-full">Return home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 