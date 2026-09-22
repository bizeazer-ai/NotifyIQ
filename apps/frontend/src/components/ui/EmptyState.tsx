import { Icon, type IconProps } from './Icon';

interface EmptyStateProps {
  icon?: IconProps['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  minHeight?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  minHeight = '280px',
}: EmptyStateProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-6)',
        minHeight,
        textAlign: 'center',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      <div className="card-icon" style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--color-primary-muted)',
        color: 'var(--color-primary)',
        marginBottom: 'var(--space-4)',
      }}>
        <Icon name={icon} size={26} />
      </div>

      <h3 style={{
        margin: '0 0 var(--space-2) 0',
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        color: 'var(--color-foreground)',
      }}>
        {title}
      </h3>

      <p style={{
        margin: '0 0 var(--space-5) 0',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-foreground-secondary)',
        maxWidth: '420px',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Icon name="plus" size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
