import React, { useState, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectRoles, assignRole, removeRole, searchUsers } from '../../api/roles';
import type { Role, User } from '../../types/role';
import { RoleType } from '../../types/role'; // Removed Permission, rolePermissions as they are not used
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TrashIcon, UserPlusIcon, MagnifyingGlassIcon, UsersIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface TeamManagementProps {
  projectId: string;
  userRole: RoleType;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ projectId, userRole }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteUserSearchQuery, setInviteUserSearchQuery] = useState('');
  const [roleForNewInvite, setRoleForNewInvite] = useState<RoleType>(RoleType.TESTER);

  // State for Edit Role Modal
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Role | null>(null);
  const [newRoleForEdit, setNewRoleForEdit] = useState<RoleType>(RoleType.TESTER);

  const queryClient = useQueryClient();

  const { data: teamMembersData, isLoading: isTeamLoading } = useQuery<Role[]>({
    queryKey: ['projectRoles', projectId],
    queryFn: () => getProjectRoles(projectId),
  });

  const { data: userSearchResults, isLoading: isUserSearching } = useQuery<User[]>({
    queryKey: ['userSearch', inviteUserSearchQuery],
    queryFn: () => searchUsers(inviteUserSearchQuery),
    enabled: inviteUserSearchQuery.length > 2,
  });

  const assignRoleMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectRoles', projectId] });
      toast.success('Role updated successfully');
      // Close relevant modal
      if (isInviteModalOpen) {
        setIsInviteModalOpen(false);
        setInviteUserSearchQuery('');
      }
      if (isEditRoleModalOpen) {
        setIsEditRoleModalOpen(false);
        setEditingMember(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: assignRole, // This should ideally be a specific inviteUser function if backend logic differs
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectRoles', projectId] });
      toast.success('User invited successfully');
      setIsInviteModalOpen(false);
      setInviteUserSearchQuery('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to invite user');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => removeRole(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectRoles', projectId] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  });

  const canManageTeam = userRole === RoleType.PROJECT_OWNER;

  // This function is now only used by the Edit Role Modal's save action
  const handleRoleChange = (userId: string, newRole: RoleType) => {
    assignRoleMutation.mutate({
      userId,
      projectId,
      roleType: newRole
    });
  };
  
  const openEditRoleModal = (member: Role) => {
    setEditingMember(member);
    setNewRoleForEdit(member.type);
    setIsEditRoleModalOpen(true);
  };

  const handleSaveRoleChange = () => {
    if (editingMember) {
      handleRoleChange(editingMember.userId._id, newRoleForEdit);
    }
  };

  const handleRemoveMember = (userId: string) => {
    // Consider using a confirmation modal here instead of window.confirm for consistent UI
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate({ userId });
    }
  };

  const handleInviteUser = (userToInvite: User) => {
    inviteUserMutation.mutate({
      userId: userToInvite._id,
      projectId,
      roleType: roleForNewInvite
    });
  };

  const debouncedUserSearch = debounce((query: string) => {
    setInviteUserSearchQuery(query);
  }, 300);

  useEffect(() => {
    return () => {
      debouncedUserSearch.cancel();
    };
  }, [debouncedUserSearch]);

  const filteredTeamMembers = teamMembersData?.filter(member =>
    member.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.userId.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableUsersToInvite = userSearchResults?.filter(
    (user) => !teamMembersData?.some((member) => member.userId._id === user._id)
  );

  if (isTeamLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members ({filteredTeamMembers?.length || 0})</h3>
        {canManageTeam && (
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlusIcon className="h-5 w-5" />}
          >
            Invite Member
          </Button>
        )}
      </div>

      <Input
        type="text"
        placeholder="Search current team members..."
        value={searchQuery}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
      />

      {filteredTeamMembers && filteredTeamMembers.length > 0 ? (
        <div className="-mx-4 sm:-mx-6 mt-4 flow-root">
          <div className="inline-block min-w-full align-middle sm:px-6 lg:px-8 overflow-x-auto">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 table-fixed w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="w-3/5 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                    <th scope="col" className="w-24 sm:w-[150px] px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                    {canManageTeam && <th scope="col" className="w-20 sm:w-[100px] relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50 bg-white dark:bg-gray-800/50">
                  {filteredTeamMembers?.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150">
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-base font-medium text-gray-700 dark:text-gray-300">{member.userId.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-4 overflow-hidden">
                            <div className="font-medium text-gray-900 dark:text-white truncate">{member.userId.name}</div>
                            <div className="text-gray-500 dark:text-gray-400 truncate">{member.userId.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 text-center">
                        <span className={`inline-flex items-center rounded-md ${member.type === RoleType.PROJECT_OWNER ? 'px-1' : 'px-2'} py-1 text-xs font-medium ring-1 ring-inset ${ 
                          member.type === RoleType.PROJECT_OWNER
                            ? 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 ring-yellow-500/30 dark:ring-yellow-500/30'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 ring-gray-500/10 dark:ring-gray-500/30'
                        }`}>
                          {member.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {canManageTeam && (
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                          {member.type !== RoleType.PROJECT_OWNER && (
                            <>
                              <Button
                                variant="tertiary"
                                size="sm"
                                onClick={() => openEditRoleModal(member)}
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit Role"
                              >
                                <PencilSquareIcon className="h-5 w-5" />
                                <span className="sr-only">Edit Role</span>
                              </Button>
                              <Button
                                variant="tertiary"
                                size="sm"
                                onClick={() => handleRemoveMember(member.userId._id)}
                                isLoading={removeMemberMutation.isPending && removeMemberMutation.variables?.userId === member.userId._id}
                                className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1"
                                title="Remove Member"
                              >
                                <TrashIcon className="h-5 w-5" />
                                <span className="sr-only">Remove Member</span>
                              </Button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 card border-dashed">
            <UsersIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
            <h4 className="mt-2 text-md font-semibold text-gray-900 dark:text-white">No Team Members Yet</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {canManageTeam ? "Invite members to collaborate on this project." : "This project currently has no assigned team members."}
            </p>
            {canManageTeam && (
                <Button
                    variant="primary"
                    onClick={() => setIsInviteModalOpen(true)}
                    leftIcon={<UserPlusIcon className="h-5 w-5" />}
                    className="mt-4"
                >
                    Invite First Member
                </Button>
            )}
        </div>
      )}

      {/* Invite User Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite New Team Member">
        <div className="space-y-4 mt-4">
          <Input
            label="Search users by name or email"
            type="text"
            placeholder="Start typing to search... (min 3 chars)"
            onChange={(e: ChangeEvent<HTMLInputElement>) => debouncedUserSearch(e.target.value)}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') e.preventDefault(); }}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          />
          {isUserSearching && <LoadingSpinner size="sm" className="my-3"/>}
          
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {availableUsersToInvite && availableUsersToInvite.length > 0 ? (
              availableUsersToInvite?.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleInviteUser(user)}
                    isLoading={inviteUserMutation.isPending && inviteUserMutation.variables?.userId === user._id}
                  >
                    Invite as {roleForNewInvite.replace('_', ' ')}
                  </Button>
                </div>
              ))
            ) : (
              !isUserSearching && inviteUserSearchQuery.length > 2 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No users found matching your search, or all found users are already in the team.</p>
            )}
          </div>

          {availableUsersToInvite && availableUsersToInvite.length > 0 && (
             <Input
                as="select"
                label="Assign Role for New Invites" // Clarified label
                value={roleForNewInvite}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoleForNewInvite(e.target.value as RoleType)}
                hideLabel={false}
                className="max-w-xs" // Added for consistency
            >
                {Object.values(RoleType)
                .filter(role => role !== RoleType.PROJECT_OWNER)
                .map((roleValue) => (
                    <option key={roleValue} value={roleValue}>
                    {roleValue.replace(/_/g, ' ')}
                    </option>
                ))}
            </Input>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="tertiary" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      {editingMember && (
        <Modal
          isOpen={isEditRoleModalOpen}
          onClose={() => {
            setIsEditRoleModalOpen(false);
            setEditingMember(null);
          }}
          title={`Edit Role for ${editingMember?.userId.name}`}
        >
          <div className="space-y-4 mt-4">
            <Input
              as="select"
              label="Role"
              value={newRoleForEdit}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewRoleForEdit(e.target.value as RoleType)}
              className="max-w-xs" // Constrains width in modal
            >
              {Object.values(RoleType)
                .filter(role => role !== RoleType.PROJECT_OWNER) // Prevent assigning Project Owner
                .map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleValue.replace(/_/g, ' ')}
                  </option>
              ))}
            </Input>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="tertiary" onClick={() => {
              setIsEditRoleModalOpen(false);
              setEditingMember(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveRoleChange}
              isLoading={assignRoleMutation.isPending && assignRoleMutation.variables?.userId === editingMember?.userId._id && assignRoleMutation.variables?.roleType === newRoleForEdit}
            >
              Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};