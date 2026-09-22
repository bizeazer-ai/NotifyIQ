import React, { useState, useEffect } from 'react';
import { Tag, Plus, RefreshCw, Check, X } from 'lucide-react';
import { adminFetch } from '../../lib/api';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountAmount, setDiscountAmount] = useState('20');
  const [currency, setCurrency] = useState('INR');
  const [maxRedemptions, setMaxRedemptions] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/admin/billing/coupons');
      setCoupons(data.data || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminFetch('/api/admin/billing/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code,
          discountType,
          discountAmount: parseFloat(discountAmount),
          currency,
          maxRedemptions: parseInt(maxRedemptions),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      alert(`Coupon '${code.toUpperCase()}' created successfully!`);
      setShowModal(false);
      setCode('');
      fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      await adminFetch(`/api/admin/billing/coupons/${id}/toggle`, { method: 'PATCH' });
      fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle coupon status');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            Promotional Coupons & Credits
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
            Manage discount codes, percentage vouchers, and promotional credit allocation
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-blue-600)',
            color: '#FFF',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Create Coupon Code
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-red-50)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--color-red-600)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Coupons Table */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-card-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--admin-card-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--admin-card-border)' }}>
              <th style={{ padding: '14px 20px' }}>Coupon Code</th>
              <th style={{ padding: '14px 16px' }}>Discount</th>
              <th style={{ padding: '14px 16px' }}>Redemptions</th>
              <th style={{ padding: '14px 16px' }}>Expiration</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Loading coupon codes...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  No coupons found. Create your first promotional code.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id || c.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                    <code style={{ fontSize: '14px', color: 'var(--color-blue-600)', backgroundColor: 'var(--color-blue-50)', padding: '4px 8px', borderRadius: '4px' }}>
                      {c.code}
                    </code>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    {c.discountType === 'percentage' ? `${c.discountAmount}% OFF` : `${c.currency === 'INR' ? '₹' : '$'}${c.discountAmount} OFF`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {c.redemptionCount} / {c.maxRedemptions}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--admin-text-muted)' }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {c.isActive ? <span className="badge badge-green">ACTIVE</span> : <span className="badge badge-red">INACTIVE</span>}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleCoupon(c._id || c.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-slate-200)',
                        background: '#FFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ backgroundColor: '#FFF', padding: '28px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create Promotional Coupon</h2>
            <form onSubmit={handleCreateCoupon}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Coupon Code</label>
                <input type="text" required placeholder="WELCOME2026" value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)', textTransform: 'uppercase' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Type</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Amount</label>
                  <input type="number" required value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Max Redemptions</label>
                  <input type="number" required value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Expiration Date (Optional)</label>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-slate-300)' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-slate-300)', background: '#FFF' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--color-blue-600)', color: '#FFF', fontWeight: 600 }}>
                  {creating ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
