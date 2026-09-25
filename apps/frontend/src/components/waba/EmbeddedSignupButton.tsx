import { useState } from 'react';
import { apiClient } from '../../lib/api/apiClient';

interface EmbeddedSignupButtonProps {
  onSuccess?: () => void;
}

const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID;

export function EmbeddedSignupButton({ onSuccess }: EmbeddedSignupButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // const handleLaunchPopup = () => {
  //   setLoading(true);
  //   setErrorMsg('');

  //   // Launch Meta Facebook Embedded Signup OAuth Dialog window
  //   const appId = import.meta.env.VITE_META_APP_ID || '1234567890';
  //   const configId = import.meta.env.VITE_META_CONFIG_ID;
  //   const redirectUri = encodeURIComponent(window.location.origin + '/settings/waba');
  //   debugger
  //   const popupUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&config_id=${configId}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code`;

  //   const popup = window.open(popupUrl, 'Meta WABA Embedded Signup', 'width=600,height=700,scrollbars=yes');

  //   // Poll for OAuth code returned in popup window or simulate connection
  //   const timer = setInterval(async () => {
  //     try {
  //       if (!popup || popup.closed) {
  //         clearInterval(timer);
  //         setLoading(false);
  //         // Trigger automatic completion handler
  //         await triggerCallback('mock_embedded_signup_code_fb_123');
  //       }
  //     } catch {
  //       // Cross-origin check block expected
  //     }
  //   }, 1000);
  // };

  const handleLaunchPopup = () => {
    debugger;
    console.log(META_CONFIG_ID);
    setErrorMsg("");
    (window as any).FB.login(function (response: { authResponse: { code: string } | null }) {
      debugger;
      if (response?.authResponse) {
        // The user successfully went through the popup flow
        const accessToken = response.authResponse.code;

        // Send this token directly to your backend server
        triggerCallback(accessToken);
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      config_id: META_CONFIG_ID,
      response_type: 'code',
      // This tells Meta to override standard OAuth and pass the token securely
      override_default_response_type: true
    });
  }

  const triggerCallback = async (code: string) => {
    try {
      await apiClient.post('https://elaborate-tribune-geography.ngrok-free.dev/api/waba/embedded-signup/callback', { code });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Meta signup integration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={handleLaunchPopup}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 24px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #1877F2 0%, #0056b3 100%)',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>{loading ? 'Connecting with Meta Facebook...' : 'Continue with Meta Embedded Signup'}</span>
      </button>

      {errorMsg && (
        <div style={{ color: 'var(--sentiment-urgent)', fontSize: '12px', marginTop: '8px' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
