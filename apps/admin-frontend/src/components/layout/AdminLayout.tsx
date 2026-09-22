import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Search, Bell, ShieldAlert } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--admin-content-bg)' }}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--admin-topbar-bg)',
          borderBottom: '1px solid var(--admin-topbar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
        }}>
          {/* Global Search Bar */}
          <div style={{ position: 'relative', width: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
            <input
              type="text"
              placeholder="Global Search (Ctrl+K) — Workspaces, Phones, Emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                backgroundColor: 'var(--color-slate-50)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Right Topbar Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live Environment Badge */}
            <div className="badge badge-amber" style={{ padding: '4px 12px', fontSize: '11px' }}>
              <ShieldAlert size={12} /> PRODUCTION
            </div>

            {/* Notification Bell */}
            <button style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-slate-600)',
              padding: '6px',
              borderRadius: '6px',
            }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-red-600)',
              }} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
