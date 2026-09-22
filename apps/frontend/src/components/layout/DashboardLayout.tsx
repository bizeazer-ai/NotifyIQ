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

  const isActive = (path: string) => location.pathname === path;
  const isActiveAny = (...paths: string[]) => paths.some(p => location.pathname === p);

  return (
    <div className="inbox-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">IQ</div>
          <span className="brand-name">NotifyIQ</span>
        </div>

        <div className="workspace-badge">
          <div className="ws-label">{t('workspace')}</div>
          <div className="ws-name">
            {currentWorkspace?.name || 'Loading Workspace...'}
          </div>
          <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className={`dot ${isConnected ? 'dot-connected' : 'dot-disconnected'}`} />
            {isConnected ? t('connected') : t('mockActive')}
          </div>

          {/* Language Switcher */}
          <div className="ws-lang-select">
            <Icon name="globe" size={14} style={{ color: 'var(--color-foreground-muted)' }} />
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

        <ul className="sidebar-menu">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActiveAny('/', '/dashboard') ? 'active' : ''}`}>
              <Icon name="globe" />
              <span>Dashboard</span>
            </li>
          </Link>
          <Link to="/inbox" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/inbox') ? 'active' : ''}`}>
              <Icon name="chats" />
              <span>{t('inbox')}</span>
            </li>
          </Link>
          <Link to="/contacts" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/contacts') ? 'active' : ''}`}>
              <Icon name="users" />
              <span>Contacts</span>
            </li>
          </Link>
          <Link to="/campaigns" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/campaigns') ? 'active' : ''}`}>
              <Icon name="plane" />
              <span>Campaigns</span>
            </li>
          </Link>
          <Link to="/campaigns/templates" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/campaigns/templates') ? 'active' : ''}`}>
              <Icon name="document" />
              <span>WhatsApp Templates</span>
            </li>
          </Link>
          <Link to="/flows" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/flows') ? 'active' : ''}`}>
              <Icon name="fork" />
              <span>Flow Builder</span>
            </li>
          </Link>
          <Link to="/knowledge-base" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/knowledge-base') ? 'active' : ''}`}>
              <Icon name="brain" />
              <span>Knowledge Base RAG</span>
            </li>
          </Link>
          <Link to="/billing" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/billing') ? 'active' : ''}`}>
              <Icon name="coins" />
              <span>Billing & Usage</span>
            </li>
          </Link>
          <Link to="/settings" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/settings') ? 'active' : ''}`}>
              <Icon name="gear" />
              <span>{t('aiSettings')}</span>
            </li>
          </Link>
          <Link to="/settings/waba" style={{ textDecoration: 'none' }}>
            <li className={`menu-item ${isActive('/settings/waba') ? 'active' : ''}`}>
              <Icon name="shield" />
              <span>Meta WABA Profile</span>
            </li>
          </Link>
        </ul>

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

      {/* Nested Outlet Page views */}
      <Outlet />
    </div>
  );
}
