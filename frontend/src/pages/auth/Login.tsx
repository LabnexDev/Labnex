import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { forgotPassword } from '../../api/auth';

const AuthLogo = () => (
  <div className="mx-auto h-12 w-auto text-center">
    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">Labnex</span>
  </div>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success('Login successful!');
      // Navigation is handled by AuthContext
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }
    try {
      await forgotPassword(forgotEmail);
      toast.success('Password reset link sent!');
      setIsForgotOpen(false);
      navigate(`/reset-requested?email=${encodeURIComponent(forgotEmail)}`);
    } catch (err: any) {
      console.error(err);
      toast.success('If the email exists, a reset link has been sent.');
      setIsForgotOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lnx-bg)] dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AuthLogo />
        <div className="bg-[var(--lnx-surface)] dark:bg-gray-800/70 dark:glassmorphic shadow-2xl rounded-xl p-8 sm:p-10 space-y-8 border border-[var(--lnx-border)] dark:border-gray-700/50">
          <div>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              label="Email address"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              label="Password"
            />
            <div className="text-right -mt-4 mb-2">
              <button type="button" onClick={() => setIsForgotOpen(true)} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Forgot password?</button>
            </div>
            
            <div>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Password" size="sm" >
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Enter the email associated with your account and we'll send you a link to reset your password.</p>
        <Input
          id="forgotEmail"
          name="forgotEmail"
          type="email"
          placeholder="you@example.com"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          label="Email address"
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="tertiary" onClick={() => setIsForgotOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleForgotPassword}>Send Reset Link</Button>
        </div>
      </Modal>
    </div>
  );
} 