import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { FIRESTORE_COLLECTIONS, Role, type Task, type AppUser, TaskStatus, Timestamp } from '@/types';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Calendar, Users, MoreVertical, CheckCircle2, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useState, type FC } from 'react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  employees: AppUser[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  showProject?: boolean;
  projectName?: string;
}

export const TaskCard: FC<TaskCardProps> = ({
  task,
  employees,
  onEdit,
  onDelete,
  showProject = false,
  projectName
}) => {
  const { user: currentUser } = useAuth();
  const typedUser = currentUser as AppUser;
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'border-gray-300 bg-gray-50 text-gray-700';
      case 'in_progress':
        return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'completed':
        return 'border-green-300 bg-green-50 text-green-700';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
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

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (!typedUser?.organizationId || isUpdating) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: Timestamp.now()
      };

      if (newStatus === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(
        doc(firestore, `organizations/${typedUser.organizationId}/${FIRESTORE_COLLECTIONS.TASKS}`, task.id),
        updateData
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const assignees = task.assigneeIds?.map(id => employees.find(emp => emp.id === id)).filter(Boolean) || [];
  const isAssignedToCurrentUser = task.assigneeIds?.includes(typedUser?.uid || '') || false;
  const canManageTasks = typedUser?.role === Role.ADMIN || typedUser?.role === Role.MANAGER;
  const canEditTask = canManageTasks || isAssignedToCurrentUser;

  const statusOptions = [
    { value: 'todo' as TaskStatus, label: 'To Do' },
    { value: 'in_progress' as TaskStatus, label: 'In Progress' },
    { value: 'completed' as TaskStatus, label: 'Completed' }
  ];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex-shrink-0 ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            {/* Task Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-sm truncate">{task.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getPriorityColor(task.priority).replace('text-', 'border-').replace('600', '200')} ${getPriorityColor(task.priority).replace('text-', 'bg-').replace('600', '50')} ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                    {showProject && projectName && (
                      <Badge variant="secondary" className="text-xs">
                        {projectName}
                      </Badge>
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEditTask && statusOptions.map((statusOption) => (
                    <DropdownMenuItem
                      key={statusOption.value}
                      onClick={() => handleStatusUpdate(statusOption.value)}
                      disabled={isUpdating || task.status === statusOption.value}
                    >
                      Mark as {statusOption.label}
                    </DropdownMenuItem>
                  ))}
                  {canEditTask && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                  )}
                  {canManageTasks && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Meta Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    Due: {format(new Date(task.dueDate.toMillis()), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>{assignees.length} assignee{assignees.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Assignees */}
            {assignees.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Assigned to:</span>
                <div className="flex flex-wrap gap-1">
                  {assignees.slice(0, 3).map((assignee) => (
                    <Badge key={assignee!.id} variant="secondary" className="text-xs">
                      {assignee!.displayName}
                    </Badge>
                  ))}
                  {assignees.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{assignees.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Quick Status Change for Assigned Users */}
            {isAssignedToCurrentUser && task.status !== 'completed' && (
              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate(task.status === 'todo' ? 'in_progress' : 'completed')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? 'Updating...' : 
                   task.status === 'todo' ? 'Start Task' : 'Mark Complete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};