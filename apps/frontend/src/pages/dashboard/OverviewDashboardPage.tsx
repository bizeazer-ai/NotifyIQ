import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  dailyMetrics: Array<{ day: string; dateStr?: string; inbound: number; outbound: number }>;
}

export default function OverviewDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<number>(7);

  const loadMetrics = async (range: number = activeRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: DashboardMetrics }>(`/api/analytics/overview?days=${range}`);
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
    loadMetrics(activeRange);
  }, [activeRange]);

  const handleRangeChange = (days: number) => {
    setActiveRange(days);
  };

  return (
    <div className="page-container">
      {/* Executive Header */}
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Executive Analytics & Real-time Delivery</h1>
          <p className="page-subtitle">
            Real-time analytics for WhatsApp dispatches, Meta delivery SLA %, AI bot containment, and active client threads.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => loadMetrics(activeRange)}>
            <Icon name="refresh" size={14} />
            <span>Refresh Analytics</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/campaigns')}>
            <Icon name="plane" size={14} />
            <span>Launch Broadcast</span>
          </button>
        </div>
      </header>

      {loading ? (
        <LoadingState message="Calculating workspace analytics and Meta SLA telemetry..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => loadMetrics(activeRange)} title="Dashboard Analytics Error" />
      ) : !metrics ? (

        <EmptyState
          title="No Analytics Data Available"
          description="Start sending messages or launch campaigns to view workspace analytics and delivery rates."
          icon="sparkles"
          actionLabel="Refresh Overview"
          onAction={() => loadMetrics(activeRange)}
        />
      ) : (
        <div style={{ animation: 'slideUp 0.35s ease' }}>
          {/* Key Metric Stat Grid */}
          <div className="stat-grid">
            <div className="stat-card stat-blue card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-card-label">Total WhatsApp Dispatches</div>
                <div className="badge badge-primary">Meta WABA</div>
              </div>
              <div className="stat-card-value">{metrics.totalMessages?.toLocaleString() ?? 0}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-secondary)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--color-foreground-muted)', fontWeight: 600 }}>Total inbound & outbound</span>
              </div>
            </div>

            <div className="stat-card stat-green card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-card-label">Delivery SLA Rate</div>
                <div className="badge badge-success">Meta SLA</div>
              </div>
              <div className="stat-card-value">
                {metrics.outboundMessages > 0 ? `${metrics.deliveryRatePercent}%` : 'No data'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-secondary)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{metrics.outboundMessages > 0 ? 'Optimal Meta webhook telemetry' : 'Requires active outbound dispatches'}</span>
              </div>
            </div>

            <div className="stat-card stat-purple card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-card-label">Gemini AI Containment</div>
                <div className="badge badge-neutral">Auto-Reply</div>
              </div>
              <div className="stat-card-value">
                {metrics.totalConversations > 0 ? `${metrics.botContainmentRatePercent}%` : 'No data'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-secondary)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{metrics.totalConversations > 0 ? 'Autonomous bot containment' : 'Requires active client threads'}</span>
              </div>
            </div>

            <div className="stat-card stat-cyan card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-card-label">Active Contacts Directory</div>
                <div className="badge badge-info">Opted-in</div>
              </div>
              <div className="stat-card-value">{metrics.totalContacts?.toLocaleString() ?? 0}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-foreground-secondary)', marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>100% Consent</span>
                <span>verified mobile numbers</span>
              </div>
            </div>
          </div>

          {/* Chart & Quick Shortcuts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            {/* 1. Bar Chart Section */}
            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 className="section-title" style={{ margin: 0 }}>
                  <Icon name="chats" className="section-title-icon" />
                  <span>{activeRange === 30 ? '30-Day Message Telemetry' : 'Weekly Dispatches & Response Telemetry'}</span>
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className={`filter-pill ${activeRange === 7 ? 'active' : ''}`}
                    onClick={() => handleRangeChange(7)}
                    style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${activeRange === 30 ? 'active' : ''}`}
                    onClick={() => handleRangeChange(30)}
                    style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              {/* Bar Chart Graphics */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: activeRange === 30 ? '4px' : 'var(--space-6)',
                height: '220px',
                paddingTop: 'var(--space-6)',
                paddingBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
                overflowX: 'auto',
              }}>
                {(() => {
                  const dailyMetrics = metrics.dailyMetrics || [];
                  const highestCount = Math.max(1, ...dailyMetrics.map((item) => Math.max(item.inbound, item.outbound)));

                  return dailyMetrics.map((item, idx) => {
                    const outHeight = item.outbound > 0 ? Math.max(6, (item.outbound / highestCount) * 160) : 0;
                    const inHeight = item.inbound > 0 ? Math.max(6, (item.inbound / highestCount) * 160) : 0;

                    return (
                      <div key={item.dateStr || item.day || idx} style={{
                        flex: 1,
                        minWidth: activeRange === 30 ? '18px' : '36px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '170px' }}>
                          <div
                            title={`${item.day} - Inbound: ${item.inbound}`}
                            style={{
                              width: activeRange === 30 ? '8px' : '14px',
                              height: `${inHeight}px`,
                              backgroundColor: 'var(--color-info)',
                              borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                              transition: 'height 0.4s ease',
                              opacity: item.inbound > 0 ? 1 : 0.2,
                            }}
                          />
                          <div
                            title={`${item.day} - Outbound: ${item.outbound}`}
                            style={{
                              width: activeRange === 30 ? '8px' : '14px',
                              height: `${outHeight}px`,
                              backgroundColor: 'var(--color-primary)',
                              borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                              transition: 'height 0.4s ease',
                              opacity: item.outbound > 0 ? 1 : 0.2,
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: activeRange === 30 ? '9px' : 'var(--text-xs)',
                          color: 'var(--color-foreground-secondary)',
                          marginTop: 'var(--space-2)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          transform: activeRange === 30 ? 'rotate(-45deg)' : 'none',
                          transformOrigin: 'top left',
                        }}>
                          {activeRange === 30 && idx % 3 !== 0 ? '' : item.day}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Chart Legend */}
              <div style={{
                display: 'flex',
                gap: 'var(--space-6)',
                marginTop: 'var(--space-4)',
                justifyContent: 'center',
                fontSize: 'var(--text-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'var(--color-info)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'inline-block',
                  }} />
                  <span className="text-secondary font-semibold">Inbound Customer Messages</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'inline-block',
                  }} />
                  <span className="text-secondary font-semibold">Outbound AI & Broadcast Messages</span>
                </div>
              </div>
            </div>

            {/* 2. Quick Action Shortcuts Panel */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="section-title">
                <Icon name="sparkles" className="section-title-icon" />
                <span>Quick Actions</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/inbox')}
                  style={{ justifyContent: 'flex-start', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}
                >
                  <Icon name="inbox" style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Open Live Inbox</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Respond to active customer chats</div>
                  </div>
                </button>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/campaigns/templates')}
                  style={{ justifyContent: 'flex-start', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}
                >
                  <Icon name="document" style={{ color: 'var(--color-success)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>WhatsApp Templates</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Design Meta-approved templates</div>
                  </div>
                </button>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/flows')}
                  style={{ justifyContent: 'flex-start', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}
                >
                  <Icon name="fork" style={{ color: '#8B5CF6' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Visual Flow Builder</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Configure automated chat triggers</div>
                  </div>
                </button>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/contacts')}
                  style={{ justifyContent: 'flex-start', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'left' }}
                >
                  <Icon name="users" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>Contacts Directory</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Manage audience tags & CSV import</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
