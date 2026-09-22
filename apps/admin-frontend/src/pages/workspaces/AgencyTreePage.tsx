import React, { useState, useEffect } from 'react';
import { Building2, ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const AgencyTreePage: React.FC = () => {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const data = await adminFetch('/api/admin/workspaces/agency-tree');
        setAgencies(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load agency hierarchy');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Agency Workspace Hierarchy
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
          Parent agency account relationships and managed child workspaces
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--admin-text-muted)', padding: '24px 0' }}>Loading agency tree...</div>
      ) : agencies.length === 0 ? (
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          No agency parent accounts registered.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {agencies.map((agency) => (
            <div key={agency.id} style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--admin-card-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleExpand(agency.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {expanded[agency.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <Building2 size={20} color="var(--color-blue-600)" />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{agency.agencyName}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>/{agency.slug} • Agency Account</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-blue">{agency.childWorkspacesCount} Managed Workspaces</span>
                  <span className={`badge ${agency.active ? 'badge-green' : 'badge-red'}`}>{agency.active ? 'ACTIVE' : 'SUSPENDED'}</span>
                </div>
              </div>

              {expanded[agency.id] && agency.children.length > 0 && (
                <div style={{ marginTop: '16px', paddingLeft: '32px', borderLeft: '2px solid var(--color-slate-200)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agency.children.map((child: any) => (
                    <div key={child.id} style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--color-slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} color="var(--color-slate-500)" />
                        <span style={{ fontWeight: 600 }}>{child.name}</span>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '11px' }}>/{child.slug}</span>
                      </div>
                      <span className="badge badge-blue">{child.plan.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
