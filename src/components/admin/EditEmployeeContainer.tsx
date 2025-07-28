import React, { useState } from 'react';
import type { AppUser } from '../../types';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar } from '../ui/avatar';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';
import EmployeeInformationTab from './tabs/EmployeeInformationTab';
import PayrollTab from './tabs/PayrollTab';
import NotificationsTab from './tabs/NotificationsTab';
import ScheduleTab from './tabs/ScheduleTab';
import ContractTab from './tabs/ContractTab';
import DocumentTab from './tabs/DocumentTab';
import PermissionsTab from './tabs/PermissionsTab';
import PTOTab from './tabs/PTOTab';
import TrainingTab from './tabs/TrainingTab';
import ReimbursementTab from './tabs/ReimbursementTab';
import TimeManagementTab from './tabs/TimeManagementTab';
import ClockInOutTab from './tabs/ClockInOutTab';

interface EditEmployeeContainerProps {
  user: AppUser;
  allUsers: AppUser[];
  onUserUpdated: () => void;
  onEmployeeNav: (direction: 'prev' | 'next') => void;
}

const EditEmployeeContainer: React.FC<EditEmployeeContainerProps> = ({
  user,
  allUsers,
  onUserUpdated,
  onEmployeeNav
}) => {
  const [activeTab, setActiveTab] = useState('information');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disabled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar 
                  photoURL={user.photoURL} 
                  displayName={user.displayName} 
                  size="lg" 
                />
                <div>
                  <CardTitle className="text-xl">
                    {user.displayName || 'Unknown User'}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(user.status || 'active')}>
                      {user.status || 'active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.email}
                  </p>
                  {user.department && (
                    <p className="text-sm text-muted-foreground">
                      {user.department} • {user.position || 'No position set'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEmployeeNav('prev')}
                >
                  <Icon name="chevron_left" size={16} />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEmployeeNav('next')}
                >
                  Next
                  <Icon name="chevron_right" size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="pto">PTO</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="reimbursement">Reimbursement</TabsTrigger>
            <TabsTrigger value="timemanagement">Time Mgmt</TabsTrigger>
            <TabsTrigger value="clockinout">Clock In/Out</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="information">
              <EmployeeInformationTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="contract">
              <ContractTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="pto">
              <PTOTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="training">
              <TrainingTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="reimbursement">
              <ReimbursementTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="timemanagement">
              <TimeManagementTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="clockinout">
              <ClockInOutTab 
                user={user} 
                allUsers={allUsers} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="payroll">
              <PayrollTab 
                user={user} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationsTab 
                user={user} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>

            <TabsContent value="schedule">
              <ScheduleTab 
                user={user} 
                onUserUpdated={onUserUpdated} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default EditEmployeeContainer;