import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api/apiClient';
import { Icon } from '../../../components/ui/Icon';

interface LeadData {
  _id: string;
  workspaceId: string;
  contactId: string;
  contactPhone: string;
  name: string | null;
  email: string | null;
  category: string;
  budget: string | null;
  productInterest: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  rawNotes: string | null;
  confidence: number;
}

interface LeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contactPhone: string;
  contactName: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New Lead', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
  { value: 'contacted', label: 'Contacted', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'qualified', label: 'Qualified', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'converted', label: 'Converted', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  { value: 'lost', label: 'Lost', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const PRESET_CATEGORIES = [
  'General',
  'Wholesale',
  'Retail',
  'Puja Items',
  'Jewelry',
  'Enterprise',
  'Support',
];

export default function LeadDrawer({
  isOpen,
  onClose,
  contactPhone,
  contactName,
}: LeadDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<LeadData | null>(null);

  // Form states
  const [status, setStatus] = useState<LeadData['status']>('new');
  const [category, setCategory] = useState('General');
  const [budget, setBudget] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Fetch lead data when opened
  useEffect(() => {
    if (!isOpen || !contactPhone) return;

    let mounted = true;
    setLoading(true);
    setFeedbackMsg('');

    apiClient
      .get<{ data: LeadData }>(`/api/contacts/leads/by-phone/${encodeURIComponent(contactPhone)}`)
      .then((res) => {
        if (!mounted) return;
        if (res.data) {
          setLead(res.data);
          setStatus(res.data.status || 'new');
          setCategory(res.data.category || 'General');
          setBudget(res.data.budget || '');
          setProductInterest(res.data.productInterest || '');
          setEmail(res.data.email || '');
          setNotes(res.data.rawNotes || '');
        } else {
          setLead(null);
          setStatus('new');
          setCategory('General');
          setBudget('');
          setProductInterest('');
          setEmail('');
          setNotes('');
        }
      })
      .catch(() => {
        if (mounted) setLead(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, contactPhone]);

  const handleSave = async () => {
    if (!lead?._id) return;
    setSaving(true);
    setFeedbackMsg('');

    try {
      const res = await apiClient.patch<{ data: LeadData }>(`/api/contacts/leads/${lead._id}`, {
        status,
        category,
        budget,
        productInterest,
        rawNotes: notes,
      });
      if (res.data) {
        setLead(res.data);
        setFeedbackMsg('Lead details saved successfully!');
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err: any) {
      setFeedbackMsg('Failed to update lead: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.25)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                color: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="sparkles" size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                Lead CRM & Intelligence
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-foreground-secondary)' }}>
                Auto-extracted business intent & qualifications
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Contact summary card */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-surface-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-foreground)' }}>
                {contactName || 'Unnamed Contact'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-foreground-secondary)', marginTop: '2px' }}>
                {contactPhone}
              </div>
            </div>
            {lead?.confidence !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                {Math.round(lead.confidence * 100)}% Match
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-foreground-secondary)' }}>
              <Icon name="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: '8px', fontSize: '13px' }}>Loading lead profile...</div>
            </div>
          ) : (
            <>
              {/* Qualification Status */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Lead Qualification Status
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? opt.bg : 'var(--color-surface)',
                          color: isSelected ? opt.color : 'var(--color-foreground-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category / Sector Tag */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Business Category
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        border: '1px solid var(--color-border)',
                        backgroundColor: category === cat ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                        color: category === cat ? 'var(--color-primary)' : 'var(--color-foreground-secondary)',
                        fontWeight: category === cat ? 700 : 500,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-input-styled"
                  style={{ width: '100%', fontSize: '13px' }}
                  placeholder="Or custom category name..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              {/* Product / Service Interest */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Product / Service Interest
                </label>
                <input
                  type="text"
                  className="form-input-styled"
                  style={{ width: '100%', fontSize: '13px' }}
                  placeholder="e.g. Bulk Brass Diya, Whitelabel Reseller..."
                  value={productInterest}
                  onChange={(e) => setProductInterest(e.target.value)}
                />
              </div>

              {/* Budget / Deal Size */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Budget / Expected Deal Size
                </label>
                <input
                  type="text"
                  className="form-input-styled"
                  style={{ width: '100%', fontSize: '13px' }}
                  placeholder="e.g. ₹50,000 / $1,000 / month"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              {/* Extracted Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  className="form-input-styled"
                  style={{ width: '100%', fontSize: '13px' }}
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Extraction / Agent Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-foreground)' }}>
                  Intelligence Notes & Intent Summary
                </label>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%', minHeight: '90px', fontSize: '12px' }}
                  placeholder="Extracted user context, notes, or specific requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {feedbackMsg && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'center',
                    backgroundColor: feedbackMsg.includes('Failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: feedbackMsg.includes('Failed') ? '#ef4444' : '#10b981',
                  }}
                >
                  {feedbackMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, padding: '10px' }}
                  onClick={handleSave}
                  disabled={saving || !lead?._id}
                >
                  <Icon name="check" size={14} />
                  <span>{saving ? 'Saving...' : 'Save Lead'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
