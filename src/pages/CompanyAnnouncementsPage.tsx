import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper, PageSection } from '@/components/PageWrapper';
import { formatRelativeTime } from '@/lib/utils';
import { AlertCircle, Info, Megaphone, ArrowLeft, Search, Filter, Plus } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { Announcement, AppUser } from '../types';
import { FIRESTORE_COLLECTIONS, Role } from '../types';
import { LoadingSpinner } from '../components/ui/loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';

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

export const CompanyAnnouncementsPage: FC = () => {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    body: '',
    priority: 'medium' as Announcement['priority']
  });
  
  const isAdmin = typedUser?.role === Role.ADMIN || typedUser?.role === Role.SUPER_ADMIN;

  const fetchAnnouncements = async () => {
    if (!typedUser?.organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      const announcementsQuery = query(
        collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.ANNOUNCEMENTS}`),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(announcementsQuery);
      const fetchedAnnouncements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Announcement));
      
      setAnnouncements(fetchedAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
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
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [typedUser?.organizationId]);

  // Filter announcements based on search and priority
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  if (isLoading) {
    return (
      <PageWrapper className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-4xl">
        {/* Header Section */}
        <PageSection index={0} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Company Announcements</h1>
              <p className="text-muted-foreground">
                Official company-wide news and important updates
              </p>
            </div>
            {isAdmin && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Announcement
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
          </div>
        </PageSection>

        {/* Filters Section */}
        <PageSection index={1}>
          <Card className="mb-6 gap-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Priority Filter */}
              <div className="sm:w-48">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredAnnouncements.length} of {announcements.length} announcements
            </div>
          </CardContent>
        </Card>
        </PageSection>

        {/* Announcements */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <PageSection index={2}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">No announcements found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </CardContent>
              </Card>
            </PageSection>
          ) : (
            filteredAnnouncements.map((announcement, index) => (
              <PageSection key={announcement.id} index={index + 3}>
                <div 
                  className={`p-6 rounded-lg border ${getPriorityColor(announcement.priority)}`}
                >
                  <div className="flex items-start gap-4">
                  <div className={`mt-1 ${announcement.priority === 'high' ? 'text-red-600' : announcement.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium leading-none text-foreground">{announcement.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatRelativeTime(announcement.createdAt.toDate())}
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
              </PageSection>
            ))
          )}
        </div>

        {/* Load More Button (for future pagination) */}
        {filteredAnnouncements.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" disabled>
              Load More Announcements
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              All announcements loaded
            </p>
          </div>
        )}
      </PageWrapper>
  );
};
