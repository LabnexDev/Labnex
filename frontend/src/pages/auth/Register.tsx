import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const AuthLogo = () => (
  <div className="mx-auto h-12 w-auto text-center">
    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">Labnex</span>
  </div>
);

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({ name, email, password });
      toast.success('Registration successful! Welcome to Labnex.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lnx-bg)] dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AuthLogo />
        <div className="bg-[var(--lnx-surface)] dark:bg-gray-800/70 dark:glassmorphic shadow-2xl rounded-xl p-8 sm:p-10 space-y-8 border border-[var(--lnx-border)] dark:border-gray-700/50">
          <div>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Create your Labnex account
            </h2>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              label="Full name"
            />
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 characters)"
              label="Password"
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              label="Confirm password"
            />

            <div>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                isLoading={isLoading}
              >
                Create account
              </Button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 