import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageWrapper, PageSection } from '@/components/PageWrapper';
import { ProjectManagementDialog } from '@/components/projects/ProjectManagementDialog';
import { ProjectCreationSheet } from '@/components/projects/ProjectCreationSheet';
import { TaskManagementDialog } from '@/components/projects/TaskManagementDialog';
import { TaskCard } from '@/components/projects/TaskCard';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Project, type Task, type AppUser, type Priority } from '@/types';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Target,
  CheckSquare,
  Briefcase
} from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const getPriorityColor = (priority?: Priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-muted-foreground';
  }
};

const getPriorityIcon = (priority?: Priority) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-4 w-4" />;
    case 'medium':
      return <Clock className="h-4 w-4" />;
    case 'low':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export const ProjectsPage: FC = () => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('projects');
  
  // Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Load data
  useEffect(() => {
    if (!typedUser?.organizationId) return;

    const unsubscribers: (() => void)[] = [];

    // Load projects
    const projectsQuery = query(
      collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.PROJECTS}`),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projectsData);
    });
    unsubscribers.push(unsubProjects);

    // Load tasks
    const tasksQuery = query(
      collection(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(tasksData);
    });
    unsubscribers.push(unsubTasks);

    // Load employees
    const loadEmployees = async () => {
      try {
        const employeesQuery = query(
          collection(firestore, FIRESTORE_COLLECTIONS.USERS),
          where('organizationId', '==', typedUser.organizationId),
          where('status', '!=', 'disabled')
        );
        
        const snapshot = await getDocs(employeesQuery);
        const employeesData = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as AppUser));
        
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [typedUser?.organizationId]);

  // Filter projects and tasks
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    
    // Role-based filtering
    const canManageProjects = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;
    if (canManageProjects) {
      return matchesSearch && matchesPriority;
    } else {
      // Employees can only see projects they're assigned to
      return matchesSearch && matchesPriority && project.memberIds.includes(typedUser?.uid || '');
    }
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    // Role-based filtering
    const canManageTasks = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;
    if (canManageTasks) {
      return matchesSearch && matchesPriority;
    } else {
      // Employees can only see tasks assigned to them
      return matchesSearch && matchesPriority && task.assigneeIds?.includes(typedUser?.uid || '');
    }
  });

  // Dialog handlers
  const handleCreateProject = () => {
    setEditingProject(null);
    setDialogMode('create');
    setProjectSheetOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogMode('edit');
    setProjectDialogOpen(true); // Use old dialog for editing existing projects
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setDialogMode('create');
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogMode('edit');
    setTaskDialogOpen(true);
  };


  const handleDeleteTask = async (taskId: string) => {
    if (!typedUser?.organizationId) return;
    
    try {
      await deleteDoc(doc(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectProgress = (project: Project) => {
    const projectTasks = getProjectTasks(project.id);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const canManageProjects = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageWrapper className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading projects and tasks...</p>
            </div>
          </div>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageWrapper className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
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
          
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects & Tasks</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage projects, assign tasks, and track progress across your organization
            </p>
          </div>
        </PageSection>

        {/* Actions & Filters Section */}
        <PageSection index={1}>
          <Card className="mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Manage Projects & Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Search and Create Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects and tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Create Buttons */}
                <div className="flex gap-2">
                  {canManageProjects && (
                    <Button onClick={handleCreateProject} className="gap-2 whitespace-nowrap">
                      <Briefcase className="h-4 w-4" />
                      New Project
                    </Button>
                  )}
                  <Button onClick={handleCreateTask} variant="outline" className="gap-2 whitespace-nowrap">
                    <CheckSquare className="h-4 w-4" />
                    New Task
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center">
                <div className="w-full sm:w-56">
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="gap-2 h-10 w-full">
                      <Target className="h-4 w-4" />
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
                
                <div className="flex-1 hidden sm:block" />
                
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {filteredProjects.length} projects, {filteredTasks.length} tasks
                </div>
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* Tabs for Projects and Tasks */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <PageSection index={2}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="projects" className="gap-2">
                <Briefcase className="h-4 w-4 hidden sm:inline" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <CheckSquare className="h-4 w-4 hidden sm:inline" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="my-tasks" className="gap-2">
                My Tasks
              </TabsTrigger>
            </TabsList>
          </PageSection>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {filteredProjects.length === 0 ? (
              <PageSection index={3}>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <div className="text-center space-y-3 max-w-sm mx-auto px-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm sm:text-base">
                        {searchQuery ? 'No projects found' : 'No projects yet'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {searchQuery 
                          ? 'Try adjusting your search or filter criteria'
                          : canManageProjects 
                            ? 'Create your first project to get started'
                            : 'No projects have been assigned to you yet'
                        }
                      </p>
                      {!searchQuery && canManageProjects && (
                        <Button onClick={handleCreateProject} className="mt-3 sm:mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          Create First Project
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            ) : (
              filteredProjects.map((project, index) => {
                const projectTasks = getProjectTasks(project.id);
                const progress = getProjectProgress(project);
                const assignedMembers = project.memberIds.map(id => employees.find(emp => emp.uid === id)).filter(Boolean);
                
                return (
                  <PageSection key={project.id} index={index + 3}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`mt-1 flex-shrink-0 ${getPriorityColor(project.priority)}`}>
                            {getPriorityIcon(project.priority)}
                          </div>
                          
                          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                            {/* Project Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  <h3 className="font-semibold text-base sm:text-lg truncate">{project.name}</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {project.priority && (
                                      <Badge 
                                        variant="outline"
                                        className={`text-xs ${getPriorityColor(project.priority).replace('text-', 'border-').replace('600', '200')} ${getPriorityColor(project.priority).replace('text-', 'bg-').replace('600', '50')} ${getPriorityColor(project.priority)}`}
                                      >
                                        {project.priority.toUpperCase()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {project.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              
                              {canManageProjects && (
                                <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {projectTasks.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span>Progress</span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}

                            {/* Project Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              {project.endDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    Due: {format(new Date(project.endDate.toMillis()), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span>{assignedMembers.length} members</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                <span>{projectTasks.length} tasks</span>
                              </div>
                            </div>

                            {/* Team Members Preview */}
                            {assignedMembers.length > 0 && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">Team:</span>
                                <div className="flex flex-wrap gap-1">
                                  {assignedMembers.slice(0, 3).map((member) => (
                                    <Badge key={member!.uid} variant="secondary" className="text-xs">
                                      {member!.displayName}
                                    </Badge>
                                  ))}
                                  {assignedMembers.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{assignedMembers.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </PageSection>
                );
              })
            )}
          </TabsContent>

          {/* All Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {filteredTasks.length === 0 ? (
              <PageSection index={3}>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <div className="text-center space-y-3 max-w-sm mx-auto px-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm sm:text-base">
                        {searchQuery ? 'No tasks found' : 'No tasks yet'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {searchQuery 
                          ? 'Try adjusting your search or filter criteria'
                          : 'Create your first task to get started'
                        }
                      </p>
                      {!searchQuery && (
                        <Button onClick={handleCreateTask} className="mt-3 sm:mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          Create First Task
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTasks.map((task, index) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <PageSection key={task.id} index={index + 3}>
                      <TaskCard
                        task={task}
                        employees={employees}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        showProject={true}
                        projectName={project?.name}
                      />
                    </PageSection>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Tasks Tab */}
          <TabsContent value="my-tasks" className="space-y-4">
            {(() => {
              const myTasks = filteredTasks.filter(task => 
                task.assigneeIds?.includes(typedUser?.uid || '')
              );
              
              return myTasks.length === 0 ? (
                <PageSection index={3}>
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                      <div className="text-center space-y-3 max-w-sm mx-auto px-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-sm sm:text-base">No tasks assigned to you</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          You can create personal tasks or wait for assignments from your manager
                        </p>
                        <Button onClick={handleCreateTask} className="mt-3 sm:mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          Create Personal Task
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </PageSection>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myTasks.map((task, index) => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <PageSection key={task.id} index={index + 3}>
                        <TaskCard
                          task={task}
                          employees={employees}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          showProject={true}
                          projectName={project?.name}
                        />
                      </PageSection>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Dialogs and Sheets */}
        <ProjectCreationSheet
          open={projectSheetOpen}
          onOpenChange={setProjectSheetOpen}
          project={editingProject}
          mode={dialogMode}
        />

        <ProjectManagementDialog
          open={projectDialogOpen}
          onOpenChange={setProjectDialogOpen}
          project={editingProject}
          mode={dialogMode}
        />

        <TaskManagementDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={editingTask}
          mode={dialogMode}
          projects={projects}
        />
      </PageWrapper>
    </div>
  );
};