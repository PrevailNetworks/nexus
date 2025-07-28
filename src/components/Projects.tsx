import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Project, type Task, type AppUser, type Priority } from '@/types';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { FolderOpen, ArrowRight, Calendar, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useWaveAnimation } from '@/hooks/useWaveAnimation';
import { format } from 'date-fns';


const getPriorityIcon = (priority?: Priority) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-3 w-3" />;
    case 'medium':
      return <Clock className="h-3 w-3" />;
    case 'low':
      return <CheckCircle2 className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

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


export const Projects: FC = () => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;
  const { containerRef, getItemStyle, getItemClassName } = useWaveAnimation();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filter projects based on user role
  const filteredProjects = projects.filter(project => {
    const canManageProjects = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;
    if (canManageProjects) {
      return true;
    } else {
      // Employees can only see projects they're assigned to
      return project.memberIds.includes(typedUser?.uid || '');
    }
  });

  // Show only first 3 projects on dashboard
  const displayProjects = filteredProjects.slice(0, 3);

  // Calculate project progress based on tasks
  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  // Get project tasks count
  const getProjectTasksCount = (project: Project) => {
    return tasks.filter(task => task.projectId === project.id).length;
  };

  // Get assigned members for a project
  const getAssignedMembers = (project: Project) => {
    return project.memberIds.map(id => employees.find(emp => emp.uid === id)).filter(Boolean);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Projects & Tasks
          </CardTitle>
          <CardDescription>
            Track project progress and manage tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Projects & Tasks
          </CardTitle>
          <CardDescription>
            Track project progress and manage tasks
          </CardDescription>
        </div>
        <Link to="/projects" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent ref={containerRef}>
        {displayProjects.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active projects.</p>
            <p className="text-xs mt-1">
              {typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER
                ? 'Create your first project to get started!'
                : 'No projects have been assigned to you yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayProjects.map((project, index) => {
              const progress = getProjectProgress(project);
              const tasksCount = getProjectTasksCount(project);
              const assignedMembers = getAssignedMembers(project);

              return (
                <div 
                  key={project.id} 
                  className={getItemClassName('p-4 rounded-lg border hover:bg-muted/50')}
                  style={getItemStyle(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getPriorityColor(project.priority)}`}>
                      {getPriorityIcon(project.priority)}
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Project Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h4 className="text-sm font-medium leading-none">{project.name}</h4>
                            {project.priority && (
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getPriorityColor(project.priority).replace('text-', 'border-').replace('600', '200')} ${getPriorityColor(project.priority).replace('text-', 'bg-').replace('600', '50')} ${getPriorityColor(project.priority)}`}
                              >
                                {project.priority.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {tasksCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}

                      {/* Project Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {project.endDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(new Date(project.endDate.toMillis()), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{assignedMembers.length} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{tasksCount} tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show remaining count if there are more projects */}
            {filteredProjects.length > 3 && (
              <div className="pt-2 border-t">
                <Link to="/projects">
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                    <span>View {filteredProjects.length - 3} more projects</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};