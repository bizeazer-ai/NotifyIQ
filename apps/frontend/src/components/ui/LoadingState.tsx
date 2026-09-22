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
        padding: 'var(--space-12) var(--space-6)',
        minHeight,
        width: '100%',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 'var(--space-5)',
        }}
      />
      <div style={{
        fontSize: 'var(--text-md)',
        fontWeight: 600,
        color: 'var(--color-foreground)',
        marginBottom: 'var(--space-1)',
      }}>
        {message}
      </div>
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-foreground-secondary)',
      }}>
        {subtitle}
      </div>
    </div>
  );
}
