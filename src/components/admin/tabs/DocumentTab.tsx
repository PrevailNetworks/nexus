import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { LoadingSpinner } from '../../ui/loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Upload, FileText, Download, Trash2, Eye } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import type { AppUser, EmployeeDocument, DocumentType } from '../../../types';
import { DocumentType as DocumentTypeEnum } from '../../../types';

interface DocumentTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated?: () => void;
}

const documentTypeConfig = {
  [DocumentTypeEnum.IDENTIFICATION]: { color: 'bg-blue-500', colorHex: '#3b82f6' },
  [DocumentTypeEnum.RESUME]: { color: 'bg-green-500', colorHex: '#10b981' },
  [DocumentTypeEnum.CERTIFICATIONS]: { color: 'bg-purple-500', colorHex: '#8b5cf6' },
  [DocumentTypeEnum.LICENSES]: { color: 'bg-orange-500', colorHex: '#f97316' },
  [DocumentTypeEnum.CONTRACTS]: { color: 'bg-red-500', colorHex: '#ef4444' },
  [DocumentTypeEnum.PERFORMANCE_REVIEW]: { color: 'bg-yellow-500', colorHex: '#eab308' },
  [DocumentTypeEnum.OTHER]: { color: 'bg-gray-500', colorHex: '#6b7280' },
};

const DocumentTab: React.FC<DocumentTabProps> = ({ user }) => {
  const { user: currentUser } = useAuth();
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [friendlyName, setFriendlyName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');

  useEffect(() => {
    setIsLoading(true);
    const docsCollectionRef = collection(firestore, `organizations/${user.organizationId}/documents`);
    const q = query(docsCollectionRef, orderBy('uploadTimestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EmployeeDocument))
        .filter(doc => doc.uploadedBy === user.uid); // Filter to only this user's documents
      setDocuments(docsData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching documents: ", err);
      setError("Failed to load documents.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, user.organizationId]);

  const handleFileUpload = async () => {
    if (!uploadFile || !friendlyName || !documentType || !currentUser) {
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Firebase Storage
      const fileExtension = uploadFile.name.split('.').pop();
      const storagePath = `documents/${user.organizationId}/${user.uid}/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, uploadFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Create document record in Firestore
      const docData: Omit<EmployeeDocument, 'id'> = {
        friendlyName,
        storagePath,
        originalFilename: uploadFile.name,
        documentType,
        uploadTimestamp: Timestamp.now(),
        uploadedBy: user.uid,
        uploadedByName: user.displayName || 'Unknown',
        fileType: uploadFile.type,
        downloadURL,
      };

      await addDoc(collection(firestore, `organizations/${user.organizationId}/documents`), docData);

      // Reset form
      setUploadFile(null);
      setFriendlyName('');
      setDocumentType('' as DocumentType | '');
      setUploadModalOpen(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (document: EmployeeDocument) => {
    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, document.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(firestore, `organizations/${user.organizationId}/documents`, document.id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.documentType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<DocumentType, EmployeeDocument[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
              </div>
              <div>
                <Label htmlFor="friendlyName">Document Name</Label>
                <Input
                  id="friendlyName"
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  placeholder="e.g., John's Resume"
                />
              </div>
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DocumentTypeEnum).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading || !uploadFile || !friendlyName || !documentType}
                >
                  {isUploading && <LoadingSpinner size="sm" className="mr-2" />}
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents by Type */}
      <div className="space-y-8">
        {Object.entries(documentTypeConfig).map(([type, config]) => {
          const typeDocuments = groupedDocuments[type as DocumentType];
          if (!typeDocuments || typeDocuments.length === 0) return null;

          return (
            <div key={type}>
              <h3 
                className="text-lg font-bold mb-3 pb-2 border-b-2"
                style={{ borderColor: config.colorHex }}
              >
                {type}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeDocuments.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-sm truncate">
                            {document.friendlyName}
                          </CardTitle>
                        </div>
                        <Badge 
                          className={`${config.color} text-white text-xs`}
                        >
                          {document.documentType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Uploaded: {document.uploadTimestamp.toDate().toLocaleDateString()}</p>
                        <p>By: {document.uploadedByName}</p>
                        <p>File: {document.originalFilename}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <a 
                            href={document.downloadURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <a 
                            href={document.downloadURL} 
                            download={document.originalFilename}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDocument(document)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {documents.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded for this employee yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentTab;