
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_USER_KEY,
  adminFetch,
} from '../../lib/api';

interface TwoFactorLocationState {
  challengeToken?: string;
  email?: string;
}

export const Admin2FAPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as TwoFactorLocationState | null;

  const challengeToken = state?.challengeToken ?? '';
  const email = state?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prevent accidental double submission even if the browser/UI
  // triggers the submit handler twice.
  const submittingRef = useRef(false);

  useEffect(() => {
    debugger
    if (!challengeToken) {
      navigate('/login', { replace: true });
    }
  }, [challengeToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || submittingRef.current) {
      return;
    }

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError('Enter your authenticator code');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await adminFetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({
          challengeToken,
          code: normalizedCode,
        }),
      });

      localStorage.setItem(
        ADMIN_TOKEN_KEY,
        res.data.accessToken,
      );

      localStorage.setItem(
        ADMIN_USER_KEY,
        JSON.stringify(res.data.admin),
      );

      navigate('/dashboard', {
        replace: true,
      });
    } catch (err: any) {
      setError(
        err.message || '2FA verification failed',
      );

      // Allow retry after a failed request.
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login', {
      replace: true,
    });
  };

  if (!challengeToken) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-slate-950)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-slate-900)',
          border: '1px solid var(--color-slate-800)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-blue-600)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              marginBottom: '16px',
            }}
          >
            <Shield size={24} />
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#FFF',
              marginBottom: '6px',
            }}
          >
            Two-Factor Authentication
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-slate-400)',
            }}
          >
            Enter the code from your authenticator app
          </p>

          {email && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-slate-500)',
                marginTop: '6px',
              }}
            >
              {email}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid var(--color-red-600)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#FCA5A5',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="two-factor-code"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-slate-300)',
                marginBottom: '6px',
              }}
            >
              6-Digit Authenticator Code
            </label>

            <input
              id="two-factor-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6);

                setCode(value);
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-700)',
                backgroundColor: 'var(--color-slate-800)',
                color: '#FFF',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '6px',
                outline: 'none',
                fontWeight: 700,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-blue-600)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor:
                loading || code.length !== 6
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                loading || code.length !== 6
                  ? 0.6
                  : 1,
            }}
          >
            {loading
              ? 'Verifying...'
              : 'Verify & Enter Mission Control'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleBack}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--color-slate-400)',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
};