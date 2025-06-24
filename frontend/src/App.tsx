import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { SimpleLayout } from './components/layout/SimpleLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { SystemRoleType } from './types/roles';
import { ModalProvider } from './contexts/ModalContext';
import GlobalModalRenderer from './components/common/GlobalModalRenderer';
import { VoiceSettingsProvider } from './contexts/VoiceSettingsContext';
import { useCurrentProjectId } from './hooks/useCurrentProjectId';
import PerformanceMonitor from './components/common/PerformanceMonitor';

// Lazy load all major pages for better performance
const Login = React.lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Register = React.lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const ProjectList = React.lazy(() => import('./pages/projects/ProjectList').then(module => ({ default: module.ProjectList })));
const CreateProject = React.lazy(() => import('./pages/projects/CreateProject').then(module => ({ default: module.CreateProject })));
const ProjectDetails = React.lazy(() => import('./pages/projects/ProjectDetails').then(module => ({ default: module.ProjectDetails })));
const EditProject = React.lazy(() => import('./pages/projects/EditProject').then(module => ({ default: module.EditProject })));
const TestCaseList = React.lazy(() => import('./pages/test-cases/TestCaseList').then(module => ({ default: module.TestCaseList })));
const CreateTestCase = React.lazy(() => import('./pages/test-cases/CreateTestCase').then(module => ({ default: module.CreateTestCase })));
const TestCaseDetails = React.lazy(() => import('./pages/test-cases/TestCaseDetails').then(module => ({ default: module.TestCaseDetails })));
const EditTestCase = React.lazy(() => import('./pages/test-cases/EditTestCase').then(module => ({ default: module.EditTestCase })));
const Settings = React.lazy(() => import('./pages/settings/Settings'));
const NotificationsPage = React.lazy(() => import('./pages/notifications/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const DiscordIntegrationPage = React.lazy(() => import('./pages/integrations/discord/DiscordIntegrationPage'));
const DiscordLinkPage = React.lazy(() => import('./pages/DiscordLinkPage'));
const SettingsIntegrationsPage = React.lazy(() => import('./pages/settings/SettingsIntegrationsPage'));
const NotesPage = React.lazy(() => import('./pages/notes/NotesPage').then(module => ({ default: module.NotesPage })));
const SnippetsPage = React.lazy(() => import('./pages/snippets/SnippetsPage').then(module => ({ default: module.SnippetsPage })));
const TasksPage = React.lazy(() => import('./pages/tasks/TasksPage'));
const MyTasksPage = React.lazy(() => import('./pages/tasks/MyTasksPage'));
const DocumentationPage = React.lazy(() => import('./pages/documentation/DocumentationPage'));
const TerminalPage = React.lazy(() => import('./pages/cli/TerminalPage').then(module => ({ default: module.TerminalPage })));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ChangelogPage = React.lazy(() => import('./pages/ChangelogPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Support = React.lazy(() => import('./pages/Support'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const ProjectManagementFeaturePage = React.lazy(() => import('./pages/features/ProjectManagementFeaturePage'));
const TestCaseManagementFeaturePage = React.lazy(() => import('./pages/features/TestCaseManagementFeaturePage'));
const NotesAndSnippetsFeaturePage = React.lazy(() => import('./pages/features/NotesAndSnippetsFeaturePage'));
const ModernDevelopmentPlatformFeaturePage = React.lazy(() => import('./pages/features/ModernDevelopmentPlatformFeaturePage'));
const DiscordAIIntegrationFeaturePage = React.lazy(() => import('./pages/features/DiscordAIIntegrationFeaturePage'));
const CLIAutomationFeaturePage = React.lazy(() => import('./pages/features/CLIAutomationFeaturePage'));
const TechStackFeaturePage = React.lazy(() => import('./pages/features/TechStackFeaturePage'));
const RoadmapPage = React.lazy(() => import('./pages/roadmap/RoadmapPage'));
const ThankYouPage = React.lazy(() => import('./pages/donation/ThankYouPage'));
const DonationPage = React.lazy(() => import('./pages/donation/DonationPage'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const ResetRequested = React.lazy(() => import('./pages/auth/ResetRequested'));
const LabnexAIPage = React.lazy(() => import('./pages/ai/LabnexAIPage'));
const AIVoiceMode = React.lazy(() => import('./pages/ai/AIVoiceMode'));
const Contact = React.lazy(() => import('./pages/Contact'));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <LoadingSpinner size="lg" />
  </div>
);

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
    return <PageLoadingFallback />;
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
    return <PageLoadingFallback />;
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
      <Route path="/login" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <Login />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <Register />
        </Suspense>
      } />
      <Route path="/" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <LandingPage />
        </Suspense>
      } />
      <Route path="/changelog" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><ChangelogPage /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/privacy-policy" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><PrivacyPolicy /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/terms-of-service" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><TermsOfService /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/support" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><Support /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/contact" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><Contact /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/features/project-management" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ProjectManagementFeaturePage />
        </Suspense>
      } />
      <Route path="/features/test-case-management" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <TestCaseManagementFeaturePage />
        </Suspense>
      } />
      <Route path="/features/notes-and-snippets" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <NotesAndSnippetsFeaturePage />
        </Suspense>
      } />
      <Route path="/features/modern-development-platform" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ModernDevelopmentPlatformFeaturePage />
        </Suspense>
      } />
      <Route path="/features/discord-ai-integration" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <DiscordAIIntegrationFeaturePage />
        </Suspense>
      } />
      <Route path="/features/cli-automation" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <CLIAutomationFeaturePage />
        </Suspense>
      } />
      <Route path="/features/tech-stack" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <TechStackFeaturePage />
        </Suspense>
      } />
      <Route path="/roadmap" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <RoadmapPage />
        </Suspense>
      } />
      <Route path="/donation" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><DonationPage /></SimpleLayout>
        </Suspense>
      } />
      <Route path="/donation/thank-you" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ThankYouPage />
        </Suspense>
      } />
      <Route
        path="/admin/dashboard"
        element={<PrivateRoute adminOnly={true}>
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDashboardPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/dashboard"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <Dashboard />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <ProjectList />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/settings"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <Settings />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/new"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <CreateProject />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <ProjectDetails />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id/edit"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <EditProject />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <TestCaseList />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/new"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <CreateTestCase />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/:testCaseId"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <TestCaseDetails />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:id/test-cases/:testCaseId/edit"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <EditTestCase />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/notifications"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <NotificationsPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/integrations/discord"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <DiscordIntegrationPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/users/discord/link"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <DiscordLinkPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/settings/integrations"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsIntegrationsPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/notes"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <NotesPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/snippets"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <SnippetsPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/projects/:projectId/tasks"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <TasksPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/my-tasks"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <MyTasksPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/documentation"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <DocumentationPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/cli"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <TerminalPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route path="/reset-password" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <ResetPassword />
        </Suspense>
      } />
      <Route path="/reset-requested" element={
        <Suspense fallback={<PageLoadingFallback />}>
          <SimpleLayout><ResetRequested /></SimpleLayout>
        </Suspense>
      } />
      <Route
        path="/ai"
        element={<PrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <LabnexAIPage />
          </Suspense>
        </PrivateRoute>}
      />
      <Route
        path="/ai/voice"
        element={<FullScreenPrivateRoute>
          <Suspense fallback={<PageLoadingFallback />}>
            <AIVoiceMode />
          </Suspense>
        </FullScreenPrivateRoute>}
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
              <VoiceSettingsProvider>
                <AppContent />
              </VoiceSettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <GlobalModalRenderer />
      </Router>
      <PerformanceMonitor />
    </ModalProvider>
  );
}

export default App;
