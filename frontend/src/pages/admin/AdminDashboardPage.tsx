import React from 'react';
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { getWaitlistEntries, approveWaitlistUser } from '../../api/adminApi';
import type { WaitlistEntry as WaitlistEntryType, ApprovedUserData } from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const WAITLIST_QUERY_KEY: QueryKey = ['waitlistEntries'] as const;

const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: waitlistEntries,
    isLoading: isLoadingWaitlist,
    error: waitlistError,
    refetch: refetchWaitlist
  } = useQuery({
    queryKey: WAITLIST_QUERY_KEY,
    queryFn: getWaitlistEntries,
  });

  const approveUserMutation = useMutation({
    mutationFn: approveWaitlistUser,
    onSuccess: (data: ApprovedUserData, email: string) => {
      toast.success(`User ${email} approved successfully! Account created.`);
      if(data.generatedPasswordInfo) {
        toast.success(data.generatedPasswordInfo, { duration: 8000, id: `approve-info-${email}` });
      }
      queryClient.invalidateQueries({ queryKey: WAITLIST_QUERY_KEY });
    },
    onError: (error: Error, email: string) => {
      toast.error(`Failed to approve ${email}: ${error.message}`);
    },
  });

  const handleApproveUser = (email: string) => {
    approveUserMutation.mutate(email);
  };

  if (isLoadingWaitlist) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (waitlistError) {
    toast.error(`Failed to fetch waitlist: ${waitlistError.message}`, { id: 'fetch-waitlist-error' });
    return (
      <div className="p-4 text-red-500">
        Error fetching waitlist: {waitlistError.message} 
        <Button onClick={() => refetchWaitlist && refetchWaitlist()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">Admin Dashboard - Waitlist Management</h1>
      
      {waitlistEntries && waitlistEntries.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg bg-gray-800">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {waitlistEntries.map((entry: WaitlistEntryType) => (
                <tr key={entry._id} className="hover:bg-gray-750 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{entry.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveUser(entry.email)}
                      isLoading={approveUserMutation.status === 'pending' && approveUserMutation.variables === entry.email}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={approveUserMutation.status === 'pending' && approveUserMutation.variables === entry.email}
                    >
                      Approve & Create Account
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400 text-center py-10">The waitlist is currently empty.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage; 