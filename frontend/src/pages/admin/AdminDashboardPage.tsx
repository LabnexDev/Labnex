import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  getWaitlistEntries,
  approveWaitlistUser,
  getUserEngagementStats,
} from '../../api/adminApi';
import type {
  WaitlistEntry as WaitlistEntryType,
  ApprovedUserData,
  UserEngagementStat,
} from '../../api/adminApi';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const WAITLIST_QUERY_KEY: QueryKey = ['waitlistEntries'] as const;
const USER_ENGAGEMENT_STATS_QUERY_KEY: QueryKey = ['userEngagementStats'] as const;

type AdminTab = 'waitlist' | 'engagement';

const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('waitlist');

  const {
    data: waitlistEntries,
    isLoading: isLoadingWaitlist,
    error: waitlistError,
    refetch: refetchWaitlist
  } = useQuery({
    queryKey: WAITLIST_QUERY_KEY,
    queryFn: getWaitlistEntries,
  });

  const {
    data: engagementStats,
    isLoading: isLoadingEngagement,
    error: engagementError,
    refetch: refetchEngagement,
  } = useQuery({
    queryKey: USER_ENGAGEMENT_STATS_QUERY_KEY,
    queryFn: getUserEngagementStats,
    enabled: activeTab === 'engagement',
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

  const renderWaitlistTable = () => {
    if (isLoadingWaitlist) {
      return <div className="flex items-center justify-center py-10"><LoadingSpinner size="lg" /></div>;
    }
    if (waitlistError) {
      toast.error(`Failed to fetch waitlist: ${waitlistError.message}`, { id: 'fetch-waitlist-error' });
      return (
        <div className="p-4 text-red-400">
          Error fetching waitlist: {waitlistError.message}
          <Button onClick={() => refetchWaitlist && refetchWaitlist()} className="ml-4">Retry</Button>
        </div>
      );
    }
    if (!waitlistEntries || waitlistEntries.length === 0) {
      return <p className="text-gray-400 text-center py-10">The waitlist is currently empty.</p>;
    }
    return (
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
                    isLoading={approveUserMutation.isPending && approveUserMutation.variables === entry.email}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={approveUserMutation.isPending && approveUserMutation.variables === entry.email}
                  >
                    Approve & Create Account
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEngagementTable = () => {
    if (isLoadingEngagement) {
      return <div className="flex items-center justify-center py-10"><LoadingSpinner size="lg" /></div>;
    }
    if (engagementError) {
      toast.error(`Failed to fetch engagement stats: ${engagementError.message}`, { id: 'fetch-engagement-error' });
      return (
        <div className="p-4 text-red-400">
          Error fetching engagement stats: {engagementError.message}
          <Button onClick={() => refetchEngagement && refetchEngagement()} className="ml-4">Retry</Button>
        </div>
      );
    }
    if (!engagementStats || engagementStats.length === 0) {
      return <p className="text-gray-400 text-center py-10">No user engagement data available.</p>;
    }
    return (
      <div className="overflow-x-auto shadow-lg rounded-lg bg-gray-800">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Registered</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projects</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tasks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Test Cases</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Snippets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {engagementStats.map((stat: UserEngagementStat) => (
              <tr key={stat.id} className="hover:bg-gray-750 transition-colors duration-150">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">{stat.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100">{stat.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{stat.systemRole || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{new Date(stat.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                  {stat.lastLoginAt ? new Date(stat.lastLoginAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-200">{stat.projectsOwned}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-200">{stat.tasksCreated}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-200">{stat.testCasesCreated}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-200">{stat.notesCreated}</td>
                <td className="px-4 py-3 text-sm text-center text-gray-200">{stat.snippetsCreated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-purple-400">Admin Dashboard</h1>

      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                        ${activeTab === 'waitlist' 
                          ? 'border-purple-500 text-purple-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
          >
            Waitlist Management
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                        ${activeTab === 'engagement' 
                          ? 'border-purple-500 text-purple-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
          >
            User Engagement
          </button>
        </nav>
      </div>

      {activeTab === 'waitlist' && renderWaitlistTable()}
      {activeTab === 'engagement' && renderEngagementTable()}

    </div>
  );
};

export default AdminDashboardPage; 