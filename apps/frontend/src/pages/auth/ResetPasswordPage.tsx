import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import { AppFooter } from '../../components/layout/AppFooter';

interface ResetPasswordResponse {
  message: string;
  data: {
    success: boolean;
    message: string;
  };
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMsg('Missing or invalid password reset token. Please request a new link.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await apiClient.post<ResetPasswordResponse>('/api/auth/reset-password', {
        token,
        newPassword,
      });

      setSuccessMsg(
        response.message || 'Password has been successfully reset! Redirecting to sign in...',
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Invalid or expired password reset link. Please request a new one.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">IQ</div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Choose a new, secure password for your NotifyIQ account</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {!token ? (
          <div className="auth-info-box">
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--color-error)' }}>
              Invalid or missing reset token. Please request a new password reset link.
            </p>
            <Link to="/forgot-password" className="auth-btn-secondary">
              Go to Forgot Password
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password-input">
                New Password
              </label>
              <input
                id="new-password-input"
                type="password"
                className="form-input"
                placeholder="•••••••• (Min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || Boolean(successMsg)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-input">
                Confirm Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || Boolean(successMsg)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading || Boolean(successMsg)}>
              {loading ? 'Updating password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Back to{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
      <AppFooter style={{ background: 'transparent', borderTop: 'none', maxWidth: '440px', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

