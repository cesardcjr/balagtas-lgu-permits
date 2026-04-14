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

// Status workflow with new inspection step
const STATUS_TRANSITIONS = {
  pending: ['under_review', 'returned', 'rejected'],
  under_review: ['scheduled_for_inspection', 'for_payment', 'returned', 'rejected'],
  scheduled_for_inspection: ['for_payment', 'returned', 'rejected'],
  for_payment: ['approved', 'returned'],
  approved: ['released'],
  returned: ['under_review'],
  rejected: [],
  released: []
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
  <span className={`status-badge status-${status}`} style={{ fontSize: 12, padding: '4px 12px' }}>
    {STATUS_LABELS[status] || status}
  </span>
);

export default function AdminPermitDetail() {
  const { id } = useParams();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({
    status: '', note: '', assessedFee: '', orNumber: '', amountPaid: '',
    permitNumber: '', rejectionReason: '',
    inspectionDate: '', inspectionTime: '', inspectionNotes: '', inspectionTeam: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    axios.get(`/api/permits/${id}`).then(r => {
      setPermit(r.data);
      setStatusForm(f => ({ ...f, status: r.data.status }));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async () => {
    if (!statusForm.status || statusForm.status === permit.status) return;
    setUpdating(true);
    try {
      await axios.patch(`/api/permits/${id}/status`, statusForm);
      toast.success('Status updated successfully');
      load();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!permit?.applicant?._id) return toast.error('Applicant not found');
    setSending(true);
    try {
      await axios.post('/api/messages', {
        recipientId: permit.applicant._id,
        subject: msgForm.subject,
        body: msgForm.body,
        permitId: id
      });
      toast.success('Message sent to applicant');
      setShowMsg(false);
      setMsgForm({ subject: '', body: '' });
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div></main>
    </div>
  );
  if (!permit) return (
    <div className="layout"><Sidebar />
      <main className="main-content"><div className="alert alert-danger">Permit not found.</div></main>
    </div>
  );

  const nextStatuses = STATUS_TRANSITIONS[permit.status] || [];

  const sections = [
    {
      title: 'Applicant Information',
      items: [
        ['Full Name', permit.applicantName], ['Contact Number', permit.contactNumber],
        ['Email', permit.email], ['Address', permit.applicantAddress],
      ]
    },
    {
      title: 'Property Details',
      items: [
        ['Property Address', permit.propertyAddress], ['Barangay', permit.barangay],
        ['Municipality', permit.municipality || 'Balagtas'], ['Province', permit.province || 'Bulacan'],
        ['Lot Number', permit.lotNumber], ['Block Number', permit.blockNumber],
        ['TCT/OCT No.', permit.tctNumber], ['Tax Dec. No.', permit.taxDeclarationNumber],
        ['GPS Coordinates', permit.latitude ? `${permit.latitude.toFixed(6)}, ${permit.longitude.toFixed(6)}` : null],
      ]
    },
    {
      title: 'Construction Details',
      items: [
        ['Scope of Work', permit.scopeOfWork], ['Use/Occupancy', permit.useOrCharacterOfOccupancy],
        ['Project Cost', permit.projectCost ? `₱${Number(permit.projectCost).toLocaleString()}` : null],
        ['Floor Area', permit.floorArea ? `${permit.floorArea} sq.m` : null],
        ['Lot Area', permit.lotArea ? `${permit.lotArea} sq.m` : null],
        ['No. of Storeys', permit.numberOfStoreys], ['Building Height', permit.buildingHeight ? `${permit.buildingHeight} m` : null],
      ]
    },
    {
      title: 'Design Professional',
      items: [
        ['Architect/Engineer', permit.architectEngineerName], ['PRC License No.', permit.architectEngineerLicenseNo],
        ['PTR No.', permit.architectEngineerPrcNo], ['Contact', permit.architectEngineerContact],
        ['Electrical Engineer', permit.electricalEngineerName], ['EE License No.', permit.electricalEngineerLicenseNo],
        ['Sanitary Engineer', permit.sanitaryEngineerName], ['Mechanical Engineer', permit.mechanicalEngineerName],
      ]
    },
  ];

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="breadcrumb"><Link to="/admin/permits" style={{ color: 'var(--primary)' }}>← All Applications</Link> / <span>{permit.transactionNumber}</span></div>
          <div className="page-header-row">
            <div>
              <h1>{PERMIT_LABELS[permit.permitType]}</h1>
              <p style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{permit.transactionNumber}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => generatePermitPDF(permit)}>🖨️ Print PDF</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMsg(true)}>✉️ Message Applicant</button>
            </div>
          </div>
        </div>

        <div className="admin-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
          {/* LEFT: Application details */}
          <div>
            {/* Status banner */}
            <div className="card" style={{ borderLeft: `4px solid var(--primary)`, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Current Status</div>
                  <StatusBadge status={permit.status} />
                  {permit.rejectionReason && <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 12 }}>Reason: {permit.rejectionReason}</div>}
                </div>
                {/* Inspection info */}
                {permit.status === 'scheduled_for_inspection' && permit.inspectionDate && (
                  <div className="inspection-card" style={{ flex: 1, minWidth: 200 }}>
                    <div className="label">🔍 Scheduled Inspection</div>
                    <div className="datetime">
                      {new Date(permit.inspectionDate).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {permit.inspectionTime && ` at ${permit.inspectionTime}`}
                    </div>
                    {permit.inspectionTeam && <div className="sub">Team: {permit.inspectionTeam}</div>}
                    {permit.inspectionNotes && <div className="sub" style={{ marginTop: 4 }}>{permit.inspectionNotes}</div>}
                  </div>
                )}
                {permit.assessedFee && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Assessed Fee</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#854d0e' }}>₱{Number(permit.assessedFee).toLocaleString()}</div>
                    {permit.amountPaid && <div style={{ fontSize: 11, color: 'var(--success)' }}>Paid: ₱{Number(permit.amountPaid).toLocaleString()} · OR#{permit.orNumber}</div>}
                  </div>
                )}
                {permit.permitNumber && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Permit Number</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{permit.permitNumber}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Detail sections */}
            {sections.map(section => (
              <div className="card" key={section.title} style={{ marginBottom: 18 }}>
                <div className="card-title" style={{ marginBottom: 14 }}>{section.title}</div>
                <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {section.items.filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} style={{ padding: '7px 0', borderBottom: '1px solid #f0f4f8' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Attachments */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>Submitted Documents ({permit.attachments?.length || 0})</div>
              {!permit.attachments?.length ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No documents attached</div>
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

          {/* RIGHT: Process panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Update Status */}
            {nextStatuses.length > 0 && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>Process Application</div>

                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select className="form-control" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                    <option value={permit.status}>{STATUS_LABELS[permit.status]} (current)</option>
                    {nextStatuses.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Note</label>
                  <textarea className="form-control" rows={2} value={statusForm.note} onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional remarks..." style={{ resize: 'vertical' }} />
                </div>

                {/* Inspection fields */}
                {statusForm.status === 'scheduled_for_inspection' && (
                  <div style={{ background: '#ede9fe', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#5b21b6', marginBottom: 10 }}>🔍 Inspection Schedule</div>
                    <div className="form-group">
                      <label className="form-label">Inspection Date <span>*</span></label>
                      <input type="date" className="form-control" value={statusForm.inspectionDate} onChange={e => setStatusForm(f => ({ ...f, inspectionDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Inspection Time <span>*</span></label>
                      <input type="time" className="form-control" value={statusForm.inspectionTime} onChange={e => setStatusForm(f => ({ ...f, inspectionTime: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Inspection Team</label>
                      <input className="form-control" value={statusForm.inspectionTeam} onChange={e => setStatusForm(f => ({ ...f, inspectionTeam: e.target.value }))} placeholder="e.g., Engr. Santos & Team" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Notes for Inspection Team</label>
                      <textarea className="form-control" rows={2} value={statusForm.inspectionNotes} onChange={e => setStatusForm(f => ({ ...f, inspectionNotes: e.target.value }))} placeholder="Special instructions..." style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {statusForm.status === 'for_payment' && (
                  <div className="form-group">
                    <label className="form-label">Assessed Fee (PHP) <span>*</span></label>
                    <input type="number" className="form-control" value={statusForm.assessedFee} onChange={e => setStatusForm(f => ({ ...f, assessedFee: e.target.value }))} placeholder="0.00" />
                  </div>
                )}

                {statusForm.status === 'approved' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">OR Number</label>
                      <input className="form-control" value={statusForm.orNumber} onChange={e => setStatusForm(f => ({ ...f, orNumber: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount Paid (PHP)</label>
                      <input type="number" className="form-control" value={statusForm.amountPaid} onChange={e => setStatusForm(f => ({ ...f, amountPaid: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Permit Number</label>
                      <input className="form-control" value={statusForm.permitNumber} onChange={e => setStatusForm(f => ({ ...f, permitNumber: e.target.value }))} placeholder="e.g., 2024-BP-001" />
                    </div>
                  </>
                )}

                {statusForm.status === 'rejected' && (
                  <div className="form-group">
                    <label className="form-label">Rejection Reason <span>*</span></label>
                    <textarea className="form-control" rows={3} value={statusForm.rejectionReason} onChange={e => setStatusForm(f => ({ ...f, rejectionReason: e.target.value }))} placeholder="State the reason..." style={{ resize: 'vertical' }} />
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={updateStatus}
                  disabled={updating || statusForm.status === permit.status}
                >
                  {updating ? '⏳ Updating...' : '✅ Update Status'}
                </button>
              </div>
            )}

            {/* Current inspection info if already scheduled */}
            {permit.status === 'scheduled_for_inspection' && permit.inspectionDate && (
              <div className="card" style={{ padding: 14 }}>
                <div className="inspection-card">
                  <div className="label">📅 Inspection Scheduled</div>
                  <div className="datetime">
                    {new Date(permit.inspectionDate).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  {permit.inspectionTime && <div className="sub">⏰ {permit.inspectionTime}</div>}
                  {permit.inspectionTeam && <div className="sub">👥 {permit.inspectionTeam}</div>}
                  {permit.inspectionNotes && <div className="sub" style={{ marginTop: 4, fontStyle: 'italic' }}>"{permit.inspectionNotes}"</div>}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Status History</div>
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
          </div>
        </div>

        {/* Message Modal */}
        {showMsg && (
          <div className="compose-modal-overlay" onClick={() => setShowMsg(false)}>
            <div className="compose-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>✉️ Message Applicant</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowMsg(false)}>✕</button>
              </div>
              <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
                To: <strong>{permit.applicantName}</strong> — Re: {permit.transactionNumber}
              </div>
              <form onSubmit={sendMessage}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-control" value={msgForm.subject} onChange={e => setMsgForm(f => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows={6} value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))} required style={{ resize: 'vertical' }}
                    placeholder={`Dear ${permit.applicantName},\n\nRegarding your application ${permit.transactionNumber}...\n\nRegards,\nEngineering Office\nMunicipality of Balagtas`}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowMsg(false)}>Cancel</button>
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
