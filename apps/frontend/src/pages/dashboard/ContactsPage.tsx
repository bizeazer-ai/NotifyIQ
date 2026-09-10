import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import type { ContactContract as Contact } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('ALL');

  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addTag, setAddTag] = useState('Customer');

  // Import CSV Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: Contact[] }>('/api/contacts');
      if (response.data) {
        setContacts(response.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch contact directory from backend.');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreateContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPhone.trim()) return;

    try {
      await apiClient.post('/api/contacts', {
        name: addName,
        phone: addPhone,
        tags: [addTag],
        consentGiven: true,
      });

      setStatusMessage(`Contact "${addName}" created successfully!`);
      setShowAddModal(false);
      setAddName('');
      setAddPhone('');
      loadContacts();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      alert(`Error creating contact: ${err.message}`);
    }
  };

  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleImportCsvSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const textContent = (reader.result as string) || '';
        await apiClient.post('/api/contacts/import-csv', { csvContent: textContent });
        setStatusMessage(`Bulk CSV contact list imported successfully!`);
        setShowImportModal(false);
        setCsvFile(null);
        loadContacts();
        setTimeout(() => setStatusMessage(''), 3500);
      } catch (err: any) {
        alert(`Import failed: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const handleExportCsv = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contacts/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('notifyiq_token')}`,
          'x-workspace-id': JSON.parse(localStorage.getItem('notifyiq_workspace') || '{}').id || '',
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleDelete = async (contactId: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from contact directory?`)) return;

    try {
      await apiClient.delete(`/api/contacts/${contactId}`);
      loadContacts();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      (c.name || 'WhatsApp User').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesTag =
      activeTagFilter === 'ALL' || (c.tags && c.tags.includes(activeTagFilter));

    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Contacts Directory</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            DPDP Section 11 Compliance dashboard managing client consent, audience tags, and opt-out details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: '10px 16px', background: 'var(--accent)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Add Contact
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{ padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            style={{ padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Export CSV
          </button>
        </div>
      </header>

      {statusMessage && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '13px' }}>
          {statusMessage}
        </div>
      )}

      {/* Filter & Tag Controls */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="search-box"
          style={{ margin: 0, flex: 1, maxWidth: '360px' }}
          placeholder="Filter by name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Lead', 'Customer', 'VIP'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(tag)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid var(--border-color)',
                background: activeTagFilter === tag ? 'var(--accent)' : 'var(--bg-secondary)',
                color: activeTagFilter === tag ? 'var(--btn-text)' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Fetching contacts directory..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadContacts} title="Contacts Directory Error" />
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          title="No Contacts Found"
          description={searchQuery ? "No contact records match your current search query or active filter." : "Your contact directory is currently empty. Add individual contacts or import via CSV."}
          icon="users"
          actionLabel="+ Add First Contact"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '16px' }}>Name</th>
                <th style={{ padding: '16px' }}>WhatsApp Number</th>
                <th style={{ padding: '16px' }}>Audience Tag</th>
                <th style={{ padding: '16px' }}>Consent Status</th>
                <th style={{ padding: '16px' }}>Date Added</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{contact.name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{contact.phone}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--accent-light)' }}>
                      {(contact.tags && contact.tags[0]) || 'Customer'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: contact.consentGiven ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: contact.consentGiven ? 'var(--sentiment-positive)' : 'var(--sentiment-urgent)' }}>
                      {contact.consentGiven ? 'Consent Given' : 'No Consent'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(contact.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(contact._id, contact.name || 'WhatsApp User')}
                      style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--sentiment-urgent)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Icon name="trash" size={12} />
                      <span>Erase</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', width: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Add Single Contact</h3>
            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Audience Tag</label>
                <select
                  value={addTag}
                  onChange={(e) => setAddTag(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="Customer">Customer</option>
                  <option value="Lead">Lead</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="send-btn"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '28px', width: '460px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Bulk CSV Contact List Import</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Upload a <code>.csv</code> file containing columns: <code>Name</code>, <code>Phone</code>, <code>Tag</code>.
            </p>

            <form onSubmit={handleImportCsvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                <input
                  type="file"
                  id="contact-csv-input"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="contact-csv-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon name="attachment" style={{ fontSize: '28px', color: 'var(--accent)', marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {csvFile ? csvFile.name : 'Select CSV File'}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CSV containing Name, Phone, Tag</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importing}
                  className="send-btn"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  {importing ? 'Importing...' : 'Import Contact List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
