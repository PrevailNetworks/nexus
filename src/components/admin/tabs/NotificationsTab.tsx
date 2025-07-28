import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import type { AppUser } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';

interface NotificationsTabProps {
  user: AppUser;
  onUserUpdated: () => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    primaryEmail: user.notifications?.primaryEmail || user.email || '',
    secondaryEmail: user.notifications?.secondaryEmail || '',
    alertOnClockIn: user.notifications?.alertOnClockIn ?? false,
    alertOnClockOut: user.notifications?.alertOnClockOut ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
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
      
      const updateData = {
        notifications: {
          primaryEmail: formData.primaryEmail,
          secondaryEmail: formData.secondaryEmail,
          alertOnClockIn: formData.alertOnClockIn,
          alertOnClockOut: formData.alertOnClockOut,
        },
      };

      await updateDoc(userRef, updateData);
      setSuccess('Notification settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryEmail">Primary Email</Label>
            <Input
              id="primaryEmail"
              type="email"
              value={formData.primaryEmail}
              onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
              placeholder="user@company.com"
            />
          </div>

          <div>
            <Label htmlFor="secondaryEmail">Secondary Email (Optional)</Label>
            <Input
              id="secondaryEmail"
              type="email"
              value={formData.secondaryEmail}
              onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
              placeholder="personal@email.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Clock Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="alertOnClockIn"
              checked={formData.alertOnClockIn}
              onCheckedChange={(checked) => handleInputChange('alertOnClockIn', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="alertOnClockIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Send alert when employee clocks in
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email notification when this employee starts their shift
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="alertOnClockOut"
              checked={formData.alertOnClockOut}
              onCheckedChange={(checked) => handleInputChange('alertOnClockOut', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="alertOnClockOut" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Send alert when employee clocks out
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email notification when this employee ends their shift
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

export default NotificationsTab;