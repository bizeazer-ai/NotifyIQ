import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { setCurrentWorkspace } from '../../store/slices/workspaceSlice';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import { AppFooter } from '../../components/layout/AppFooter';

interface LoginResponse {
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      isEmailVerified?: boolean;
    };
    workspace: {
      id: string;
      name: string;
      slug: string;
      referralSource?: string | null;
    };
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setUnverifiedEmail(null);
    setLoading(true);
    dispatch(loginStart());

    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        email: email.trim(),
        password,
        passwordLegacy: password,
      });

      const { token, user, workspace } = response.data;

      // Update Redux states
      dispatch(loginSuccess({ token, user }));
      dispatch(setCurrentWorkspace(workspace));

      // Redirect to home dashboard
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        if (
          err.status === 403 ||
          err.data?.requiresVerification ||
          err.message?.toLowerCase().includes('verify')
        ) {
          setUnverifiedEmail(err.data?.email || email.trim());
        }
      } else {
        setErrorMsg('Invalid credentials. Please try again.');
      }
      dispatch(loginFailure(err instanceof Error ? err.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">IQ</div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to manage your WABA automations</p>
        </div>

        {errorMsg && (
          <div className="auth-error">
            <div>{errorMsg}</div>
            {unverifiedEmail && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(220,38,38,0.2)' }}>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Verify your email address now
                </Link>
              </div>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="auth-link"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Sign up
          </Link>
        </div>
      </div>
      <AppFooter style={{ background: 'transparent', borderTop: 'none', maxWidth: '440px', marginTop: 'var(--space-2)' }} />
    </div>
  );
}
