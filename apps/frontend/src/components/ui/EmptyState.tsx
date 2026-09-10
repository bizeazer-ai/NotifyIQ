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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        minHeight,
        boxSizing: 'border-box',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon name={icon} size={24} />
      </div>

      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent)',
            color: 'var(--btn-text)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Icon name="plus" size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
