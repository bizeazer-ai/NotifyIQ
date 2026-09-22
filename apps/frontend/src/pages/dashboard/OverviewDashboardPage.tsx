import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

interface DashboardMetrics {
  totalMessages: number;
  outboundMessages: number;
  deliveredMessages: number;
  deliveryRatePercent: number;
  totalConversations: number;
  urgentConversations: number;
  totalContacts: number;
  botContainmentRatePercent: number;
  totalAccruedCost: number;
  dailyMetrics: Array<{ day: string; inbound: number; outbound: number }>;
}

export default function OverviewDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: DashboardMetrics }>('/api/analytics/overview');
      if (res.data) {
        setMetrics(res.data);
      } else {
        setMetrics(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch executive dashboard analytics from backend.');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Executive Overview Dashboard</h1>
          <p className="page-subtitle">
            Real-time analytics for WhatsApp dispatches, Meta delivery SLA %, AI bot containment, and active client threads.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={loadMetrics}>
            <Icon name="refresh" size={14} />
            <span>Refresh Data</span>
          </button>
        </div>
      </header>

      {loading ? (
        <LoadingState message="Calculating workspace analytics..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadMetrics} title="Dashboard Analytics Error" />
      ) : !metrics ? (
        <EmptyState
          title="No Analytics Data Available"
          description="Start sending messages or launch campaigns to view workspace analytics and delivery rates."
          icon="sparkles"
          actionLabel="Refresh Overview"
          onAction={loadMetrics}
        />
      ) : (
        <div style={{ animation: 'slideUp 0.4s ease' }}>
          {/* Key Metric Cards */}
          <div className="stat-grid">
            <div className="stat-card stat-blue card-hover">
              <div className="stat-card-label">Total WhatsApp Messages</div>
              <div className="stat-card-value">{metrics.totalMessages?.toLocaleString() ?? 0}</div>
            </div>

            <div className="stat-card stat-green card-hover">
              <div className="stat-card-label">Delivery SLA Rate</div>
              <div className="stat-card-value">{metrics.deliveryRatePercent ?? 0}%</div>
            </div>

            <div className="stat-card stat-purple card-hover">
              <div className="stat-card-label">Gemini Bot Containment</div>
              <div className="stat-card-value">{metrics.botContainmentRatePercent ?? 0}%</div>
            </div>

            <div className="stat-card stat-cyan card-hover">
              <div className="stat-card-label">Active Contacts</div>
              <div className="stat-card-value">{metrics.totalContacts?.toLocaleString() ?? 0}</div>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="section-card">
            <h3 className="section-title">
              <Icon name="chats" className="section-title-icon" style={{ color: 'var(--color-primary)' }} />
              <span>Weekly Message Volume Trends</span>
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'var(--space-6)',
              height: '200px',
              paddingTop: 'var(--space-5)',
            }}>
              {(metrics.dailyMetrics || []).map((item) => {
                const maxVal = 700;
                const outHeight = (item.outbound / maxVal) * 160;
                const inHeight = (item.inbound / maxVal) * 160;

                return (
                  <div key={item.day} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end', height: '160px' }}>
                      <div
                        title={`Inbound: ${item.inbound}`}
                        style={{
                          width: '18px',
                          height: `${inHeight}px`,
                          backgroundColor: 'var(--color-info)',
                          borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                          transition: 'height 0.6s ease',
                        }}
                      />
                      <div
                        title={`Outbound: ${item.outbound}`}
                        style={{
                          width: '18px',
                          height: `${outHeight}px`,
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                          transition: 'height 0.6s ease',
                        }}
                      />
                    </div>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-foreground-secondary)',
                      marginTop: 'var(--space-2)',
                      fontWeight: 600,
                    }}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: 'flex',
              gap: 'var(--space-5)',
              marginTop: 'var(--space-5)',
              justifyContent: 'center',
              fontSize: 'var(--text-xs)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'var(--color-info)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'inline-block',
                }} />
                <span className="text-secondary">Inbound Customer Messages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'inline-block',
                }} />
                <span className="text-secondary">Outbound AI / Broadcast Dispatches</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
