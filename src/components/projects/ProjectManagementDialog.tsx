import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Project, type AppUser, type Priority, type ProjectViewType } from '@/types';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  mode: 'create' | 'edit';
}

export const ProjectManagementDialog: FC<ProjectManagementDialogProps> = ({
  open,
  onOpenChange,
  project,
  mode
}) => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [view, setView] = useState<ProjectViewType>('board');
  const [color, setColor] = useState('#3B82F6');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Load available employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!typedUser?.organizationId || !open) {
        setAvailableEmployees([]);
        return;
      }
      
      setLoadingEmployees(true);
      try {
        const employeesQuery = query(
          collection(firestore, FIRESTORE_COLLECTIONS.USERS),
          where('organizationId', '==', typedUser.organizationId)
        );
        
        const snapshot = await getDocs(employeesQuery);
        const employees = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as AppUser));
        
        // Filter out disabled users and sort by displayName
        const activeEmployees = employees
          .filter(emp => emp.status !== 'disabled')
          .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        
        console.log('Loaded employees:', activeEmployees.length);
        setAvailableEmployees(activeEmployees);
      } catch (error) {
        console.error('Error loading employees:', error);
        setAvailableEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [typedUser?.organizationId, open]);

  // Initialize form with project data for editing
  useEffect(() => {
    if (mode === 'edit' && project) {
      setName(project.name);
      setDescription(project.description || '');
      setPriority(project.priority || 'medium');
      setView(project.view || 'board');
      setColor(project.color || '#3B82F6');
      setSelectedMembers(project.memberIds || []);
      
      if (project.startDate) {
        setStartDate(new Date(project.startDate.toMillis()));
      }
      if (project.endDate) {
        setEndDate(new Date(project.endDate.toMillis()));
      }
    } else {
      // Reset form for create mode
      setName('');
      setDescription('');
      setPriority('medium');
      setView('board');
      setColor('#3B82F6');
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedMembers([]);
    }
  }, [mode, project, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !typedUser?.organizationId) return;

    setLoading(true);
    try {
      const projectData = {
        name: name.trim(),
        description: description.trim(),
        priority,
        view,
        color,
        memberIds: selectedMembers,
        organizationId: typedUser.organizationId,
        startDate: startDate ? Timestamp.fromDate(startDate) : undefined,
        endDate: endDate ? Timestamp.fromDate(endDate) : undefined,
        updatedAt: Timestamp.now()
      };

      if (mode === 'create') {
        await addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.PROJECTS}`), {
          ...projectData,
          ownerId: typedUser.uid,
          createdAt: Timestamp.now()
        });
      } else if (mode === 'edit' && project) {
        await updateDoc(
          doc(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.PROJECTS}`, project.id),
          projectData
        );
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const canManageProjects = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;

  if (!canManageProjects) {
    return null;
  }

  const filteredEmployees = availableEmployees.filter(employee =>
    employee.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new project and assign team members to collaborate.'
              : 'Edit project details and manage team assignments.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project goals and scope"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="view">Default View</Label>
                <Select value={view} onValueChange={(value: ProjectViewType) => setView(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="color">Project Color</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    type="button"
                    key={colorOption.value}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === colorOption.value ? "border-gray-900 scale-110" : "border-gray-300"
                    )}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setColor(colorOption.value)}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <Label>Team Members</Label>
            <Card className="mt-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Select Team Members</CardTitle>
                  <Badge variant="secondary">{selectedMembers.length} selected</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {loadingEmployees ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center space-y-2">
                        <div className="h-4 w-4 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs text-muted-foreground">Loading employees...</p>
                      </div>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'No employees found matching your search.' : 'No employees available.'}
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee.uid}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedMembers.includes(employee.uid)}
                          onCheckedChange={() => handleMemberToggle(employee.uid)}
                        />
                        <img
                          src={employee.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.displayName}`}
                          alt={employee.displayName || ''}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{employee.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedMembers.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Selected Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((memberId) => {
                        const member = availableEmployees.find(emp => emp.uid === memberId);
                        if (!member) return null;
                        
                        return (
                          <Badge
                            key={memberId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {member.displayName}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => handleMemberToggle(memberId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim() || loading}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};