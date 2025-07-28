import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Task, type AppUser, type Project, type Priority, TaskStatus, Timestamp } from '@/types';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  mode: 'create' | 'edit';
  projectId?: string;
  projects?: Project[];
}

export const TaskManagementDialog: FC<TaskManagementDialogProps> = ({
  open,
  onOpenChange,
  task,
  mode,
  projectId,
  projects = []
}) => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [availableEmployees, setAvailableEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load available employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!typedUser?.organizationId || !open) return;
      
      try {
        const employeesQuery = query(
          collection(firestore, FIRESTORE_COLLECTIONS.USERS),
          where('organizationId', '==', typedUser.organizationId),
          where('status', '!=', 'disabled')
        );
        
        const snapshot = await getDocs(employeesQuery);
        const employees = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as AppUser));
        
        setAvailableEmployees(employees);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    loadEmployees();
  }, [typedUser?.organizationId, open]);

  // Initialize form with task data for editing
  useEffect(() => {
    if (mode === 'edit' && task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setSelectedProject(task.projectId || '');
      setSelectedAssignees(task.assigneeIds || []);
      
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate.toMillis()));
      }
      if (task.startDate) {
        setStartDate(new Date(task.startDate.toMillis()));
      }
    } else {
      // Reset form for create mode
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setSelectedProject(projectId || '');
      setSelectedAssignees([]);
      setDueDate(undefined);
      setStartDate(undefined);
    }
  }, [mode, task, open, projectId]);

  const handleSubmit = async () => {
    if (!title.trim() || !typedUser?.organizationId) return;

    setLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        projectId: selectedProject || null,
        assigneeIds: selectedAssignees,
        organizationId: typedUser.organizationId,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
        startDate: startDate ? Timestamp.fromDate(startDate) : undefined,
        updatedAt: Timestamp.now(),
        assignerId: typedUser.uid,
        assignerName: typedUser.displayName
      };

      if (mode === 'create') {
        await addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`), {
          ...taskData,
          createdAt: Timestamp.now(),
          sectionId: 'default' // Default section for now
        });
      } else if (mode === 'edit' && task) {
        await updateDoc(
          doc(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`, task.id),
          taskData
        );
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(assigneeId)
        ? prev.filter(id => id !== assigneeId)
        : [...prev, assigneeId]
    );
  };

  const isEmployee = typedUser?.role === Role.EMPLOYEE;

  // Employees can only create tasks for themselves
  const availableAssignees = isEmployee 
    ? availableEmployees.filter(emp => emp.uid === typedUser.uid)
    : availableEmployees;

  const filteredEmployees = availableAssignees.filter(employee =>
    employee.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOptions = [
    { value: 'todo' as TaskStatus, label: 'To Do', color: 'text-gray-600' },
    { value: 'in_progress' as TaskStatus, label: 'In Progress', color: 'text-blue-600' },
    { value: 'completed' as TaskStatus, label: 'Completed', color: 'text-green-600' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new task and assign it to team members.'
              : 'Edit task details and manage assignments.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task requirements and acceptance criteria"
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Selection */}
            {projects.length > 0 && (
              <div>
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a project or leave blank for standalone task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project (Standalone Task)</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
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
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <Label>
              Assignees {isEmployee && <span className="text-xs text-muted-foreground">(You can only assign tasks to yourself)</span>}
            </Label>
            <Card className="mt-2">
              <CardContent className="p-4 space-y-4">
                {!isEmployee && (
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                )}
                
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.uid}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedAssignees.includes(employee.uid)}
                        onCheckedChange={() => handleAssigneeToggle(employee.uid)}
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
                  ))}
                </div>

                {selectedAssignees.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Assigned to:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignees.map((assigneeId) => {
                        const assignee = availableEmployees.find(emp => emp.uid === assigneeId);
                        if (!assignee) return null;
                        
                        return (
                          <Badge
                            key={assigneeId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {assignee.displayName}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => handleAssigneeToggle(assigneeId)}
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
            disabled={!title.trim() || loading}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};