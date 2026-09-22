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
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-error-muted)',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        color: 'var(--color-foreground)',
        margin: 'var(--space-4) 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: minHeight ? 'center' : 'flex-start',
        justifyContent: minHeight ? 'center' : 'flex-start',
        minHeight,
        gap: 'var(--space-3)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className="card-icon" style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          color: 'var(--color-error)',
        }}>
          <Icon name="alert" size={18} />
        </div>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--color-error)',
          }}>
            {title}
          </h4>
          <p style={{
            margin: '2px 0 0 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-foreground-secondary)',
          }}>
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button className="btn btn-danger" onClick={onRetry} style={{ marginTop: 'var(--space-1)' }}>
          <Icon name="refresh" size={14} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
