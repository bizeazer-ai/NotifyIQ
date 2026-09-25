import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const AdminImpersonationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const workspaceRaw = searchParams.get('workspace');

    if (!token) {
      setError('Invalid or missing impersonation token');
      return;
    }

    try {
      localStorage.setItem('notifyiq_token', token);
      if (workspaceRaw) {
        localStorage.setItem('notifyiq_workspace', workspaceRaw);
      }
      // Force reload page to initialize fresh auth & workspace state
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError('Failed to establish impersonated session');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#FFF',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      }}>
        {error ? (
          <div>
            <svg style={{ width: '40px', height: '40px', margin: '0 auto 16px', color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Impersonation Failed</h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px' }}>{error}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFF',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div>
            <svg style={{ width: '44px', height: '44px', margin: '0 auto 16px', color: '#10B981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Authenticating Support Session</h2>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>
              Establishing administrative access to tenant workspace...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImpersonationPage;
