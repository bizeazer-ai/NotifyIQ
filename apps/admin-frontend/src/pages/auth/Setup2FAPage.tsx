import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const Setup2FAPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { challengeToken?: string; email?: string } | undefined;

  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state?.challengeToken) {
      navigate('/login');
      return;
    }

    const init2FA = async () => {
      try {
        const res = await adminFetch('/api/admin/auth/setup-2fa', {
          method: 'POST',
          body: JSON.stringify({ challengeToken: state.challengeToken }),
        });
        const data = res.data || res;
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes || []);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize 2FA setup');
      } finally {
        setLoading(false);
      }
    };

    init2FA();
  }, [state, navigate]);

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
        maxWidth: '520px',
        backgroundColor: 'var(--color-slate-900)',
        border: '1px solid var(--color-slate-800)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        color: '#FFF',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-blue-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <QrCode size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Enroll 2FA Security</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-slate-400)', marginTop: '4px' }}>
            Scan with Google Authenticator, Authy, or 1Password
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid var(--color-red-600)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#FCA5A5',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-slate-400)' }}>
            Generating security credentials...
          </div>
        ) : (
          <div>
            {/* QR Code Container */}
            <div style={{
              backgroundColor: '#FFF',
              padding: '16px',
              borderRadius: '12px',
              width: 'fit-content',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}>
              {qrCode && <img src={qrCode} alt="2FA QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-slate-400)', display: 'block', marginBottom: '4px' }}>
                Manual Secret Key
              </span>
              <code style={{
                backgroundColor: 'var(--color-slate-800)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--color-amber-500)',
                fontFamily: 'monospace',
              }}>
                {secret}
              </code>
            </div>

            {/* Backup Codes Section */}
            {backupCodes.length > 0 && (
              <div style={{
                backgroundColor: 'var(--color-slate-800)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid var(--color-slate-700)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#FFF', marginBottom: '8px' }}>
                  <Key size={16} color="var(--color-amber-500)" />
                  <span>Single-Use Emergency Backup Codes</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginBottom: '12px' }}>
                  Store these securely. Each code can be used once if you lose access to your authenticator device.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--color-slate-300)',
                }}>
                  {backupCodes.map((code, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--color-slate-900)', padding: '6px 10px', borderRadius: '4px', textAlign: 'center' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/verify-2fa', { state: { challengeToken: state?.challengeToken } })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-blue-600)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Proceed to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
