import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { LoadingSpinner } from '../../ui/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser, Organization } from '../../../types';

interface PTOTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

const PTOTab: React.FC<PTOTabProps> = ({ user, onUserUpdated }) => {
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [ptoBalances, setPtoBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!user.organizationId) return;
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch organization settings for leave types
      const orgDocRef = doc(firestore, FIRESTORE_COLLECTIONS.ORGANIZATIONS, user.organizationId);
      const orgDocSnap = await getDoc(orgDocRef);
      
      if (orgDocSnap.exists()) {
        const orgData = orgDocSnap.data() as Organization;
        const orgLeaveTypes = orgData?.settings?.timeOffPolicies?.leaveTypes || ['Vacation', 'Sick Leave', 'Personal'];
        setLeaveTypes(orgLeaveTypes);
        
        // Initialize PTO balances from user data
        const userBalances = user.ptoBalances || {};
        const initialBalances: Record<string, number> = {};
        orgLeaveTypes.forEach(type => {
          initialBalances[type] = userBalances[type] || 0;
        });
        setPtoBalances(initialBalances);
      }
    } catch (err) {
      console.error('Error fetching PTO data:', err);
      setError('Failed to load PTO settings.');
    } finally {
      setIsLoading(false);
    }
  }, [user.organizationId, user.ptoBalances]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBalanceChange = (leaveType: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPtoBalances(prev => ({
      ...prev,
      [leaveType]: numericValue
    }));
    setError(null);
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess('');

    try {
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid);
      await updateDoc(userDocRef, { 
        ptoBalances: ptoBalances 
      });
      
      setSuccess('PTO balances updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating PTO balances:', err);
      setError('Failed to update PTO balances');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PTO Balances</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage the employee's paid time off balances for different leave types.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PTO Code</TableHead>
                  <TableHead>Used Hours (YTD)</TableHead>
                  <TableHead>Available Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.length > 0 ? (
                  leaveTypes.map(type => (
                    <TableRow key={type}>
                      <TableCell className="font-medium">{type}</TableCell>
                      <TableCell className="text-muted-foreground">
                        0.00 (placeholder)
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            value={ptoBalances[type] || 0}
                            onChange={(e) => handleBalanceChange(type, e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No leave types configured for the organization.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
          
          {leaveTypes.length === 0 && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                To manage PTO balances, your organization administrator needs to configure leave types 
                in the organization settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Button 
          type="submit" 
          disabled={isSubmitting || leaveTypes.length === 0}
        >
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Save PTO Balances
        </Button>
      </div>
    </form>
  );
};

export default PTOTab;