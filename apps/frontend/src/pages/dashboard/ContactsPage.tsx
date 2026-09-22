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
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Contacts Directory</h1>
          <p className="page-subtitle">
            DPDP Section 11 Compliance dashboard managing client consent, audience tags, and opt-out details.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} />
            <span>Add Contact</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Icon name="attachment" size={14} />
            <span>Import CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportCsv}>
            <Icon name="download" size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className="status-message status-message-success">{statusMessage}</div>
      )}

      {/* Filter & Tag Controls */}
      <div style={{
        marginBottom: 'var(--space-6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          className="form-input-styled"
          style={{ flex: 1, maxWidth: '360px' }}
          placeholder="Filter by name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['ALL', 'Lead', 'Customer', 'VIP'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(tag)}
              className={`filter-pill ${activeTagFilter === tag ? 'active' : ''}`}
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
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>WhatsApp Number</th>
                  <th>Audience Tag</th>
                  <th>Consent Status</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact._id}>
                    <td style={{ fontWeight: 600 }}>{contact.name}</td>
                    <td className="text-secondary">{contact.phone}</td>
                    <td>
                      <span className="badge badge-primary">
                        {(contact.tags && contact.tags[0]) || 'Customer'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${contact.consentGiven ? 'badge-success' : 'badge-error'}`}>
                        {contact.consentGiven ? 'Consent Given' : 'No Consent'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(contact.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(contact._id, contact.name || 'WhatsApp User')}
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
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Add Single Contact</h3>
            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label-styled">Full Name</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="e.g. Rahul Sharma"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label-styled">WhatsApp Number</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="+919876543210"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label-styled">Audience Tag</label>
                <select
                  className="form-select"
                  value={addTag}
                  onChange={(e) => setAddTag(e.target.value)}
                >
                  <option value="Customer">Customer</option>
                  <option value="Lead">Lead</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <h3 className="modal-title">Bulk CSV Contact List Import</h3>
            <p className="text-secondary" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
              Upload a <code>.csv</code> file containing columns: <code>Name</code>, <code>Phone</code>, <code>Tag</code>.
            </p>

            <form onSubmit={handleImportCsvSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-secondary)',
                transition: 'border-color var(--transition-fast)',
              }}>
                <input
                  type="file"
                  id="contact-csv-input"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="contact-csv-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <Icon name="attachment" style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }} />
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-foreground)' }}>
                    {csvFile ? csvFile.name : 'Select CSV File'}
                  </div>
                  <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>CSV containing Name, Phone, Tag</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!csvFile || importing}>
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
