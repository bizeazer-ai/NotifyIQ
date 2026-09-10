interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  minHeight?: string;
}

export function LoadingState({
  message = 'Loading workspace data...',
  subtitle = 'Fetching latest records from server',
  minHeight = '320px',
}: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        minHeight,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }}
      />
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {message}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {subtitle}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
