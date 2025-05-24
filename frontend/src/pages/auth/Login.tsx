import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const AuthLogo = () => (
  <div className="mx-auto h-12 w-auto text-center">
    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">Labnex</span>
  </div>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AuthLogo />
        <div className="bg-white dark:bg-gray-800/70 dark:glassmorphic shadow-2xl rounded-xl p-8 sm:p-10 space-y-8 border dark:border-gray-700/50">
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
    </div>
  );
} 