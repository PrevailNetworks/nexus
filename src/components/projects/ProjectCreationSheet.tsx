import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Project, type AppUser, type Priority, type ProjectViewType, type TaskStatus, Timestamp } from '@/types';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { Calendar as CalendarIcon, X, Plus, Trash2, Users, CheckSquare } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assigneeIds: string[];
  dueDate?: Date;
  startDate?: Date;
}

interface ProjectCreationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  mode: 'create' | 'edit';
}

export const ProjectCreationSheet: FC<ProjectCreationSheetProps> = ({
  open,
  onOpenChange,
  project,
  mode
}) => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;
  
  // Project form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [view, setView] = useState<ProjectViewType>('board');
  const [color, setColor] = useState('#3B82F6');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Task management state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigneeIds: []
  });
  
  // Common state
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
        
        const activeEmployees = employees
          .filter(emp => emp.status !== 'disabled')
          .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        
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
      setTasks([]);
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

      let projectId: string;

      if (mode === 'create') {
        const projectRef = await addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.PROJECTS}`), {
          ...projectData,
          ownerId: typedUser.uid,
          createdAt: Timestamp.now()
        });
        projectId = projectRef.id;
      } else if (mode === 'edit' && project) {
        await updateDoc(
          doc(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.PROJECTS}`, project.id),
          projectData
        );
        projectId = project.id;
      } else {
        return;
      }

      // Create tasks if this is a new project
      if (mode === 'create' && tasks.length > 0) {
        const taskPromises = tasks.map(task => 
          addDoc(collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`), {
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            projectId: projectId,
            assigneeIds: task.assigneeIds,
            organizationId: typedUser.organizationId,
            dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
            startDate: task.startDate ? Timestamp.fromDate(task.startDate) : undefined,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            assignerId: typedUser.uid,
            assignerName: typedUser.displayName,
            sectionId: 'default'
          })
        );
        
        await Promise.all(taskPromises);
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

  const handleTaskAssigneeToggle = (assigneeId: string) => {
    setNewTask(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds?.includes(assigneeId)
        ? prev.assigneeIds.filter(id => id !== assigneeId)
        : [...(prev.assigneeIds || []), assigneeId]
    }));
  };

  const addTask = () => {
    if (!newTask.title?.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description || '',
      priority: newTask.priority || 'medium',
      status: newTask.status || 'todo',
      assigneeIds: newTask.assigneeIds || [],
      dueDate: newTask.dueDate,
      startDate: newTask.startDate
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assigneeIds: []
    });
    setIsAddingTask(false);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create' 
              ? 'Set up your project details, add team members, and create initial tasks.'
              : 'Edit project details and manage team assignments.'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Project Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Project Details</h3>
            
            <div className="grid grid-cols-1 gap-4">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      key={colorOption.value}
                      className={cn(
                        "w-8 h-8 p-0 rounded-full border-2 transition-all hover:scale-105",
                        color === colorOption.value ? "border-gray-900 scale-110" : "border-gray-300"
                      )}
                      style={{ backgroundColor: colorOption.value }}
                      onClick={() => setColor(colorOption.value)}
                      title={colorOption.label}
                    />
                  ))}
                </div>
              </div>

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
            </div>
          </div>

          <Separator />

          {/* Team Members Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Team Members</h3>
            <Card>
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

          <Separator />

          {/* Tasks Section (only for create mode) */}
          {mode === 'create' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Initial Tasks</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddingTask(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>

              {/* Task List */}
              {tasks.length > 0 && (
                <div className="space-y-3 mb-4">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {task.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {task.assigneeIds.length > 0 && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Users className="h-3 w-3" />
                                  {task.assigneeIds.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Task Form */}
              {isAddingTask && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add New Task</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Task Title *</Label>
                      <Input
                        value={newTask.title || ''}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newTask.description || ''}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Task description"
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Priority</Label>
                        <Select 
                          value={newTask.priority || 'medium'} 
                          onValueChange={(value: Priority) => setNewTask(prev => ({ ...prev, priority: value }))}
                        >
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
                        <Label>Status</Label>
                        <Select 
                          value={newTask.status || 'todo'} 
                          onValueChange={(value: TaskStatus) => setNewTask(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Task Assignees */}
                    <div>
                      <Label>Assign to Team Members</Label>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                        {availableEmployees.filter(emp => selectedMembers.includes(emp.uid)).map((employee) => (
                          <div
                            key={employee.uid}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={newTask.assigneeIds?.includes(employee.uid) || false}
                              onCheckedChange={() => handleTaskAssigneeToggle(employee.uid)}
                            />
                            <img
                              src={employee.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.displayName}`}
                              alt={employee.displayName || ''}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm">{employee.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" onClick={addTask} size="sm">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsAddingTask(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim() || loading}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Update Project'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};