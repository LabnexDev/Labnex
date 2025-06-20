import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { SimpleLayout } from './components/layout/SimpleLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { ProjectList } from './pages/projects/ProjectList';
import { CreateProject } from './pages/projects/CreateProject';
import { ProjectDetails } from './pages/projects/ProjectDetails';
import { EditProject } from './pages/projects/EditProject';
import { TestCaseList } from './pages/test-cases/TestCaseList';
import { CreateTestCase } from './pages/test-cases/CreateTestCase';
import { TestCaseDetails } from './pages/test-cases/TestCaseDetails';
import { EditTestCase } from './pages/test-cases/EditTestCase';
import Settings from './pages/settings/Settings';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import DiscordIntegrationPage from './pages/integrations/discord/DiscordIntegrationPage';
import DiscordLinkPage from './pages/DiscordLinkPage';
import SettingsIntegrationsPage from './pages/settings/SettingsIntegrationsPage';
import { NotesPage } from './pages/notes/NotesPage';
import { SnippetsPage } from './pages/snippets/SnippetsPage';
import TasksPage from './pages/tasks/TasksPage';
import MyTasksPage from './pages/tasks/MyTasksPage';
import DocumentationPage from './pages/documentation/DocumentationPage';
import { TerminalPage } from './pages/cli/TerminalPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LandingPage from './pages/LandingPage';
import ChangelogPage from './pages/ChangelogPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Support from './pages/Support';
import { SystemRoleType } from './types/roles';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ProjectManagementFeaturePage from './pages/features/ProjectManagementFeaturePage';
import TestCaseManagementFeaturePage from './pages/features/TestCaseManagementFeaturePage';
import NotesAndSnippetsFeaturePage from './pages/features/NotesAndSnippetsFeaturePage';
import ModernDevelopmentPlatformFeaturePage from './pages/features/ModernDevelopmentPlatformFeaturePage';
import DiscordAIIntegrationFeaturePage from './pages/features/DiscordAIIntegrationFeaturePage';
import CLIAutomationFeaturePage from './pages/features/CLIAutomationFeaturePage';
import TechStackFeaturePage from './pages/features/TechStackFeaturePage';
import RoadmapPage from './pages/roadmap/RoadmapPage';
import ThankYouPage from './pages/donation/ThankYouPage';
import DonationPage from './pages/donation/DonationPage';
import { ModalProvider } from './contexts/ModalContext';
import GlobalModalRenderer from './components/common/GlobalModalRenderer';
import ResetPassword from './pages/auth/ResetPassword';
import ResetRequested from './pages/auth/ResetRequested';
import LabnexAIPage from './pages/ai/LabnexAIPage';
import AIVoiceMode from './pages/ai/AIVoiceMode';
import { VoiceSettingsProvider } from './contexts/VoiceSettingsContext';
import { useCurrentProjectId } from './hooks/useCurrentProjectId';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Special route wrapper for full-screen components that need auth but no layout
function FullScreenPrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log(
    'PrivateRoute check:', 
    JSON.stringify({
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?._id,
      userEmail: user?.email,
      userSystemRole: user?.systemRole,
      adminOnlyRequired: adminOnly,
      pathname: window.location.pathname + window.location.search
    }, null, 2)
  );

  if (isLoading) {
    console.log('PrivateRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    console.log('PrivateRoute: No user or not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.systemRole !== SystemRoleType.ADMIN) {
    console.log('PrivateRoute: Admin access required, but user is not admin. Redirecting to login (or a Forbidden page later).');
    // For now, redirect to dashboard. Later, this could be a /forbidden page or back to login with a message.
    return <Navigate to="/dashboard" replace />; 
  }

  console.log('PrivateRoute: User authenticated and authorized, rendering protected content');
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const appBasename = useMemo(() => {
    const base = import.meta.env.BASE_URL || '/';
    return base === '/' ? '' : base.replace(/\/$/, '');
  }, []);

  // Keep projectId synced to localStorage for cross-route use
  useCurrentProjectId();

  useEffect(() => {
    // The SPA redirect logic that was here has been removed as it was causing
    // severe URL corruption issues. Modern hosting platforms provide better
    // ways to handle SPA routing and 404s. This removal should stabilize
    // the application's routing behavior.

    const sessionPath = sessionStorage.getItem('spa_redirect_path');
    const sessionSearch = sessionStorage.getItem('spa_redirect_search');

    if (sessionPath) {
      sessionStorage.removeItem('spa_redirect_path');
      sessionStorage.removeItem('spa_redirect_search');

      let pathToNavigate = sessionPath;

      if (appBasename && appBasename !== '') {
        if (sessionPath.toLowerCase().startsWith(appBasename.toLowerCase() + '/')) {
          pathToNavigate = sessionPath.substring(appBasename.length);
        } else if (sessionPath.toLowerCase() === appBasename.toLowerCase()) {
          pathToNavigate = '/';
        }
      }

      if (!pathToNavigate.startsWith('/')) {
        pathToNavigate = '/' + pathToNavigate;
      }

      const fullRedirectTarget = pathToNavigate + (sessionSearch || '');

      // The original condition "location.pathname === '/'" might be too restrictive with basename
      // Let's check if the current path is essentially the base path or root.
      const isAtBasePath = location.pathname === '/' || location.pathname === appBasename || location.pathname === appBasename + '/';

      if (isAtBasePath) {
        console.log(`[App.tsx] SPA Redirect: Navigating from SPA base ("${location.pathname}") to internal path: "${fullRedirectTarget}" (original sessionPath: "${sessionPath}", basename: "${appBasename}")`);
        navigate(fullRedirectTarget, { replace: true });
      } else {
        console.warn(`[App.tsx] SPA Redirect: Current SPA path is "${location.pathname}", not base. Aborting session redirect to "${fullRedirectTarget}".`);
      }
    }
  }, [navigate, location.pathname, location.search, appBasename]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/changelog" element={<SimpleLayout><ChangelogPage /></SimpleLayout>} />
      <Route path="/privacy-policy" element={<SimpleLayout><PrivacyPolicy /></SimpleLayout>} />
      <Route path="/terms-of-service" element={<SimpleLayout><TermsOfService /></SimpleLayout>} />
      <Route path="/support" element={<SimpleLayout><Support /></SimpleLayout>} />
      <Route path="/features/project-management" element={<ProjectManagementFeaturePage />} />
      <Route path="/features/test-case-management" element={<TestCaseManagementFeaturePage />} />
      <Route path="/features/notes-and-snippets" element={<NotesAndSnippetsFeaturePage />} />
      <Route path="/features/modern-development-platform" element={<ModernDevelopmentPlatformFeaturePage />} />
      <Route path="/features/discord-ai-integration" element={<DiscordAIIntegrationFeaturePage />} />
      <Route path="/features/cli-automation" element={<CLIAutomationFeaturePage />} />
      <Route path="/features/tech-stack" element={<TechStackFeaturePage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/donation" element={<SimpleLayout><DonationPage /></SimpleLayout>} />
      <Route path="/donation/thank-you" element={<ThankYouPage />} />
      <Route
        path="/admin/dashboard"
        element={<PrivateRoute adminOnly={true}><AdminDashboardPage /></PrivateRoute>}
      />
      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />
      <Route
        path="/projects"
        element={<PrivateRoute><ProjectList /></PrivateRoute>}
      />
      <Route
        path="/settings"
        element={<PrivateRoute><Settings /></PrivateRoute>}
      />
      <Route
        path="/projects/new"
        element={<PrivateRoute><CreateProject /></PrivateRoute>}
      />
      <Route
        path="/projects/:id"
        element={<PrivateRoute><ProjectDetails /></PrivateRoute>}
      />
      <Route
        path="/projects/:id/edit"
        element={<PrivateRoute><EditProject /></PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases"
        element={<PrivateRoute><TestCaseList /></PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/new"
        element={<PrivateRoute><CreateTestCase /></PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/:testCaseId"
        element={<PrivateRoute><TestCaseDetails /></PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/:testCaseId/edit"
        element={<PrivateRoute><EditTestCase /></PrivateRoute>}
      />
      <Route
        path="/notifications"
        element={<PrivateRoute><NotificationsPage /></PrivateRoute>}
      />
      <Route
        path="/integrations/discord"
        element={<PrivateRoute><DiscordIntegrationPage /></PrivateRoute>}
      />
      <Route
        path="/users/discord/link"
        element={<PrivateRoute><DiscordLinkPage /></PrivateRoute>}
      />
      <Route
        path="/settings/integrations"
        element={<PrivateRoute><SettingsIntegrationsPage /></PrivateRoute>}
      />
      <Route
        path="/notes"
        element={<PrivateRoute><NotesPage /></PrivateRoute>}
      />
      <Route
        path="/snippets"
        element={<PrivateRoute><SnippetsPage /></PrivateRoute>}
      />
      <Route
        path="/projects/:projectId/tasks"
        element={<PrivateRoute><TasksPage /></PrivateRoute>}
      />
      <Route
        path="/my-tasks"
        element={<PrivateRoute><MyTasksPage /></PrivateRoute>}
      />
      <Route
        path="/documentation"
        element={<PrivateRoute><DocumentationPage /></PrivateRoute>}
      />
      <Route
        path="/cli"
        element={<PrivateRoute><TerminalPage /></PrivateRoute>}
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-requested" element={<SimpleLayout><ResetRequested /></SimpleLayout>} />
      <Route
        path="/ai"
        element={<PrivateRoute><LabnexAIPage /></PrivateRoute>}
      />
      <Route
        path="/ai/voice"
        element={<FullScreenPrivateRoute><VoiceSettingsProvider><AIVoiceMode /></VoiceSettingsProvider></FullScreenPrivateRoute>}
      />
    </Routes>
  );
}

function AppContent() {
  const { theme } = useTheme();
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            color: theme === 'dark' ? '#E5E7EB' : '#1F2937',
            background: theme === 'dark' 
              ? 'rgba(31, 41, 55, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            border: theme === 'dark' ? '1px solid rgba(55, 65, 81, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          },
          success: {
            iconTheme: {
              primary: theme === 'dark' ? '#34D399' : '#10B981',
              secondary: theme === 'dark' ? '#047857' : '#ECFDF5',
            },
            icon: <CheckCircleIcon className="h-5 w-5" />,
          },
          error: {
            iconTheme: {
              primary: theme === 'dark' ? '#F87171' : '#EF4444',
              secondary: theme === 'dark' ? '#B91C1C' : '#FEF2F2',
            },
            icon: <XCircleIcon className="h-5 w-5"/>,
          },
          custom: {
              iconTheme: {
                  primary: theme === 'dark' ? '#60A5FA' : '#3B82F6',
                  secondary: theme === 'dark' ? '#1E40AF' : '#EFF6FF',
              },
              icon: <InformationCircleIcon className="h-5 w-5"/>,
          }
        }}
      />
    </>
  );
}

function App() {
  return (
    <ModalProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <GlobalModalRenderer />
      </Router>
    </ModalProvider>
  );
}

export default App;
