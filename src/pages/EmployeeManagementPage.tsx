import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { AppUser } from '../types';
import { Role, FIRESTORE_COLLECTIONS } from '../types';
import { LoadingSpinner } from '../components/ui/loading';
import UserList from '../components/admin/UserList';
import EditEmployeeContainer from '../components/admin/EditEmployeeContainer';

const EmployeeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const appUser = user as AppUser | null;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  const isManagerOrAdmin = appUser?.role === Role.ADMIN || 
                          appUser?.role === Role.MANAGER || 
                          appUser?.role === Role.SUPER_ADMIN;

  const fetchUsers = useCallback(async (currentSelectedId?: string) => {
    if (!appUser || !appUser.organizationId || !isManagerOrAdmin) {
      setIsLoading(false);
      setError("You do not have permission to view this page.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const usersCollectionRef = collection(firestore, FIRESTORE_COLLECTIONS.USERS);
      const usersQuery = query(
        usersCollectionRef,
        where('organizationId', '==', appUser.organizationId),
        orderBy('displayName', 'asc')
      );
      const querySnapshot = await getDocs(usersQuery);
      const fetchedUsers = querySnapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() as Omit<AppUser, 'uid'> 
      } as AppUser));

      setUsers(fetchedUsers);

      if (currentSelectedId) {
        const updatedUser = fetchedUsers.find(u => u.uid === currentSelectedId);
        setSelectedUser(updatedUser || null);
      } else if (fetchedUsers.length > 0) {
        setSelectedUser(fetchedUsers[0]);
      } else {
        setSelectedUser(null);
      }

    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data. Ensure Firestore indexes are configured.");
    } finally {
      setIsLoading(false);
    }
  }, [appUser, isManagerOrAdmin]);

  useEffect(() => {
    if (appUser?.organizationId) {
      fetchUsers();
    }
  }, [appUser?.organizationId, fetchUsers]);
  
  const handleUserSelect = (userToSelect: AppUser) => {
    setSelectedUser(userToSelect);
  };

  const handleEmployeeNav = (direction: 'prev' | 'next') => {
    if (!selectedUser) return;
    const currentIndex = users.findIndex(u => u.uid === selectedUser.uid);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < users.length) {
      setSelectedUser(users[newIndex]);
    }
  }
  
  const onUserUpdated = () => {
    fetchUsers(selectedUser?.uid);
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* User List Sidebar */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] bg-card border-r border-border flex flex-col">
        <UserList 
          users={users}
          onSelectUser={handleUserSelect}
          selectedUser={selectedUser}
          onUserListUpdate={onUserUpdated}
        />
      </div>
      
      {/* Employee Details */}
      <div className="flex-1 bg-background overflow-y-auto">
        {selectedUser ? (
          <EditEmployeeContainer 
            user={selectedUser} 
            allUsers={users} 
            onUserUpdated={onUserUpdated} 
            onEmployeeNav={handleEmployeeNav}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">No Employee Selected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select an employee from the list to view their details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagementPage;