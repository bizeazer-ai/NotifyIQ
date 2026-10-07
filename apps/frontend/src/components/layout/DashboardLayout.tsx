import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { clearWorkspaceState } from '../../store/slices/workspaceSlice';
import { useSocket } from '../../app/SocketProvider';
import { useTranslation, type LanguageCode } from '../../i18n';
import { Icon } from '../ui/Icon';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isConnected } = useSocket();
  const { t, lang, changeLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const currentWorkspace = useAppSelector((state) => state.workspace.currentWorkspace);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearWorkspaceState());
    navigate('/login');
  };

  const getInitials = (emailStr?: string) => {
    if (!emailStr) return 'AD';
    return emailStr.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;
  const isActiveAny = (...paths: string[]) => paths.some((p) => location.pathname === p);

  // Dynamic breadcrumb mapping
  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p === '/' || p === '/dashboard') return 'Executive Dashboard';
    if (p === '/inbox') return 'Live Workspace Inbox';
    if (p === '/contacts') return 'Contacts Directory';
    if (p === '/campaigns') return 'Broadcast Campaigns';
    if (p === '/campaigns/templates') return 'WhatsApp Message Templates';
    if (p === '/flows') return 'Visual Automation Flows';
    if (p === '/knowledge-base') return 'RAG Grounded Knowledge Base';
    if (p === '/billing') return 'Billing & Usage Analytics';
    if (p === '/settings') return 'AI Agent & System Settings';
    if (p === '/settings/waba') return 'Meta WABA API Profile';
    if (p === '/settings/webhooks' || p === '/webhooks') return 'Outbound Webhooks & Events';
    return 'Console';
  };

  return (
    <div className="inbox-container">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="modal-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{ zIndex: 90 }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">IQ</div>
          <div style={{ flex: 1 }}>
            <span className="brand-name">NotifyIQ</span>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px' }}>WABA ENTERPRISE AI</div>
          </div>
        </div>

        <div className="workspace-badge">
          <div className="ws-label">{t('workspace')}</div>
          <div className="ws-name">
            {currentWorkspace?.name || 'Workspace Portal'}
          </div>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className={`dot ${isConnected ? 'dot-connected' : 'dot-disconnected'}`} />
            {isConnected ? 'META API ONLINE' : t('mockActive')}
          </div>

          {/* Language Switcher */}
          <div className="ws-lang-select">
            <Icon name="globe" size={14} style={{ color: '#94A3B8' }} />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-group-label">Core Console</div>
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActiveAny('/', '/dashboard') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-blue">
                <Icon name="globe" size={16} />
              </div>
              <span className="menu-title">Overview</span>
            </div>
          </Link>
          <Link to="/inbox" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/inbox') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-emerald">
                <Icon name="chats" size={16} />
              </div>
              <span className="menu-title">{t('inbox')}</span>
              <span className="nav-badge nav-badge-live">LIVE</span>
            </div>
          </Link>

          <div className="menu-group-label">Engagement & Automation</div>
          <Link to="/contacts" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/contacts') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-indigo">
                <Icon name="users" size={16} />
              </div>
              <span className="menu-title">Contacts Directory</span>
            </div>
          </Link>
          <Link to="/campaigns" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/campaigns') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-violet">
                <Icon name="plane" size={16} />
              </div>
              <span className="menu-title">Broadcast Campaigns</span>
            </div>
          </Link>
          <Link to="/campaigns/templates" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/campaigns/templates') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-amber">
                <Icon name="document" size={16} />
              </div>
              <span className="menu-title">WhatsApp Templates</span>
            </div>
          </Link>
          <Link to="/flows" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/flows') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-teal">
                <Icon name="fork" size={16} />
              </div>
              <span className="menu-title">Flow Builder</span>
            </div>
          </Link>

          <div className="menu-group-label">Intelligence & System</div>
          <Link to="/knowledge-base" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/knowledge-base') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-rose">
                <Icon name="brain" size={16} />
              </div>
              <span className="menu-title">Knowledge RAG</span>
              <span className="nav-badge nav-badge-ai">AI</span>
            </div>
          </Link>
          <Link to="/billing" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/billing') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-sky">
                <Icon name="coins" size={16} />
              </div>
              <span className="menu-title">Billing & Usage</span>
            </div>
          </Link>
          <Link to="/settings" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/settings') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-slate">
                <Icon name="gear" size={16} />
              </div>
              <span className="menu-title">{t('aiSettings')}</span>
            </div>
          </Link>
          <Link to="/settings/waba" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActive('/settings/waba') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-green">
                <Icon name="shield" size={16} />
              </div>
              <span className="menu-title">Meta WABA Profile</span>
            </div>
          </Link>
          <Link to="/settings/webhooks" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
            <div className={`menu-item ${isActiveAny('/settings/webhooks', '/webhooks') ? 'active' : ''}`}>
              <div className="icon-badge icon-badge-indigo">
                <Icon name="webhook" size={16} />
              </div>
              <span className="menu-title">{t('webhooks')}</span>
              <span className="nav-badge nav-badge-live">LIVE</span>
            </div>
          </Link>
        </div>

        {/* User profile & Logout */}
        <div className="user-profile">
          <div className="user-profile-row">
            <div className="avatar">{getInitials(user?.email)}</div>
            <div className="user-info" style={{ flex: 1 }}>
              <div className="name">
                {user?.email ? user.email.split('@')[0] : 'User'}
              </div>
              <div className="role">
                {user?.role === 'admin' ? 'Workspace Admin' : 'Agent User'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container with Executive Top Header */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--color-background)' }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '60px',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Left Title & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ padding: '6px' }}
              aria-label="Toggle Navigation"
            >
              <Icon name="menu" size={20} />
            </button>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Console • {currentWorkspace?.name || 'Workspace'}
              </div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                {getBreadcrumbTitle()}
              </h2>
            </div>
          </div>

          {/* Right Action Icons & User Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Quick Environment Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isConnected ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
                color: isConnected ? 'var(--color-success)' : 'var(--color-warning)',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${isConnected ? 'rgba(5, 150, 105, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-warning)',
                  display: 'inline-block',
                }}
              />
              <span>{isConnected ? 'META API ONLINE' : 'DISCONNECTED'}</span>
            </div>

            {/* Quick Action Search Hint */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: 'var(--color-foreground-secondary)',
                cursor: 'pointer',
              }}
            >
              <Icon name="search" size={14} style={{ color: 'var(--color-foreground-muted)' }} />
              <span>Search threads, contacts...</span>
              <kbd
                style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  marginLeft: '8px',
                  color: 'var(--color-foreground-muted)',
                }}
              >
                Ctrl+K
              </kbd>
            </div>

            {/* User Quick Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-muted)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                border: '1px solid var(--color-border)',
              }}
            >
              {getInitials(user?.email)}
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
