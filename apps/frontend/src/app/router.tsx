import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const InboxPage = lazy(() => import('../pages/dashboard/InboxPage'));
const OverviewDashboardPage = lazy(() => import('../pages/dashboard/OverviewDashboardPage'));
const ContactsPage = lazy(() => import('../pages/dashboard/ContactsPage'));
const CampaignsPage = lazy(() => import('../pages/dashboard/CampaignsPage'));
const FlowBuilderPage = lazy(() => import('../pages/automation/FlowBuilderPage'));
const BillingPage = lazy(() => import('../pages/billing/BillingPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const KnowledgeBasePage = lazy(() => import('../pages/ai/KnowledgeBasePage'));
const WabaProfilePage = lazy(() => import('../pages/settings/WabaProfilePage'));
const TemplateBuilderPage = lazy(() => import('../pages/campaigns/TemplateBuilderPage'));
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));

const PageLoader = () => (
  <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
    Loading Page...
  </div>
);

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },

  // Protected Dashboard Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/',
            element: (
              <Suspense fallback={<PageLoader />}>
                <OverviewDashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <OverviewDashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/inbox',
            element: (
              <Suspense fallback={<PageLoader />}>
                <InboxPage />
              </Suspense>
            ),
          },
          {
            path: '/contacts',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ContactsPage />
              </Suspense>
            ),
          },
          {
            path: '/campaigns',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CampaignsPage />
              </Suspense>
            ),
          },
          {
            path: '/campaigns/templates',
            element: (
              <Suspense fallback={<PageLoader />}>
                <TemplateBuilderPage />
              </Suspense>
            ),
          },
          {
            path: '/flows',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FlowBuilderPage />
              </Suspense>
            ),
          },
          {
            path: '/knowledge-base',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KnowledgeBasePage />
              </Suspense>
            ),
          },
          {
            path: '/billing',
            element: (
              <Suspense fallback={<PageLoader />}>
                <BillingPage />
              </Suspense>
            ),
          },
          {
            path: '/settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: '/settings/waba',
            element: (
              <Suspense fallback={<PageLoader />}>
                <WabaProfilePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
