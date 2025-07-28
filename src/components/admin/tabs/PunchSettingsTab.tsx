import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import type { AppUser } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';

interface PunchSettingsTabProps {
  user: AppUser;
  onUserUpdated: () => void;
}

const PunchSettingsTab: React.FC<PunchSettingsTabProps> = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    allowMobile: user.punchSettings?.allowMobile ?? true,
    trackGps: user.punchSettings?.trackGps ?? false,
    exemptFromAutoClockOut: user.punchSettings?.exemptFromAutoClockOut ?? false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: boolean) => {
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
        punchSettings: {
          allowMobile: formData.allowMobile,
          trackGps: formData.trackGps,
          exemptFromAutoClockOut: formData.exemptFromAutoClockOut,
        },
      };

      await updateDoc(userRef, updateData);
      setSuccess('Punch settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating punch settings:', err);
      setError('Failed to update punch settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Clock Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowMobile"
              checked={formData.allowMobile}
              onCheckedChange={(checked) => handleInputChange('allowMobile', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="allowMobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Allow Mobile Clock In/Out
              </Label>
              <p className="text-xs text-muted-foreground">
                Employee can clock in/out using mobile devices
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trackGps"
              checked={formData.trackGps}
              onCheckedChange={(checked) => handleInputChange('trackGps', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="trackGps" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Track GPS Location
              </Label>
              <p className="text-xs text-muted-foreground">
                Record GPS coordinates when employee clocks in/out
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exemptFromAutoClockOut"
              checked={formData.exemptFromAutoClockOut}
              onCheckedChange={(checked) => handleInputChange('exemptFromAutoClockOut', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="exemptFromAutoClockOut" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Exempt from Auto Clock Out
              </Label>
              <p className="text-xs text-muted-foreground">
                Employee will not be automatically clocked out at end of day
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

export default PunchSettingsTab;