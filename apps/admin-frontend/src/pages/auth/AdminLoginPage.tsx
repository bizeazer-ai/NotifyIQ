import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY, adminFetch } from '../../lib/api';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [challengeToken, setChallengeToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminFetch('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = res.data || res;

      if (data.requires2FASetup) {
        navigate('/setup-2fa', { state: { challengeToken: data.challengeToken, email } });
        return;
      }

      if (data.requires2FA) {
        setChallengeToken(data.challengeToken);
        navigate('/verify-2fa', { state: { challengeToken: data.challengeToken, email } });
        setStep('2fa');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminFetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, code }),
      });
      const data = res.data || res;

      localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-slate-950)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--color-slate-900)',
        border: '1px solid var(--color-slate-800)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-blue-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            marginBottom: '16px',
          }}>
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
            {step === 'login' ? 'Mission Control Sign In' : 'Two-Factor Authentication'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-slate-400)' }}>
            {step === 'login' ? 'Internal administration console for BizEazer staff' : `Enter code for ${email}`}
          </p>
        </div>

        {error && (
          <div style={{
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
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-slate-300)', marginBottom: '6px' }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-500)' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@bizeazer.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-slate-700)',
                    backgroundColor: 'var(--color-slate-800)',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-slate-300)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-500)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-slate-700)',
                    backgroundColor: 'var(--color-slate-800)',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blue-600)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'Authenticating...' : <><span>Continue to 2FA</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-slate-300)', marginBottom: '6px' }}>
                6-Digit Authenticator Code
              </label>
              <input
                type="text"
                required
                maxLength={8}
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blue-600)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Enter Mission Control'}
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--color-slate-400)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Back to Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
