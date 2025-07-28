import { TooltipProvider } from '@/components/ui/tooltip';
import { type FC } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { FocusModeProvider } from './contexts/FocusModeContext';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/loading';
import { ScrollToTop } from './components/ScrollToTop';
import { FloatingHelpButton } from './components/FloatingHelpButton';
import { Dashboard } from './pages/Dashboard';
import { ForYouPage } from './pages/ForYouPage';
import { CompanyAnnouncementsPage } from './pages/CompanyAnnouncementsPage';
import { KudosFeedPage } from './pages/KudosFeedPage';
import { EmployeeDirectoryPage } from './pages/EmployeeDirectoryPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { HelpDeskPage } from './pages/HelpDeskPage';
import { TimeOffPage } from './pages/TimeOffPage';
import FeedPage from './pages/FeedPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import TimeclockPage from './pages/TimeclockPage';
import LoginPage from './pages/LoginPage';
import { Header } from './components/Header';

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
};

const AppRoutes: FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/for-you" element={<ProtectedRoute><ForYouPage /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><CompanyAnnouncementsPage /></ProtectedRoute>} />
      <Route path="/kudos" element={<ProtectedRoute><KudosFeedPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeeDirectoryPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
      <Route path="/help-desk" element={<ProtectedRoute><HelpDeskPage /></ProtectedRoute>} />
      <Route path="/time-off" element={<ProtectedRoute><TimeOffPage /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/timeclock" element={<ProtectedRoute><TimeclockPage /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute><EmployeeManagementPage /></ProtectedRoute>} />
    </Routes>
  );
};

const App: FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="nexus-ui-theme">
      <FocusModeProvider>
        <TooltipProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppRoutes />
              <FloatingHelpButton />
              <Toaster />
            </BrowserRouter>
        </TooltipProvider>
      </FocusModeProvider>
    </ThemeProvider>
  );
};

export default App;
