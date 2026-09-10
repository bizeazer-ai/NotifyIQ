import { Icon } from './Icon';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  minHeight?: string;
}

export function ErrorAlert({
  title = 'API Connection Error',
  message,
  onRetry,
  minHeight,
}: ErrorAlertProps) {
  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        margin: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: minHeight ? 'center' : 'flex-start',
        justifyContent: minHeight ? 'center' : 'flex-start',
        minHeight,
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="alert" size={18} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>{title}</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '4px',
            transition: 'opacity 0.2s',
          }}
        >
          <Icon name="refresh" size={14} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
