import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import { AppFooter } from '../../components/layout/AppFooter';
import { Icon } from '../../components/ui/Icon';

interface RegisterResponse {
  message: string;
  data: {
    requiresVerification?: boolean;
    email?: string;
    token?: string;
    user?: {
      id: string;
      email: string;
      role: string;
    };
    workspace?: {
      id: string;
      name: string;
      slug: string;
      referralSource?: string | null;
    };
  };
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();

  // Parse referral source from URL parameter (e.g. ?ref=rolodiq)
  const referralSource = searchParams.get('ref') || undefined;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
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

    try {
      const response = await apiClient.post<RegisterResponse>('/api/auth/register', {
        email: email.trim(),
        name: fullName.trim() || email.split('@')[0],
        fullName: fullName.trim() || email.split('@')[0],
        password,
        passwordLegacy: password,
        workspaceName: workspaceName.trim(),
        referralSource,
      });

      const userEmail = response.data?.email || email.trim();
      setRegisteredEmail(userEmail);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ flexDirection: 'column', padding: 'var(--space-6) var(--space-4)' }}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">IQ</div>
          <h2 className="auth-title">
            {registeredEmail ? 'Verify Your Email' : 'Create your account'}
          </h2>
          <p className="auth-subtitle">
            {registeredEmail
              ? 'Activation link sent to your inbox'
              : 'Launch your brand and automate WABA notifications'}
          </p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        {registeredEmail ? (
          <div className="auth-info-box">
            <div className="auth-icon-circle"><Icon name="mail" size={24} /></div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
              Verify your email address
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: 'var(--color-foreground-muted)',
                lineHeight: 1.5,
              }}
            >
              We've sent a verification link to{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{registeredEmail}</strong>. Please
              check your inbox to activate your account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
                className="auth-btn"
                style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
              >
                Enter Verification Code
              </Link>
              <Link to="/login" className="auth-btn-secondary">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="workspace-name-input">
                Company / Workspace Name
              </label>
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
              <label className="form-label" htmlFor="full-name-input">
                Full Name
              </label>
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
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
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
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-success)',
                  fontWeight: 600,
                  textAlign: 'left',
                  marginTop: '-4px',
                }}
              >
                Referral source: {referralSource}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
      <AppFooter style={{ background: 'transparent', borderTop: 'none', maxWidth: '440px', marginTop: 'var(--space-2)' }} />
    </div>
  );
}
