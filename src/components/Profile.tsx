import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  User, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Shield, 
  FileText,
  Heart,
  MessageSquare
} from 'lucide-react';
import { type FC } from 'react';

export const Profile: FC = () => {
  const { user } = useAuth();
  
  const handleProfileAction = async (action: string) => {
    switch (action) {
      case 'profile':
        console.log('Navigate to profile');
        // TODO: Implement navigation to profile page
        break;
      case 'settings':
        console.log('Navigate to settings');
        // TODO: Implement navigation to settings page
        break;
      case 'notifications':
        console.log('Navigate to notifications');
        // TODO: Implement navigation to notifications page
        break;
      case 'privacy':
        console.log('Navigate to privacy settings');
        // TODO: Implement navigation to privacy page
        break;
      case 'help':
        console.log('Navigate to help center');
        // TODO: Implement navigation to help page
        break;
      case 'feedback':
        console.log('Navigate to feedback');
        // TODO: Implement feedback form
        break;
      case 'docs':
        console.log('Navigate to documentation');
        // TODO: Implement navigation to docs
        break;
      case 'support':
        console.log('Navigate to support');
        // TODO: Implement navigation to support
        break;
      case 'logout':
        try {
          await signOut(auth);
          console.log('User logged out successfully');
        } catch (error) {
          console.error('Error logging out:', error);
        }
        break;
      default:
        break;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-accent"
          aria-label="Profile menu"
        >
          <img
            className="h-10 w-10 rounded-full object-cover border-2 border-border hover:border-primary transition-colors"
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
            alt={`${user.displayName}'s avatar`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Account Section */}
        <DropdownMenuItem 
          onClick={() => handleProfileAction('profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('notifications')}
          className="cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('privacy')}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy & Security</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Support Section */}
        <DropdownMenuItem 
          onClick={() => handleProfileAction('help')}
          className="cursor-pointer"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help Center</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('docs')}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Documentation</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('feedback')}
          className="cursor-pointer"
        >
          <Heart className="mr-2 h-4 w-4" />
          <span>Send Feedback</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleProfileAction('support')}
          className="cursor-pointer"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Contact Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem 
          onClick={() => handleProfileAction('logout')}
          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
