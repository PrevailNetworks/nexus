import React, { useState } from 'react';
import type { AppUser } from '../../types';
import { Role } from '../../types';
import { Avatar } from '../ui/avatar';
import { Input } from '../ui/input';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface UserListProps {
  users: AppUser[];
  onSelectUser: (user: AppUser) => void;
  selectedUser: AppUser | null;
  onUserListUpdate?: () => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onSelectUser,
  selectedUser,
  onUserListUpdate: _onUserListUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case Role.ADMIN:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case Role.MANAGER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case Role.EMPLOYEE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disabled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
          <Badge variant="secondary">{users.length}</Badge>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | 'all')}
          className="w-full p-2 border rounded-md text-sm bg-background"
        >
          <option value="all">All Roles</option>
          <option value={Role.EMPLOYEE}>Employee</option>
          <option value={Role.MANAGER}>Manager</option>
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.SUPER_ADMIN}>Super Admin</option>
        </select>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm || filterRole !== 'all' ? 'No employees match your search.' : 'No employees found.'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                onClick={() => onSelectUser(user)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  selectedUser?.uid === user.uid ? "bg-primary/10 border border-primary/20" : ""
                )}
              >
                <Avatar 
                  photoURL={user.photoURL} 
                  displayName={user.displayName} 
                  size="sm" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {user.displayName || 'Unknown User'}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getRoleColor(user.role))}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  {user.department && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.department}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(user.status || 'active'))}
                    >
                      {user.status || 'active'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;