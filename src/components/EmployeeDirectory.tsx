import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight } from 'lucide-react';
import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { useWaveAnimation } from '@/hooks/useWaveAnimation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { AppUser } from '../types';
import { FIRESTORE_COLLECTIONS } from '../types';
import { LoadingSpinner } from './ui/loading';

export const EmployeeDirectory: FC = () => {
  const { user } = useAuth();
  const typedUser = user as AppUser | null;
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [departments, setDepartments] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const { containerRef, getItemStyle, getItemClassName } = useWaveAnimation();

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!typedUser?.organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const employeesQuery = query(
          collection(firestore, FIRESTORE_COLLECTIONS.USERS),
          where('organizationId', '==', typedUser.organizationId),
          where('status', '!=', 'disabled'),
          orderBy('status'),
          orderBy('displayName')
        );
        
        const querySnapshot = await getDocs(employeesQuery);
        const fetchedEmployees = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as AppUser));
        
        setEmployees(fetchedEmployees);

        // Extract unique departments
        const uniqueDepartments = new Set<string>();
        fetchedEmployees.forEach(emp => {
          if (emp.department) {
            uniqueDepartments.add(emp.department);
          }
        });
        setDepartments(['All', ...Array.from(uniqueDepartments).sort()]);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [typedUser?.organizationId]);

  const filteredEmployees = selectedDepartment === 'All' 
    ? employees.slice(0, 6) // Show only first 6 employees on dashboard
    : employees.filter(employee => employee.department === selectedDepartment).slice(0, 6);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Directory
          </CardTitle>
          <CardDescription>
            Find and connect with your colleagues
          </CardDescription>
        </div>
        <Link to="/employees" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent ref={containerRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
        {/* Department Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {departments.map((dept) => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDepartment(dept)}
              className="text-xs"
            >
              {dept}
              {dept !== 'All' && (
                <span className="ml-1 text-xs opacity-70">
                  ({employees.filter(emp => emp.department === dept).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEmployees.map((employee, index) => (
            <div 
              key={employee.uid} 
              className={getItemClassName('p-4 rounded-lg border hover:bg-muted/50')}
              style={getItemStyle(index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {employee.photoURL ? (
                    <img
                      src={employee.photoURL}
                      alt={employee.displayName || ''}
                      className="w-10 h-10 rounded-full bg-muted object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {employee.displayName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{employee.displayName || 'Unknown'}</h4>
                  <p className="text-sm text-muted-foreground truncate">{employee.position || employee.role}</p>
                  <div className="mt-1">
                    <Badge 
                      variant="outline"
                      className={
                        employee.department === 'Engineering' 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-300 dark:bg-blue-100 dark:text-blue-800'
                          : employee.department === 'Design'
                          ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-300 dark:bg-purple-100 dark:text-purple-800'
                          : employee.department === 'Product'
                          ? 'border-green-600 bg-green-50 text-green-700 dark:border-green-300 dark:bg-green-100 dark:text-green-800'
                          : employee.department === 'Marketing'
                          ? 'border-orange-600 bg-orange-50 text-orange-700 dark:border-orange-300 dark:bg-orange-100 dark:text-orange-800'
                          : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                      }
                    >
                      {employee.department}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No employees found in {selectedDepartment} department.</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredEmployees.length} of {employees.length} employees
            {selectedDepartment !== 'All' && ` in ${selectedDepartment}`}
          </p>
          
          {/* Show remaining count if there are more employees */}
          {employees.length > 6 && (
            <div className="mt-2">
              <Link to="/employees">
                <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                  <span>View {employees.length - 6} more employees</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
};
