import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { LoadingSpinner } from '../../ui/loading';
import { DollarSign } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser } from '../../../types';

interface ReimbursementTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

const ReimbursementTab: React.FC<ReimbursementTabProps> = ({ user, onUserUpdated }) => {
  const reimbursementSettings = user.payroll?.reimbursementSettings || {};
  
  const [formData, setFormData] = useState({
    mileageRate: reimbursementSettings.mileageRate || 0,
    requireReceipt: reimbursementSettings.requireReceipt || false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
      
      // Update the nested payroll.reimbursementSettings object
      const updateData = {
        'payroll.reimbursementSettings': {
          mileageRate: Number(formData.mileageRate),
          requireReceipt: formData.requireReceipt,
        }
      };

      await updateDoc(userDocRef, updateData);
      
      setSuccess('Reimbursement settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating reimbursement settings:', err);
      setError('Failed to update reimbursement settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Reimbursement Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure reimbursement rates and policies for this employee.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mileage Pay Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Mileage Pay
            </h3>
            <div className="flex items-end space-x-2">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="mileageRate">Rate</Label>
                <Input
                  id="mileageRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mileageRate}
                  onChange={(e) => handleInputChange('mileageRate', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <span className="pb-2 text-muted-foreground">per mile</span>
            </div>
          </div>

          {/* Receipt Requirements Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Receipt Requirements
            </h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireReceipt"
                checked={formData.requireReceipt}
                onCheckedChange={(checked) => 
                  handleInputChange('requireReceipt', checked === true)
                }
              />
              <Label 
                htmlFor="requireReceipt" 
                className="text-sm font-normal cursor-pointer"
              >
                Receipt required for reimbursement
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              When enabled, employees must provide receipts for expense reimbursements.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Save Reimbursement Settings
        </Button>
      </div>
    </form>
  );
};

export default ReimbursementTab;