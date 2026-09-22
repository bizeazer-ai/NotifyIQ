import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { Setup2FAPage } from '../pages/auth/Setup2FAPage';
import { DashboardPage } from '../pages/DashboardPage';
import { WorkspaceListPage } from '../pages/workspaces/WorkspaceListPage';
import { WorkspaceDetailPage } from '../pages/workspaces/WorkspaceDetailPage';
import { WabaHealthPage } from '../pages/workspaces/WabaHealthPage';
import { AgencyTreePage } from '../pages/workspaces/AgencyTreePage';
import { AdminBillingDashboardPage } from '../pages/billing/AdminBillingDashboardPage';
import { CouponsPage } from '../pages/billing/CouponsPage';
import { RevenueAnalyticsPage } from '../pages/billing/RevenueAnalyticsPage';
import { AiCostDashboardPage } from '../pages/ai/AiCostDashboardPage';
import { PromptReviewPage } from '../pages/ai/PromptReviewPage';
import { QueueMonitorPage } from '../pages/system/QueueMonitorPage';
import { InfraHealthPage } from '../pages/system/InfraHealthPage';
import { ErasureQueuePage } from '../pages/compliance/ErasureQueuePage';
import { AuditViewerPage } from '../pages/compliance/AuditViewerPage';
import { SecurityCenterPage } from '../pages/security/SecurityCenterPage';
import { KeyRotationPage } from '../pages/security/KeyRotationPage';
import { ExecutiveReportsPage } from '../pages/reports/ExecutiveReportsPage';
import { ADMIN_TOKEN_KEY } from '../lib/api';
import { Admin2FAPage } from '@/pages/auth/Verify2FAPage';

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/setup-2fa',
    element: <Setup2FAPage />,
  },
  {
    path: '/verify-2fa',
    element: <Admin2FAPage/>
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/workspaces', element: <WorkspaceListPage /> },
          { path: '/workspaces/:id', element: <WorkspaceDetailPage /> },
          { path: '/waba-health', element: <WabaHealthPage /> },
          { path: '/agency-tree', element: <AgencyTreePage /> },
          { path: '/billing', element: <AdminBillingDashboardPage /> },
          { path: '/coupons', element: <CouponsPage /> },
          { path: '/revenue-analytics', element: <RevenueAnalyticsPage /> },
          { path: '/ai-ops', element: <AiCostDashboardPage /> },
          { path: '/prompt-review', element: <PromptReviewPage /> },
          { path: '/queues', element: <QueueMonitorPage /> },
          { path: '/infra-health', element: <InfraHealthPage /> },
          { path: '/compliance', element: <ErasureQueuePage /> },
          { path: '/erasure-queue', element: <ErasureQueuePage /> },
          { path: '/audit-viewer', element: <AuditViewerPage /> },
          { path: '/security', element: <SecurityCenterPage /> },
          { path: '/keys', element: <KeyRotationPage /> },
          { path: '/reports', element: <ExecutiveReportsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
