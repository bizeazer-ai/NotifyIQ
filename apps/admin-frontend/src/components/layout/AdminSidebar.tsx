import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Cpu,
  Layers,
  ShieldCheck,
  FileText,
  Key,
  LogOut,
  Shield,
} from 'lucide-react';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY, adminFetch } from '../../lib/api';

const navItems = [
  { path: '/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
  { path: '/workspaces', label: 'Workspaces', icon: Building2 },
  { path: '/billing', label: 'Billing Oversight', icon: CreditCard },
  { path: '/ai-ops', label: 'AI Operations', icon: Cpu },
  { path: '/queues', label: 'System Queues', icon: Layers },
  { path: '/compliance', label: 'Compliance & Audit', icon: ShieldCheck },
  { path: '/security', label: 'Security Center', icon: Shield },
  { path: '/reports', label: 'Executive Reports', icon: FileText },
  { path: '/keys', label: 'Key Rotation', icon: Key },
];

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem(ADMIN_USER_KEY);
  debugger
  const adminUser = userJson !== "undefined" ? JSON.parse(userJson || "{}") : null;

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--admin-sidebar-bg)',
      color: 'var(--admin-sidebar-text)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-blue-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          color: '#FFF',
          fontSize: '18px',
        }}>
          N
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', lineHeight: 1.2 }}>NotifyIQ</h2>
          <span style={{ fontSize: '11px', color: 'var(--color-orange-600)', fontWeight: 600, letterSpacing: '0.5px' }}>
            MISSION CONTROL
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-500)', padding: '0 12px 8px', textTransform: 'uppercase' }}>
          Administration
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? '#FFF' : 'var(--admin-sidebar-text)',
                backgroundColor: isActive ? 'var(--color-blue-600)' : 'transparent',
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ overflow: 'hidden', marginRight: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {adminUser?.email || 'SuperAdmin'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-slate-400)', textTransform: 'capitalize' }}>
            {adminUser?.role?.replace('_', ' ') || 'Platform Owner'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-slate-400)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-red-600)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-slate-400)')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
