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

  return (
    <div className="inbox-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">IQ</div>
          <span className="brand-name">NotifyIQ</span>
        </div>

        <div className="workspace-badge">
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('workspace')}</div>
          <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px', color: 'var(--text-primary)' }}>
            {currentWorkspace?.name || 'Loading Workspace...'}
          </div>
          <div className="status" style={{ color: isConnected ? 'var(--sentiment-positive)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span 
              className="dot" 
              style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: isConnected ? 'var(--sentiment-positive)' : 'var(--text-muted)', 
                borderRadius: '50%',
                boxShadow: isConnected ? '0 0 10px var(--sentiment-positive)' : 'none'
              }}
            ></span>
            {isConnected ? t('connected') : t('mockActive')}
          </div>
          
          {/* Language Switcher */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="globe" size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
        </div>

        <ul className="sidebar-menu">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/' || location.pathname === '/dashboard' ? 'active' : ''}`}>
              <Icon name="globe" />
              <span>Dashboard</span>
            </li>
          </Link>
          <Link to="/inbox" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/inbox' ? 'active' : ''}`}>
              <Icon name="chats" />
              <span>{t('inbox')}</span>
            </li>
          </Link>
          <Link to="/contacts" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/contacts' ? 'active' : ''}`}>
              <Icon name="shield" />
              <span>Contacts</span>
            </li>
          </Link>
          <Link to="/campaigns" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/campaigns' ? 'active' : ''}`}>
              <Icon name="plane" />
              <span>Campaigns</span>
            </li>
          </Link>
          <Link to="/campaigns/templates" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/campaigns/templates' ? 'active' : ''}`}>
              <Icon name="plane" />
              <span>WhatsApp Templates</span>
            </li>
          </Link>
          <Link to="/flows" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/flows' ? 'active' : ''}`}>
              <Icon name="fork" />
              <span>Flow Builder</span>
            </li>
          </Link>
          <Link to="/knowledge-base" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/knowledge-base' ? 'active' : ''}`}>
              <Icon name="brain" />
              <span>Knowledge Base RAG</span>
            </li>
          </Link>
          <Link to="/billing" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/billing' ? 'active' : ''}`}>
              <Icon name="coins" />
              <span>Billing & Usage</span>
            </li>
          </Link>
          <Link to="/settings" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/settings' ? 'active' : ''}`}>
              <Icon name="gear" />
              <span>{t('aiSettings')}</span>
            </li>
          </Link>
          <Link to="/settings/waba" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${location.pathname === '/settings/waba' ? 'active' : ''}`}>
              <Icon name="shield" />
              <span>Meta WABA Profile</span>
            </li>
          </Link>
        </ul>

        {/* User profile details & Logout */}
        <div className="user-profile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div className="avatar">{getInitials(user?.email)}</div>
            <div className="user-info" style={{ flex: 1 }}>
              <div className="name" style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 'bold' }}>
                {user?.email ? user.email.split('@')[0] : 'User'}
              </div>
              <div className="role" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Workspace Admin' : 'Agent User'}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%',
              padding: '8px', 
              borderRadius: '8px', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              background: 'rgba(239, 68, 68, 0.05)', 
              color: 'var(--sentiment-urgent)', 
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon name="trash" size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Nested Outlet Page views */}
      <Outlet />
    </div>
  );
}
