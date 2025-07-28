import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import type { AppUser } from '../../../types';
import { Role, FIRESTORE_COLLECTIONS } from '../../../types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface EmployeeInformationTabProps {
  user: AppUser;
  allUsers: AppUser[];
  onUserUpdated: () => void;
}

const EmployeeInformationTab: React.FC<EmployeeInformationTabProps> = ({
  user,
  allUsers,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    role: user.role,
    status: user.status || 'active',
    department: user.department || '',
    position: user.position || '',
    employeeId: user.employeeId || '',
    managerId: user.managerId || '',
    // Location
    addressLine: user.location?.addressLine || '',
    city: user.location?.city || '',
    state: user.location?.state || '',
    zip: user.location?.zip || '',
    // Phone
    cellPhone: user.phone?.cell || '',
    workPhone: user.phone?.work || '',
    homePhone: user.phone?.home || '',
    // Emergency Contact
    emergencyContactName: user.emergencyContact?.name || '',
    emergencyContactPhone: user.emergencyContact?.phone || '',
    emergencyContactRole: user.emergencyContact?.role || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
      
      const updateData: Partial<AppUser> = {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role as Role,
        status: formData.status as 'active' | 'disabled' | 'inactive',
        department: formData.department,
        position: formData.position,
        employeeId: formData.employeeId,
        managerId: formData.managerId || undefined,
        location: {
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        phone: {
          cell: formData.cellPhone,
          work: formData.workPhone,
          home: formData.homePhone,
        },
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          role: formData.emergencyContactRole,
        },
      };

      await updateDoc(userRef, updateData);
      setSuccess('Employee information updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const managers = allUsers.filter(u => 
    u.role === Role.MANAGER || u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => handleInputChange('employeeId', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Role & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.EMPLOYEE}>Employee</SelectItem>
                  <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="managerId">Manager</Label>
            <Select value={formData.managerId || 'none'} onValueChange={(value) => handleInputChange('managerId', value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {managers.map(manager => (
                  <SelectItem key={manager.uid} value={manager.uid}>
                    {manager.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cellPhone">Cell Phone</Label>
              <Input
                id="cellPhone"
                value={formData.cellPhone}
                onChange={(e) => handleInputChange('cellPhone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workPhone">Work Phone</Label>
              <Input
                id="workPhone"
                value={formData.workPhone}
                onChange={(e) => handleInputChange('workPhone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="homePhone">Home Phone</Label>
              <Input
                id="homePhone"
                value={formData.homePhone}
                onChange={(e) => handleInputChange('homePhone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="addressLine">Address</Label>
            <Input
              id="addressLine"
              value={formData.addressLine}
              onChange={(e) => handleInputChange('addressLine', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactRole">Relationship</Label>
              <Input
                id="emergencyContactRole"
                value={formData.emergencyContactRole}
                onChange={(e) => handleInputChange('emergencyContactRole', e.target.value)}
                placeholder="e.g., Spouse, Parent, Friend"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeInformationTab;