import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import { AppFooter } from '../../components/layout/AppFooter';

interface ForgotPasswordResponse {
  message: string;
  data: {
    success: boolean;
    message: string;
  };
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await apiClient.post<ForgotPasswordResponse>('/api/auth/forgot-password', {
        email: email.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
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
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive password reset instructions</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        {submitted ? (
          <div className="auth-info-box">
            <div className="auth-icon-circle">✉️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Check your inbox</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-foreground-muted)', lineHeight: 1.5 }}>
              If an account exists for <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>, we have sent a password reset link to your email.
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-foreground-muted)' }}>
              The link is valid for 1 hour. Please check your spam or promotions folder if you don't see it.
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
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

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
      <AppFooter style={{ background: 'transparent', borderTop: 'none', maxWidth: '440px', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

