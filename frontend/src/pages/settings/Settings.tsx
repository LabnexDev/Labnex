import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  updateProfile, 
  updatePassword, 
  updateNotificationPreferences, 
  type User, // Import User type
  type UpdateProfileData, 
  type UpdatePasswordData, 
  type UpdateNotificationPreferencesData 
} from '../../api/users';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../components/common/LoadingSpinner'; // Added LoadingSpinner import
import { Link } from 'react-router-dom'; // Import Link for navigation
import { CogIcon } from '@heroicons/react/24/outline'; // Example icon for integrations

// Custom Toggle Switch Component
interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  srLabel?: string; // Screen-reader only label
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, srLabel, disabled }) => {
  const uniqueId = id || `toggle-${React.useId()}`;
  return (
    <div className="flex items-center">
      {label && <label htmlFor={uniqueId} className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <button
        id={uniqueId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out 
                    ${checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
        disabled={disabled}
      >
        <span className="sr-only">{srLabel || label || 'Toggle'}</span>
        <span
          aria-hidden="true"
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out 
                      ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
};

const Settings: React.FC = () => {
  const { user, isLoading: isUserLoading } = useAuth();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'newPassword' || name === 'confirmPassword' || name === 'currentPassword') {
      setPasswordError('');
    }
  };

  // Corrected mutation generics and onSuccess data handling
  const profileMutation = useMutation<{ user: User }, Error, UpdateProfileData>({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    },
  });

  const passwordMutation = useMutation<{ message: string }, Error, UpdatePasswordData>({
    mutationFn: updatePassword,
    onSuccess: (data) => { // data is { message: string }
      toast.success(data.message || 'Password updated successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setPasswordError('');
    },
    onError: (error: any) => {
      setPasswordError(error.response?.data?.message || 'Failed to update password.');
    },
  });

  const notificationPrefsMutation = useMutation<{ user: User }, Error, UpdateNotificationPreferencesData>({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] }); // This will refetch user context
      toast.success('Notification preferences updated.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notification preferences.');
    },
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const profileDataToUpdate: UpdateProfileData = {};
    if (formData.name !== user?.name) profileDataToUpdate.name = formData.name;
    if (formData.email !== user?.email) profileDataToUpdate.email = formData.email;

    let profileUpdatedSuccessfully = true;
    if (Object.keys(profileDataToUpdate).length > 0) {
      try {
        await profileMutation.mutateAsync(profileDataToUpdate);
      } catch (error) {
        profileUpdatedSuccessfully = false;
        // Error is handled by profileMutation.onError
      }
    }

    let passwordChangeAttempted = false;
    let passwordChangedSuccessfully = true;
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      passwordChangeAttempted = true;
      if (!formData.currentPassword) {
        setPasswordError('Current password is required to change password.');
        passwordChangedSuccessfully = false;
      } else if (!formData.newPassword) {
        setPasswordError('New password is required.');
        passwordChangedSuccessfully = false;
      } else if (formData.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long.');
        passwordChangedSuccessfully = false;
      } else if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('New passwords do not match.');
        passwordChangedSuccessfully = false;
      } else {
        try {
          await passwordMutation.mutateAsync({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          });
        } catch (error) {
          passwordChangedSuccessfully = false;
          // Error is handled by passwordMutation.onError
        }
      }
    }
    
    if (profileUpdatedSuccessfully && (!passwordChangeAttempted || passwordChangedSuccessfully)) {
      setIsEditingProfile(false);
    }
  };
  
  const handleNotificationToggle = (checked: boolean) => {
    notificationPrefsMutation.mutate({ emailNotifications: checked });
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      {/* Appearance Section */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Customize the look and feel of Labnex.</p>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-white">Theme</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>
      </section>

      {/* Profile Section */}
      <section className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Profile Information</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your personal details and password.</p>
          </div>
          <Button 
            variant={isEditingProfile ? "tertiary" : "secondary"} 
            onClick={() => {
              setIsEditingProfile(!isEditingProfile);
              if (isEditingProfile) { // If was editing and now canceling
                setFormData(prev => ({ // Reset form to user's current data
                  ...prev,
                  name: user?.name || '',
                  email: user?.email || '',
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                }));
                setPasswordError('');
              }
            }}
            className="w-full sm:w-auto"
          >
            {isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <Input
              label="Full Name"
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={profileMutation.isPending}
            />
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={profileMutation.isPending}
            />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Leave blank if you don't want to change your password.</p>
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  disabled={passwordMutation.isPending}
                />
                <Input
                  label="New Password"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  disabled={passwordMutation.isPending}
                />
                <Input
                  label="Confirm New Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  disabled={passwordMutation.isPending}
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                variant="primary"
                isLoading={profileMutation.isPending || passwordMutation.isPending}
                disabled={profileMutation.isPending || passwordMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-1/4">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:w-3/4">{user?.name}</dd>
            </div>
            <div className="flex flex-col sm:flex-row">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-1/4">Email Address</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:w-3/4">{user?.email}</dd>
            </div>
             <div className="flex flex-col sm:flex-row">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-1/4">Password</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:w-3/4">******** (Last updated: N/A)</dd> {/* Placeholder for password last updated */} 
            </div>
          </div>
        )}
      </section>

      {/* Integrations Section - New */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Application Integrations</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage your connections to third-party services like Discord.</p>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-white">Discord Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Link your Discord account to enable bot features and notifications.
            </p>
          </div>
          <Link to="/settings/integrations">
            <Button 
              variant="secondary" 
              leftIcon={<CogIcon className="h-5 w-5" />}
            >
              Manage Discord
            </Button>
          </Link>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="card p-6 sm:p-8">
         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
         <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage how you receive notifications from Labnex.</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-white">Email Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receive important updates and alerts via email.</p>
          </div>
          <ToggleSwitch 
            checked={user?.emailNotifications || false} 
            onChange={handleNotificationToggle} 
            srLabel="Toggle Email Notifications"
            disabled={notificationPrefsMutation.isPending}
          />
        </div>
        {/* Add more notification preferences here as needed */}
      </section>

    </div>
  );
};

export default Settings; 