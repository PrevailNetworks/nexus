import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { AlertCircle, Info, Megaphone, ArrowRight, Plus } from 'lucide-react';
import { type FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { Announcement, AppUser } from '../types';
import { FIRESTORE_COLLECTIONS, Role } from '../types';
import { LoadingSpinner } from './ui/loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const getPriorityIcon = (priority: Announcement['priority']) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-4 w-4" />;
    case 'medium':
      return <Megaphone className="h-4 w-4" />;
    case 'low':
      return <Info className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: Announcement['priority']) => {
  switch (priority) {
    case 'high':
      return 'text-destructive bg-destructive/5 dark:bg-red-500/10 border-destructive/20 dark:border-red-500/30';
    case 'medium':
      return 'text-foreground bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30';
    case 'low':
      return 'text-muted-foreground bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30';
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
};

export const CompanyAnnouncements: FC = () => {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    body: '',
    priority: 'medium' as Announcement['priority']
  });
  
  const isAdmin = typedUser?.role === Role.ADMIN || typedUser?.role === Role.SUPER_ADMIN;
  
  // Show only first 3 announcements on dashboard
  const displayAnnouncements = announcements.slice(0, 3);

  const fetchAnnouncements = async () => {
    if (!typedUser?.organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      const announcementsQuery = query(
        collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.ANNOUNCEMENTS}`),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(announcementsQuery);
      const fetchedAnnouncements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw announcement data:', data);
        return {
          id: doc.id,
          ...data
        } as Announcement;
      });
      
      console.log('Processed announcements:', fetchedAnnouncements);
      setAnnouncements(fetchedAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!typedUser?.organizationId || !typedUser.displayName || !newAnnouncement.title.trim() || !newAnnouncement.body.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const announcementData: Omit<Announcement, 'id'> = {
        organizationId: typedUser.organizationId,
        title: newAnnouncement.title.trim(),
        body: newAnnouncement.body.trim(),
        priority: newAnnouncement.priority,
        authorId: typedUser.uid,
        authorName: typedUser.displayName,
        createdAt: Timestamp.now()
      };

      await addDoc(
        collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.ANNOUNCEMENTS}`),
        announcementData
      );

      // Reset form and close modal
      setNewAnnouncement({ title: '', body: '', priority: 'medium' });
      setIsCreateModalOpen(false);
      
      // Refresh announcements
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError('Failed to create announcement');
    } finally {
      setIsCreating(false);
    }
  };


  useEffect(() => {
    fetchAnnouncements();
  }, [typedUser?.organizationId]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Company Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Company Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Company Announcements
            </CardTitle>
            <CardDescription>
              Official company-wide news and important updates
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isAdmin && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Announcement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Title
                      </label>
                      <Input
                        id="title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter announcement title..."
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="priority" className="text-sm font-medium">
                        Priority
                      </label>
                      <Select
                        value={newAnnouncement.priority}
                        onValueChange={(value: Announcement['priority']) => 
                          setNewAnnouncement(prev => ({ ...prev, priority: value }))
                        }
                        disabled={isCreating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="body" className="text-sm font-medium">
                        Message
                      </label>
                      <Textarea
                        id="body"
                        value={newAnnouncement.body}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Enter announcement message..."
                        className="min-h-[100px]"
                        disabled={isCreating}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateAnnouncement}
                        disabled={isCreating || !newAnnouncement.title.trim() || !newAnnouncement.body.trim()}
                      >
                        {isCreating && <LoadingSpinner size="sm" className="mr-2" />}
                        Create Announcement
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Link to="/announcements" className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No announcements yet.</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Create the first announcement to keep your team informed.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayAnnouncements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`p-4 rounded-lg border ${getPriorityColor(announcement.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${announcement.priority === 'high' ? 'text-red-600' : announcement.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {getPriorityIcon(announcement.priority)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium leading-none text-foreground">{announcement.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {announcement.createdAt && announcement.createdAt.toDate ? 
                        formatRelativeTime(announcement.createdAt.toDate()) : 
                        'Unknown date'
                      }
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {announcement.body}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={announcement.priority === 'high' ? 'destructive' : 'outline'}
                      className={
                        announcement.priority === 'high' 
                          ? ''
                          : announcement.priority === 'medium'
                          ? 'border-yellow-600 bg-yellow-50 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-100 dark:text-yellow-800'
                          : 'border-green-600 bg-green-50 text-green-700 dark:border-green-300 dark:bg-green-100 dark:text-green-800'
                      }
                    >
                      {announcement.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
            
            {/* Show remaining count if there are more announcements */}
            {announcements.length > 3 && (
              <div className="pt-2 border-t">
                <Link to="/announcements">
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                    <span>View {announcements.length - 3} more announcements</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};
