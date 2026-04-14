import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import { generatePermitPDF } from '../utils/pdfGenerator';

const PERMIT_LABELS = {
  building_permit: 'Building Permit', electrical_permit: 'Electrical Permit',
  cfei: 'CFEI', mechanical_permit: 'Mechanical Permit',
  sanitary_permit: 'Sanitary Permit', fencing_permit: 'Fencing Permit', demolition_permit: 'Demolition Permit'
};

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  scheduled_for_inspection: 'Scheduled for Inspection',
  for_payment: 'For Payment',
  approved: 'Approved',
  released: 'Released',
  rejected: 'Rejected',
  returned: 'Returned'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`} style={{ fontSize: 13, padding: '5px 14px' }}>
    {STATUS_LABELS[status] || status}
  </span>
);

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f4f8' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
};

export default function PermitDetail() {
  const { id } = useParams();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios.get(`/api/permits/${id}`).then(r => setPermit(r.data)).finally(() => setLoading(false));
    axios.get('/api/messages/admin-contact').then(r => setAdmin(r.data)).catch(() => {});
  }, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!admin) return toast.error('Admin contact not found');
    setSending(true);
    try {
      await axios.post('/api/messages', {
        recipientId: admin._id,
        subject: msgForm.subject,
        body: msgForm.body,
        permitId: id
      });
      toast.success('Message sent to Engineering Office');
      setShowCompose(false);
      setMsgForm({ subject: '', body: '' });
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div></main>
    </div>
  );
  if (!permit) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="alert alert-danger">Permit not found.</div></main>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="breadcrumb"><Link to="/my-permits" style={{ color: 'var(--primary)' }}>← My Applications</Link> / <span>{permit.transactionNumber}</span></div>
          <div className="page-header-row">
            <div>
              <h1>Application Details</h1>
              <p style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--primary)', fontWeight: 700 }}>{permit.transactionNumber}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => generatePermitPDF(permit)}>📄 Download PDF</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>✉️ Message Office</button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Current Status</div>
              <StatusBadge status={permit.status} />
              {permit.rejectionReason && (
                <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 13, background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}>
                  ❌ Reason: {permit.rejectionReason}
                </div>
              )}
            </div>
            {permit.assessedFee && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Assessed Fee</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#854d0e' }}>₱{Number(permit.assessedFee).toLocaleString()}</div>
                {permit.amountPaid && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>✅ Paid: ₱{Number(permit.amountPaid).toLocaleString()} · OR#{permit.orNumber}</div>}
              </div>
            )}
            {permit.permitNumber && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Permit No.</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{permit.permitNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Inspection Schedule Alert */}
        {permit.status === 'scheduled_for_inspection' && permit.inspectionDate && (
          <div className="alert alert-purple" style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 20 }}>🔍</span>
            <div>
              <strong>Inspection Scheduled!</strong>
              <div style={{ marginTop: 4 }}>
                <strong>Date:</strong> {new Date(permit.inspectionDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {permit.inspectionTime && <> at <strong>{permit.inspectionTime}</strong></>}
              </div>
              {permit.inspectionTeam && <div><strong>Inspection Team:</strong> {permit.inspectionTeam}</div>}
              {permit.inspectionNotes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{permit.inspectionNotes}</div>}
              <div style={{ marginTop: 6, fontSize: 12 }}>Please ensure the property is accessible on the scheduled date and time.</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
          {/* Main details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {/* Applicant & Property */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Applicant Information</div>
              <InfoRow label="Full Name" value={permit.applicantName} />
              <InfoRow label="Contact Number" value={permit.contactNumber} />
              <InfoRow label="Email" value={permit.email} />
              <InfoRow label="Address" value={permit.applicantAddress} />
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Property Details</div>
              <InfoRow label="Property Address" value={permit.propertyAddress} />
              <InfoRow label="Barangay" value={permit.barangay} />
              <InfoRow label="Municipality / Province" value={`${permit.municipality || 'Balagtas'}, ${permit.province || 'Bulacan'}`} />
              <InfoRow label="Lot Number" value={permit.lotNumber} />
              <InfoRow label="TCT / OCT No." value={permit.tctNumber} />
              <InfoRow label="Tax Declaration No." value={permit.taxDeclarationNumber} />
              {permit.latitude && <InfoRow label="GPS Coordinates" value={`${parseFloat(permit.latitude).toFixed(6)}, ${parseFloat(permit.longitude).toFixed(6)}`} />}
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Construction Details</div>
              <InfoRow label="Scope of Work" value={permit.scopeOfWork} />
              <InfoRow label="Use / Occupancy" value={permit.useOrCharacterOfOccupancy} />
              <InfoRow label="Project Cost" value={permit.projectCost ? `₱${Number(permit.projectCost).toLocaleString()}` : null} />
              <InfoRow label="Floor Area" value={permit.floorArea ? `${permit.floorArea} sq.m` : null} />
              <InfoRow label="Number of Storeys" value={permit.numberOfStoreys} />
              <InfoRow label="Building Height" value={permit.buildingHeight ? `${permit.buildingHeight} m` : null} />
              <InfoRow label="Architect / Engineer" value={permit.architectEngineerName} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {/* Timeline */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Status Timeline</div>
              <div className="timeline">
                {[...permit.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${i === 0 ? 'latest' : h.status === 'scheduled_for_inspection' ? 'inspection' : ''}`} />
                    <div className="timeline-content">
                      <div className="timeline-status">{STATUS_LABELS[h.status] || h.status}</div>
                      {h.note && <div className="timeline-note">{h.note}</div>}
                      <div className="timeline-date">{new Date(h.changedAt).toLocaleString('en-PH')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>Attached Documents ({permit.attachments?.length || 0})</div>
              {!permit.attachments?.length ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No files attached</div>
              ) : (
                <div className="file-list">
                  {permit.attachments.map((att, i) => (
                    <div key={i} className="file-item">
                      <div className="file-item-name">
                        <span>{att.mimetype?.includes('pdf') ? '📄' : att.mimetype?.includes('image') ? '🖼️' : '📎'}</span>
                        <span>{att.originalName}</span>
                      </div>
                      <a href={`/uploads/${att.filename}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View ↗</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="compose-modal-overlay" onClick={() => setShowCompose(false)}>
            <div className="compose-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>✉️ Message Engineering Office</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCompose(false)}>✕</button>
              </div>
              <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                Re: {permit.transactionNumber} — {PERMIT_LABELS[permit.permitType]}
              </div>
              <form onSubmit={sendMessage}>
                <div className="form-group">
                  <label className="form-label">Subject <span>*</span></label>
                  <input className="form-control" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))} required placeholder="e.g., Follow-up on application status" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message <span>*</span></label>
                  <textarea className="form-control" rows={6} value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))} required style={{ resize: 'vertical' }} placeholder="Type your message here..." />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCompose(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? '⏳ Sending...' : '📤 Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
