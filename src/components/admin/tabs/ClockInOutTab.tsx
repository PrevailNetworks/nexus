import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { LoadingSpinner } from '../../ui/loading';
import { Smartphone, MapPin, Clock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser } from '../../../types';

interface ClockInOutTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

const ClockInOutTab: React.FC<ClockInOutTabProps> = ({ user, onUserUpdated }) => {
  const punchSettings = user.punchSettings || {
    allowMobile: false,
    trackGps: false,
    exemptFromAutoClockOut: false,
  };
  
  const [formData, setFormData] = useState({
    allowMobile: punchSettings.allowMobile || false,
    trackGps: punchSettings.trackGps || false,
    exemptFromAutoClockOut: punchSettings.exemptFromAutoClockOut || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckboxChange = (field: keyof typeof formData, value: boolean) => {
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
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
      
      // Update the nested punchSettings object
      const updateData = {
        'punchSettings.allowMobile': formData.allowMobile,
        'punchSettings.trackGps': formData.trackGps,
        'punchSettings.exemptFromAutoClockOut': formData.exemptFromAutoClockOut,
      };

      await updateDoc(userDocRef, updateData);
      
      setSuccess('Clock in/out settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating clock in/out settings:', err);
      setError('Failed to update clock in/out settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Punch Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Punch Methods
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how this employee can clock in and out of work.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowMobile"
              checked={formData.allowMobile}
              onCheckedChange={(checked) => 
                handleCheckboxChange('allowMobile', checked === true)
              }
            />
            <Label 
              htmlFor="allowMobile" 
              className="text-sm font-normal cursor-pointer"
            >
              Allow employee to clock in/out on mobile application
            </Label>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="trackGps"
              checked={formData.trackGps}
              onCheckedChange={(checked) => 
                handleCheckboxChange('trackGps', checked === true)
              }
            />
            <div className="flex-1">
              <Label 
                htmlFor="trackGps" 
                className="text-sm font-normal cursor-pointer flex items-center gap-1"
              >
                <MapPin className="h-4 w-4" />
                Track employees by GPS when clocked in on mobile application
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                When enabled, employee location will be recorded during mobile punch events.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Override */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automation Override
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure automatic clock-out behavior for this employee.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="exemptFromAutoClockOut"
              checked={formData.exemptFromAutoClockOut}
              onCheckedChange={(checked) => 
                handleCheckboxChange('exemptFromAutoClockOut', checked === true)
              }
            />
            <div className="flex-1">
              <Label 
                htmlFor="exemptFromAutoClockOut" 
                className="text-sm font-normal cursor-pointer"
              >
                Exempt from organization's auto clock-out setting
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                If checked, this employee will NOT be clocked out automatically, 
                even if the organization-wide setting is enabled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Save Clock In/Out Settings
        </Button>
      </div>
    </form>
  );
};

export default ClockInOutTab;