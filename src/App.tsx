import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DemoProvider, useDemo } from './contexts/DemoContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { ClientsView } from './components/clients/ClientsView';
import { ServicesView } from './components/services/ServicesView';
import { FinanceView } from './components/finance/FinanceView';
import { PresentationsView } from './components/presentations/PresentationsView';
import { FilesView } from './components/files/FilesView';
import { ChatView } from './components/chat/ChatView';
import { ReportsView } from './components/reports/ReportsView';
import { TeamView } from './components/team/TeamView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { DemoBanner } from './components/common/DemoBanner';
import { DemoWelcomeTour } from './components/common/DemoWelcomeTour';
import { Client } from './types';

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { isDemoMode, isTourOpen, openTour, closeTour } = useDemo();
  const { isRTL } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Cross-navigation triggers
  const [openNewTaskModal, setOpenNewTaskModal] = useState(false);
  const [openNewClientModal, setOpenNewClientModal] = useState(false);

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B12] text-white">
        <LoadingSpinner message="Starting Safran Business Consulting..." />
      </div>
    );
  }

  if (!currentUser && !isDemoMode) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddTaskForClient = (client: Client) => {
    setActiveTab('tasks');
    setOpenNewTaskModal(true);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8F6FF] dark:bg-[#0B0B12] text-[#0B0B12] dark:text-[#F4F1FF] antialiased font-sans ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      {/* Top Banner while in Demo Mode */}
      {isDemoMode && <DemoBanner onOpenTour={openTour} />}

      {/* Welcome Tour Modal */}
      <DemoWelcomeTour
        isOpen={isTourOpen}
        onClose={closeTour}
        onNavigateTab={handleNavigate}
      />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-2.25rem)] overflow-y-auto">
          <Navbar
            onOpenMobileSidebar={() => setIsOpenMobile(true)}
            onNavigate={handleNavigate}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                onOpenNewTask={() => {
                  setActiveTab('tasks');
                  setOpenNewTaskModal(true);
                }}
                onOpenNewClient={() => {
                  setActiveTab('clients');
                  setOpenNewClientModal(true);
                }}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksView initialOpenNewTask={openNewTaskModal} />
            )}

            {activeTab === 'clients' && (
              <ClientsView
                initialOpenNewClient={openNewClientModal}
                onAddTaskForClient={handleAddTaskForClient}
              />
            )}

            {activeTab === 'services' && <ServicesView />}

            {activeTab === 'finance' && <FinanceView />}

            {activeTab === 'presentations' && <PresentationsView />}

            {activeTab === 'files' && <FilesView />}

            {activeTab === 'chat' && <ChatView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'team' && <TeamView />}

            {activeTab === 'settings' && <SettingsView />}

            {activeTab === 'audit' && <AuditLogView />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DemoProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </DemoProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
