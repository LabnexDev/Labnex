import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { resetPassword } from '../../api/auth';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const id = searchParams.get('id') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ token, id, password });
      toast.success('Password reset successful! You can now log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--lnx-bg)] dark:bg-gray-900 p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-semibold">Invalid or expired reset link</h1>
          <Button variant="primary" to="/login">Back to login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--lnx-bg)] dark:bg-gray-900 p-6">
      <div className="max-w-md w-full bg-[var(--lnx-surface)] dark:bg-gray-800/70 dark:glassmorphic shadow-2xl rounded-xl p-8 space-y-6 border border-[var(--lnx-border)] dark:border-gray-700/50">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            id="password"
            name="password"
            type="password"
            required
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
          />
          <Button variant="primary" type="submit" className="w-full" isLoading={isSubmitting}>Reset Password</Button>
        </form>
      </div>
    </div>
  );
} 