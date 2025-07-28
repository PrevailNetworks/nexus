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

interface ScheduleTabProps {
  user: AppUser;
  onUserUpdated: () => void;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    allowedDeviationMinutes: user.scheduleSettings?.allowedDeviationMinutes?.toString() || '15',
    emailWeeklySchedule: user.scheduleSettings?.emailWeeklySchedule ?? false,
    emailMonthlySchedule: user.scheduleSettings?.emailMonthlySchedule ?? false,
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
        scheduleSettings: {
          allowedDeviationMinutes: parseInt(formData.allowedDeviationMinutes) || 15,
          emailWeeklySchedule: formData.emailWeeklySchedule,
          emailMonthlySchedule: formData.emailMonthlySchedule,
        },
      };

      await updateDoc(userRef, updateData);
      setSuccess('Schedule settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating schedule settings:', err);
      setError('Failed to update schedule settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="allowedDeviationMinutes">Allowed Schedule Deviation (minutes)</Label>
            <Input
              id="allowedDeviationMinutes"
              type="number"
              value={formData.allowedDeviationMinutes}
              onChange={(e) => handleInputChange('allowedDeviationMinutes', e.target.value)}
              placeholder="15"
              min="0"
              max="120"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many minutes early/late the employee can clock in/out before requiring manager approval
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailWeeklySchedule"
              checked={formData.emailWeeklySchedule}
              onCheckedChange={(checked) => handleInputChange('emailWeeklySchedule', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="emailWeeklySchedule" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email weekly schedule
              </Label>
              <p className="text-xs text-muted-foreground">
                Send employee their schedule every Sunday for the upcoming week
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailMonthlySchedule"
              checked={formData.emailMonthlySchedule}
              onCheckedChange={(checked) => handleInputChange('emailMonthlySchedule', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="emailMonthlySchedule" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email monthly schedule
              </Label>
              <p className="text-xs text-muted-foreground">
                Send employee their schedule on the last day of each month for the next month
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

export default ScheduleTab;