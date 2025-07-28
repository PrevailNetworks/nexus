import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { LoadingSpinner } from '../../ui/loading';
import { Plus, Trash2, FileText } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import type { AppUser, TrainingRecord } from '../../../types';

interface TrainingTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated: () => void;
}

type TrainingStatus = 'pending' | 'completed';

const TrainingTab: React.FC<TrainingTabProps> = ({ user, onUserUpdated }) => {
  const [trainings, setTrainings] = useState<TrainingRecord[]>(user.trainings || []);
  const [newTrainingName, setNewTrainingName] = useState('');
  const [newTrainingDate, setNewTrainingDate] = useState('');
  const [newTrainingStatus, setNewTrainingStatus] = useState<TrainingStatus>('pending');
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddTraining = async () => {
    if (!newTrainingName || !newTrainingDate) return;
    setIsAdding(true);
    setError('');
    
    try {
      const localDate = new Date(newTrainingDate);
      const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

      let documentUrl = '';
      let documentName = '';

      // Upload file if provided
      if (trainingFile) {
        const fileExtension = trainingFile.name.split('.').pop();
        const storagePath = `training/${user.organizationId}/${user.uid}/${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, storagePath);
        
        await uploadBytes(storageRef, trainingFile);
        documentUrl = await getDownloadURL(storageRef);
        documentName = trainingFile.name;
      }

      const newTraining: TrainingRecord = {
        id: crypto.randomUUID(),
        name: newTrainingName,
        completedDate: Timestamp.fromDate(utcDate),
        status: newTrainingStatus,
        ...(documentUrl && { documentUrl, documentName }),
      };

      const updatedTrainings = [...trainings, newTraining];
      setTrainings(updatedTrainings);
      
      // Reset form
      setNewTrainingName('');
      setNewTrainingDate('');
      setNewTrainingStatus('pending');
      setTrainingFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('training-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Error adding training record:', err);
      setError('Failed to add training record');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTraining = (id: string) => {
    setTrainings(prev => prev.filter(t => t.id !== id));
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
      await updateDoc(userDocRef, { trainings });
      
      setSuccess('Training records updated successfully!');
      onUserUpdated();
    } catch (err) {
      console.error('Error updating training records:', err);
      setError('Failed to update training records');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Add New Training */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Training Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainingName">Training Name</Label>
              <Input
                id="trainingName"
                value={newTrainingName}
                onChange={(e) => setNewTrainingName(e.target.value)}
                placeholder="e.g., Safety Procedures"
              />
            </div>
            <div>
              <Label htmlFor="trainingDate">Completion Date</Label>
              <Input
                id="trainingDate"
                type="date"
                value={newTrainingDate}
                onChange={(e) => setNewTrainingDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="trainingStatus">Status</Label>
              <Select 
                value={newTrainingStatus} 
                onValueChange={(value: TrainingStatus) => setNewTrainingStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trainingFile">Attach Document (Optional)</Label>
              <Input
                id="training-file-input"
                type="file"
                onChange={(e) => setTrainingFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddTraining}
              disabled={!newTrainingName || !newTrainingDate || isAdding}
              className="gap-2"
            >
              {isAdding && <LoadingSpinner size="sm" />}
              Add Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Training History */}
      <Card>
        <CardHeader>
          <CardTitle>Training History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.length > 0 ? (
                  trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">{training.name}</TableCell>
                      <TableCell>
                        {training.completedDate.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={training.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            training.status === 'completed' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }
                        >
                          {training.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {training.documentUrl ? (
                          <a
                            href={training.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            {training.documentName || 'View Document'}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTraining(training.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No training records added.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Save Training Records
        </Button>
      </div>
    </form>
  );
};

export default TrainingTab;