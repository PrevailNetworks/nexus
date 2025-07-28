import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { LoadingSpinner } from '../../ui/loading';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser, Role } from '../../../types';
import { Role as RoleEnum } from '../../../types';

interface PermissionsTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

interface RadioCardProps {
  value: Role;
  label: string;
  description: string;
  currentRole: Role;
  onChange: (role: Role) => void;
}

const RadioCard: React.FC<RadioCardProps> = ({ 
  value, 
  label, 
  description, 
  currentRole, 
  onChange 
}) => {
  const isChecked = currentRole === value;
  
  return (
    <div
      onClick={() => onChange(value)}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isChecked 
          ? 'bg-primary/5 border-primary shadow-md' 
          : 'bg-background hover:border-primary/50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Label className="font-semibold text-base cursor-pointer">{label}</Label>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="w-5 h-5 flex-shrink-0 mt-1 flex items-center justify-center rounded-full border-2 border-primary">
          {isChecked && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
        </div>
      </div>
    </div>
  );
};

const PermissionsTab: React.FC<PermissionsTabProps> = ({ user, onUserUpdated }) => {
  const [currentRole, setCurrentRole] = useState<Role>(user.role || RoleEnum.EMPLOYEE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
      await updateDoc(userDocRef, { role: currentRole });
      
      setSuccess('User permissions updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating user permissions:', err);
      setError('Failed to update user permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Role & Permissions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign a role to determine the user's access level and permissions within the application.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioCard
            value={RoleEnum.EMPLOYEE}
            label="Employee"
            description="Basic access. Can track their own time, view schedules, and request time off."
            currentRole={currentRole}
            onChange={handleRoleChange}
          />
          <RadioCard
            value={RoleEnum.MANAGER}
            label="Manager"
            description="Can manage schedules, approve timesheets, and oversee their assigned team members."
            currentRole={currentRole}
            onChange={handleRoleChange}
          />
          <RadioCard
            value={RoleEnum.ADMIN}
            label="Admin"
            description="Full access to all features, including company settings, billing, and all user management."
            currentRole={currentRole}
            onChange={handleRoleChange}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Button type="submit" disabled={isSubmitting || currentRole === user.role}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Save Permissions
        </Button>
      </div>
    </form>
  );
};

export default PermissionsTab;