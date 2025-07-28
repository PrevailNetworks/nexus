import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import type { AppUser } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface PayrollTabProps {
  user: AppUser;
  onUserUpdated: () => void;
}

const PayrollTab: React.FC<PayrollTabProps> = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    paidType: user.payroll?.paidType || 'hourly',
    payWage: user.payroll?.payWage || '',
    breakSetting: user.payroll?.breakSetting || 'unpaid',
    timeRounding: user.payroll?.timeRounding || 'exact',
    mileageRate: user.payroll?.reimbursementSettings?.mileageRate?.toString() || '',
    requireReceipt: user.payroll?.reimbursementSettings?.requireReceipt || false,
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
        payroll: {
          paidType: formData.paidType as 'hourly' | 'salary',
          payWage: formData.payWage,
          breakSetting: formData.breakSetting as 'paid' | 'unpaid',
          timeRounding: formData.timeRounding as 'exact' | '15min' | '6min',
          reimbursementSettings: {
            mileageRate: formData.mileageRate ? parseFloat(formData.mileageRate) : undefined,
            requireReceipt: formData.requireReceipt,
          },
        },
      };

      await updateDoc(userRef, updateData);
      setSuccess('Payroll settings updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating payroll settings:', err);
      setError('Failed to update payroll settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pay Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paidType">Pay Type</Label>
              <Select value={formData.paidType} onValueChange={(value) => handleInputChange('paidType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payWage">
                {formData.paidType === 'hourly' ? 'Hourly Rate' : 'Annual Salary'}
              </Label>
              <Input
                id="payWage"
                value={formData.payWage}
                onChange={(e) => handleInputChange('payWage', e.target.value)}
                placeholder={formData.paidType === 'hourly' ? '$15.00' : '$50000'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breakSetting">Break Setting</Label>
              <Select value={formData.breakSetting} onValueChange={(value) => handleInputChange('breakSetting', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid Breaks</SelectItem>
                  <SelectItem value="unpaid">Unpaid Breaks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timeRounding">Time Rounding</Label>
              <Select value={formData.timeRounding} onValueChange={(value) => handleInputChange('timeRounding', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">No Rounding</SelectItem>
                  <SelectItem value="15min">15 Minutes</SelectItem>
                  <SelectItem value="6min">6 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reimbursement Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mileageRate">Mileage Rate (per mile)</Label>
            <Input
              id="mileageRate"
              value={formData.mileageRate}
              onChange={(e) => handleInputChange('mileageRate', e.target.value)}
              placeholder="0.58"
              type="number"
              step="0.01"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="requireReceipt"
              type="checkbox"
              checked={formData.requireReceipt}
              onChange={(e) => handleInputChange('requireReceipt', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="requireReceipt">Require receipt for reimbursements</Label>
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

export default PayrollTab;