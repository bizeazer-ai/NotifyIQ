import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { loginSuccess } from '../../store/slices/authSlice';
import { setCurrentWorkspace } from '../../store/slices/workspaceSlice';
import { apiClient, ApiError } from '../../lib/api/apiClient';
import { AppFooter } from '../../components/layout/AppFooter';

interface VerifyResponse {
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      isEmailVerified: boolean;
    };
    workspace: {
      id: string;
      name: string;
      slug: string;
      referralSource?: string | null;
    };
  };
}

interface ResendResponse {
  message: string;
  data: {
    success: boolean;
    message: string;
  };
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [showResend, setShowResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleVerify = async (tokenToUse: string) => {
    const trimmed = tokenToUse.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your verification token or code.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsVerifying(true);

    try {
      const response = await apiClient.post<VerifyResponse>('/api/auth/verify-email', {
        token: trimmed,
      });

      const { token, user, workspace } = response.data;

      // Update Redux state and auto-login
      dispatch(loginSuccess({ token, user }));
      dispatch(setCurrentWorkspace(workspace));

      setSuccessMsg(response.message || 'Email verified successfully! Redirecting to dashboard...');

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Invalid or expired verification token. Please request a new link.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      handleVerify(tokenParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam]);

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsResending(true);

    try {
      const response = await apiClient.post<ResendResponse>('/api/auth/resend-verification', {
        email: resendEmail.trim(),
      });

      setSuccessMsg(
        response.message || 'Verification link has been sent to your email. Please check your inbox.',
      );
      setShowResend(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to resend verification email. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">IQ</div>
          <h2 className="auth-title">Email Verification</h2>
          <p className="auth-subtitle">Confirm your email address to activate your NotifyIQ account</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {!showResend ? (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(tokenInput);
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="token-input">
                Verification Code / Token
              </label>
              <input
                id="token-input"
                type="text"
                className="form-input"
                style={{ textAlign: 'center', fontFamily: 'monospace', letterSpacing: '2px' }}
                placeholder="Paste code or verification token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={isVerifying || Boolean(successMsg)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={isVerifying || !tokenInput.trim() || Boolean(successMsg)}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setShowResend(true);
                }}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Didn't receive email? Resend verification link
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResend}>
            <div className="form-group">
              <label className="form-label" htmlFor="resend-email-input">
                Registered Email Address
              </label>
              <input
                id="resend-email-input"
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={isResending}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isResending}>
              {isResending ? 'Sending email...' : 'Send Verification Email'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setShowResend(false);
                }}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                ← Back to token verification
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Already verified?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
      <AppFooter style={{ background: 'transparent', borderTop: 'none', maxWidth: '440px', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

