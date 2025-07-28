import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { LoadingSpinner } from '../../ui/loading';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser } from '../../../types';

interface ContractTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

const toISODateString = (date: any) => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date.toDate) {
    const d = date.toDate();
    const adjustedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
  }
  return '';
};

const ContractTab: React.FC<ContractTabProps> = ({ user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    contractId: user.contractId || '',
    contractCountry: user.contractCountry || '',
    taxResidencyDate: toISODateString(user.taxResidencyDate),
    contractEndDate: toISODateString(user.contractEndDate),
    jobLevel: user.jobLevel || '',
    expectedWorkHours: user.expectedWorkHours || '',
    employmentStatus: user.employmentStatus || '',
    workingScope: user.workingScope || '',
    firstPaymentAmount: user.firstPaymentAmount || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | number) => {
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
      const updateData: any = {
        contractId: formData.contractId,
        contractCountry: formData.contractCountry,
        jobLevel: formData.jobLevel,
        expectedWorkHours: formData.expectedWorkHours ? Number(formData.expectedWorkHours) : null,
        employmentStatus: formData.employmentStatus,
        workingScope: formData.workingScope,
        firstPaymentAmount: formData.firstPaymentAmount ? Number(formData.firstPaymentAmount) : null,
      };

      // Handle date conversions
      if (formData.taxResidencyDate) {
        updateData.taxResidencyDate = Timestamp.fromDate(new Date(formData.taxResidencyDate));
      }
      if (formData.contractEndDate) {
        updateData.contractEndDate = Timestamp.fromDate(new Date(formData.contractEndDate));
      }

      await updateDoc(userDocRef, updateData);
      setSuccess('Contract information updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating contract information:', err);
      setError('Failed to update contract information');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contract Position Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobLevel">Job Level</Label>
              <Input
                id="jobLevel"
                value={formData.jobLevel}
                onChange={(e) => handleInputChange('jobLevel', e.target.value)}
                placeholder="e.g., Senior, Junior, Lead"
              />
            </div>
            <div>
              <Label htmlFor="expectedWorkHours">Expected Work Hours per Week</Label>
              <Input
                id="expectedWorkHours"
                type="number"
                value={formData.expectedWorkHours}
                onChange={(e) => handleInputChange('expectedWorkHours', e.target.value)}
                placeholder="40"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="employmentStatus">Employment Status</Label>
            <Select 
              value={formData.employmentStatus} 
              onValueChange={(value) => handleInputChange('employmentStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fulltime">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Working Scope */}
      <Card>
        <CardHeader>
          <CardTitle>Working Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="workingScope">Responsibilities and Scope of Work</Label>
            <Textarea
              id="workingScope"
              value={formData.workingScope}
              onChange={(e) => handleInputChange('workingScope', e.target.value)}
              placeholder="Describe the employee's responsibilities and scope of work..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="firstPaymentAmount">First Payment Amount</Label>
            <Input
              id="firstPaymentAmount"
              type="number"
              value={formData.firstPaymentAmount}
              onChange={(e) => handleInputChange('firstPaymentAmount', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractId">Contract ID</Label>
              <Input
                id="contractId"
                value={formData.contractId}
                onChange={(e) => handleInputChange('contractId', e.target.value)}
                placeholder="CONTRACT-001"
              />
            </div>
            <div>
              <Label htmlFor="contractCountry">Country of Tax Residence</Label>
              <Input
                id="contractCountry"
                value={formData.contractCountry}
                onChange={(e) => handleInputChange('contractCountry', e.target.value)}
                placeholder="United States"
              />
            </div>
            <div>
              <Label htmlFor="taxResidencyDate">Effective Date of Tax Residency</Label>
              <Input
                id="taxResidencyDate"
                type="date"
                value={formData.taxResidencyDate}
                onChange={(e) => handleInputChange('taxResidencyDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contractEndDate">Contract End Date</Label>
              <Input
                id="contractEndDate"
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
              />
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
          Save Contract Information
        </Button>
      </div>
    </form>
  );
};

export default ContractTab;