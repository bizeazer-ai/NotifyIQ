import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { setCurrentWorkspace } from '../../store/slices/workspaceSlice';
import { apiClient, ApiError } from '../../lib/api/apiClient';

interface RegisterResponse {
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
    workspace: {
      id: string;
      name: string;
      slug: string;
      referralSource?: string | null;
    };
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // Parse referral source from URL parameter (e.g. ?ref=rolodiq)
  const referralSource = searchParams.get('ref') || undefined;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !workspaceName.trim()) {
      setErrorMsg('All required fields must be filled.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    dispatch(loginStart());

    try {
      const response = await apiClient.post<RegisterResponse>('/api/auth/register', {
        email,
        name: fullName.trim() || email.split('@')[0],
        fullName: fullName.trim() || email.split('@')[0],
        password,
        passwordLegacy: password,
        workspaceName,
        referralSource,
      });

      const { token, user, workspace } = response.data;

      // Update Redux states
      dispatch(loginSuccess({ token, user }));
      dispatch(setCurrentWorkspace(workspace));

      // Redirect to home dashboard
      navigate('/');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      setErrorMsg(msg);
      dispatch(loginFailure(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">IQ</div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Launch your brand and automate WABA notifications</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="workspace-name-input">Company / Workspace Name</label>
            <input
              id="workspace-name-input"
              type="text"
              className="form-input"
              placeholder="BizEazer Pvt Ltd"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="full-name-input">Full Name</label>
            <input
              id="full-name-input"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
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
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="•••••••• (Min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {referralSource && (
            <div style={{ fontSize: '12px', color: 'var(--sentiment-positive)', fontWeight: 600, textAlign: 'left', marginTop: '-4px' }}>
              ✓ Tracking referral source: {referralSource}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
