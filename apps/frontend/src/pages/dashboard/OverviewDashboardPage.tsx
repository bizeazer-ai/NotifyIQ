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
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Executive Overview Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time analytics for WhatsApp dispatches, Meta delivery SLA %, AI bot containment, and active client threads.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="globe" size={14} />
          <span>Refresh Data</span>
        </button>
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
        <div>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Total WhatsApp Messages</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>{metrics.totalMessages?.toLocaleString() ?? 0}</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--sentiment-positive)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Delivery SLA Rate</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--sentiment-positive)' }}>{metrics.deliveryRatePercent ?? 0}%</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--accent-light)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Gemini Bot Containment</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--accent-light)' }}>{metrics.botContainmentRatePercent ?? 0}%</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Active Contacts</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-primary)' }}>{metrics.totalContacts?.toLocaleString() ?? 0}</div>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="chats" style={{ color: 'var(--accent)' }} />
              <span>Weekly Message Volume Trends</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '200px', padding: '20px 0 0 0' }}>
              {(metrics.dailyMetrics || []).map((item) => {
                const maxVal = 700;
                const outHeight = (item.outbound / maxVal) * 160;
                const inHeight = (item.inbound / maxVal) * 160;

                return (
                  <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '160px' }}>
                      <div
                        title={`Inbound: ${item.inbound}`}
                        style={{ width: '16px', height: `${inHeight}px`, backgroundColor: '#38bdf8', borderRadius: '4px 4px 0 0' }}
                      />
                      <div
                        title={`Outbound: ${item.outbound}`}
                        style={{ width: '16px', height: `${outHeight}px`, backgroundColor: 'var(--accent)', borderRadius: '4px 4px 0 0' }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 'bold' }}>{item.day}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '2px' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Inbound Customer Messages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Outbound AI / Broadcast Dispatches</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

