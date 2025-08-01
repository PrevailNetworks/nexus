import { Analytics } from '@/components/Analytics';
import { CompanyAnnouncements } from '@/components/CompanyAnnouncements';
import { DraggableCard } from '@/components/DraggableCard';
import { EmployeeDirectory } from '@/components/EmployeeDirectory';
import { KudosFeed } from '@/components/KudosFeed';
import { Projects } from '@/components/Projects';
import { QuickLinks } from '@/components/QuickLinks';
import { Resources } from '@/components/Resources';
import { TeamCalendar } from '@/components/TeamCalendar';
import { TimeOff } from '@/components/TimeOff';
import { WelcomeChecklist } from '@/components/WelcomeChecklist';
import TimeclockWidget from '@/components/timeclock/TimeclockWidget';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { storage } from '@/lib/utils';
import { useState, useEffect, type FC } from 'react';

export const Dashboard: FC = () => {
  const { isFocusMode } = useFocusMode();
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Define default card order
  const defaultMainCards = ['company-announcements', 'analytics', 'employee-directory', 'projects', 'resources', 'kudos-feed'];
  const defaultSidebarCards = ['quick-links', 'timeclock', 'team-calendar', 'time-off'];
  
  const [mainCardOrder, setMainCardOrder] = useState<string[]>(defaultMainCards);
  const [sidebarCardOrder, setSidebarCardOrder] = useState<string[]>(defaultSidebarCards);

  useEffect(() => {
    // App version management for localStorage cleanup
    const currentAppVersion = '1.0.0'; // Update this when you need to clear localStorage
    storage.checkAppVersion(currentAppVersion);
    
    // Check if user needs onboarding
    setShowWelcome(!storage.isOnboarded());
    
    // Load saved card order from localStorage
    const savedMainOrder = localStorage.getItem('dashboard-main-card-order');
    const savedSidebarOrder = localStorage.getItem('dashboard-sidebar-card-order');
    
    if (savedMainOrder) {
      try {
        setMainCardOrder(JSON.parse(savedMainOrder));
      } catch (error) {
        console.error('Error parsing saved main card order:', error);
      }
    }
    
    if (savedSidebarOrder) {
      try {
        setSidebarCardOrder(JSON.parse(savedSidebarOrder));
      } catch (error) {
        console.error('Error parsing saved sidebar card order:', error);
      }
    }
  }, []);

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
  };

  const handleMainCardReorder = (draggedId: string, targetId: string) => {
    const newOrder = [...mainCardOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setMainCardOrder(newOrder);
      localStorage.setItem('dashboard-main-card-order', JSON.stringify(newOrder));
    }
  };

  const handleSidebarCardReorder = (draggedId: string, targetId: string) => {
    const newOrder = [...sidebarCardOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setSidebarCardOrder(newOrder);
      localStorage.setItem('dashboard-sidebar-card-order', JSON.stringify(newOrder));
    }
  };

  // Render card component based on ID
  const renderMainCard = (cardId: string) => {
    switch (cardId) {
      case 'company-announcements':
        return <CompanyAnnouncements />;
      case 'analytics':
        return <Analytics />;
      case 'resources':
        return <Resources />;
      case 'projects':
        return <Projects />;
      case 'employee-directory':
        return <EmployeeDirectory />;
      case 'kudos-feed':
        return <KudosFeed />;
      default:
        return null;
    }
  };

  const renderSidebarCard = (cardId: string) => {
    switch (cardId) {
      case 'quick-links':
        return <QuickLinks />;
      case 'welcome-checklist':
        return <WelcomeChecklist onDismiss={handleWelcomeDismiss} />;
      case 'projects':
        return <Projects />;
      case 'team-calendar':
        return <TeamCalendar />;
      case 'employee-directory':
        return <EmployeeDirectory />;
      case 'time-off':
        return <TimeOff />;
      case 'timeclock':
        return <TimeclockWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid gap-4 sm:gap-6 transition-all duration-300 ${
          isFocusMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
        }`}>
          {/* Main Content - Left Column */}
          <div className={`space-y-4 sm:space-y-6 ${
            isFocusMode ? 'col-span-1' : 'lg:col-span-8'
          }`}>
            {isFocusMode ? (
              // In focus mode, show CompanyAnnouncements, Analytics, Projects, and TimeOff
              <>
                <DraggableCard id="projects" onReorder={handleMainCardReorder}>
                  <Projects />
                </DraggableCard>
                <DraggableCard id="analytics" onReorder={handleMainCardReorder}>
                  <Analytics />
                </DraggableCard>
                <DraggableCard id="company-announcements" onReorder={handleMainCardReorder}>
                  <CompanyAnnouncements />
                </DraggableCard>
              </>
            ) : (
              // In normal mode, show all main cards in order
              mainCardOrder.map((cardId) => {
                const card = renderMainCard(cardId);
                return card ? (
                  <DraggableCard key={cardId} id={cardId} onReorder={handleMainCardReorder}>
                    {card}
                  </DraggableCard>
                ) : null;
              })
            )}
          </div>

          {/* Sidebar - Right Column - Hidden in focus mode */}
          {!isFocusMode && (
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-4 sm:space-y-6">
                {/* Show welcome checklist for new users */}
                {showWelcome && (
                  <WelcomeChecklist onDismiss={handleWelcomeDismiss} />
                )}
                
                {/* Render sidebar cards in order */}
                {sidebarCardOrder.map((cardId) => {
                  const card = renderSidebarCard(cardId);
                  return card ? (
                    <DraggableCard key={cardId} id={cardId} onReorder={handleSidebarCardReorder}>
                      {card}
                    </DraggableCard>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
