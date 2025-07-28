import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { LoadingSpinner } from '../../ui/loading';
import { Clock, Calendar, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { FIRESTORE_COLLECTIONS } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import type { AppUser, OvertimeRequest, OvertimeStatus } from '../../../types';
import { OvertimeStatus as OvertimeStatusEnum } from '../../../types';

interface TimeManagementTabProps {
  user: AppUser;
  allUsers?: AppUser[];
  onUserUpdated?: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
  const changeColor = changeType === 'increase' 
    ? 'text-green-600' 
    : changeType === 'decrease' 
    ? 'text-red-600' 
    : 'text-muted-foreground';
    
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-2xl font-bold mb-1">{value}</p>
        {change && (
          <p className={`text-xs font-medium ${changeColor}`}>{change}</p>
        )}
      </CardContent>
    </Card>
  );
};

const StatusBadge: React.FC<{ status: OvertimeStatus }> = ({ status }) => {
  const config = {
    [OvertimeStatusEnum.APPROVED]: { 
      variant: 'default' as const, 
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
      icon: <CheckCircle className="h-3 w-3" />
    },
    [OvertimeStatusEnum.PENDING]: { 
      variant: 'secondary' as const, 
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      icon: <AlertCircle className="h-3 w-3" />
    },
    [OvertimeStatusEnum.REJECTED]: { 
      variant: 'destructive' as const, 
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
      icon: <XCircle className="h-3 w-3" />
    },
  };

  const { variant, className, icon } = config[status];
  
  return (
    <Badge variant={variant} className={`${className} gap-1`}>
      {icon}
      {status}
    </Badge>
  );
};

const OvertimeView: React.FC<{ user: AppUser }> = ({ user }) => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.organizationId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const q = query(
      collection(firestore, FIRESTORE_COLLECTIONS.OVERTIME_REQUESTS),
      where('organizationId', '==', user.organizationId),
      where('userId', '==', user.uid),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OvertimeRequest)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching overtime requests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid, user.organizationId]);

  const handleAction = async (id: string, newStatus: OvertimeStatus) => {
    if (!currentUser) return;
    
    try {
      const reqDocRef = doc(firestore, FIRESTORE_COLLECTIONS.OVERTIME_REQUESTS, id);
      await updateDoc(reqDocRef, {
        status: newStatus,
        approverId: currentUser.uid,
        approverName: currentUser.displayName,
        approvedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating overtime request:', error);
    }
  };

  const stats = {
    totalHours: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.durationHours, 0),
    avgHours: requests.length > 0 ? (requests.reduce((sum, r) => sum + r.durationHours, 0) / requests.length) : 0,
    requested: requests.length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    pending: requests.filter(r => r.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Clock className="h-4 w-4" />
          Add Overtime
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Total Approved Hours" 
          value={stats.totalHours.toFixed(2)} 
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <StatCard 
          title="Avg. Request Hours" 
          value={stats.avgHours.toFixed(2)} 
          icon={<Calendar className="h-4 w-4 text-blue-600" />}
        />
        <StatCard 
          title="Total Requests" 
          value={stats.requested} 
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Approved" 
          value={stats.approved} 
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        />
        <StatCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <StatCard 
          title="Pending" 
          value={stats.pending} 
          icon={<AlertCircle className="h-4 w-4 text-yellow-600" />}
        />
      </div>

      {/* Overtime Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overtime Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Overtime Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time Period</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status/Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          {req.requestDate.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {req.overtimeDate.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {req.durationHours} hours
                        </TableCell>
                        <TableCell>
                          {req.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                          {req.endTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {req.reason}
                        </TableCell>
                        <TableCell>
                          {req.status === OvertimeStatusEnum.PENDING ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(req.id, OvertimeStatusEnum.REJECTED)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAction(req.id, OvertimeStatusEnum.APPROVED)}
                                className="gap-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          ) : (
                            <StatusBadge status={req.status} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No overtime requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AttendanceView: React.FC = () => (
  <Card>
    <CardContent className="p-8 text-center">
      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Attendance Records</h3>
      <p className="text-muted-foreground">
        View detailed attendance records and punch history for this employee. 
        Full functionality coming soon.
      </p>
    </CardContent>
  </Card>
);

const TimeOffView: React.FC = () => (
  <Card>
    <CardContent className="p-8 text-center">
      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Time Off Management</h3>
      <p className="text-muted-foreground">
        View and manage time off requests and balances for this employee. 
        Full functionality coming soon.
      </p>
    </CardContent>
  </Card>
);

const TimeManagementTab: React.FC<TimeManagementTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overtime" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceView />
        </TabsContent>
        
        <TabsContent value="timeoff" className="space-y-4">
          <TimeOffView />
        </TabsContent>
        
        <TabsContent value="overtime" className="space-y-4">
          <OvertimeView user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeManagementTab;