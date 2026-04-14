import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const PERMIT_LABELS = {
  building_permit: 'Building Permit', electrical_permit: 'Electrical Permit',
  cfei: 'CFEI', mechanical_permit: 'Mechanical Permit',
  sanitary_permit: 'Sanitary Permit', fencing_permit: 'Fencing Permit', demolition_permit: 'Demolition Permit'
};

const STATUS_LABELS = {
  pending: 'Pending', under_review: 'Under Review',
  scheduled_for_inspection: 'Scheduled for Inspection',
  for_payment: 'For Payment', approved: 'Approved',
  released: 'Released', rejected: 'Rejected', returned: 'Returned'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>
);

export default function MyPermits() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/permits/my').then(r => setPermits(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = permits.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = !search ||
      p.transactionNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.propertyAddress || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="breadcrumb">Dashboard / <span>My Applications</span></div>
          <div className="page-header-row">
            <div>
              <h1>📋 My Applications</h1>
              <p>Track the status of all your permit applications</p>
            </div>
            <Link to="/apply" className="btn btn-primary btn-sm">+ New Application</Link>
          </div>
        </div>

        <div className="card">
          <div className="filter-bar">
            <input
              className="form-control"
              placeholder="🔍 Search by transaction # or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-control" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="scheduled_for_inspection">For Inspection</option>
              <option value="for_payment">For Payment</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
              <option value="returned">Returned</option>
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} result(s)</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Applications Found</h3>
              <p>{permits.length === 0 ? 'You have not submitted any permit applications yet.' : 'No results match your filter.'}</p>
              {permits.length === 0 && <Link to="/apply" className="btn btn-primary" style={{ marginTop: 16 }}>Apply Now</Link>}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction #</th>
                    <th>Permit Type</th>
                    <th>Property Address</th>
                    <th>Date Filed</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id}>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: 11 }}>{p.transactionNumber}</strong>
                      </td>
                      <td><span className={`permit-type-tag tag-${p.permitType}`}>{PERMIT_LABELS[p.permitType]}</span></td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{p.propertyAddress}</div>
                        {p.barangay && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Brgy. {p.barangay}</div>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                        {p.status === 'scheduled_for_inspection' && p.inspectionDate && (
                          <div style={{ fontSize: 10, color: '#5b21b6', marginTop: 3, fontWeight: 600 }}>
                            📅 {new Date(p.inspectionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {p.inspectionTime && ` · ${p.inspectionTime}`}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {p.assessedFee
                          ? <span style={{ color: '#854d0e', fontWeight: 600 }}>₱{Number(p.assessedFee).toLocaleString()}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <Link to={`/permits/${p._id}`} className="btn btn-outline btn-sm">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status Guide</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              ['pending', 'Waiting for initial review by the Engineering Office'],
              ['under_review', 'Being evaluated; plans and documents under assessment'],
              ['scheduled_for_inspection', 'Inspection of property scheduled — check your permit details'],
              ['for_payment', 'Fees assessed; please proceed to payment at the Municipal Treasury'],
              ['approved', 'Permit approved — ready to be released'],
              ['released', 'Permit issued and released to applicant'],
              ['rejected', 'Application rejected — see reason in permit details'],
              ['returned', 'Documents returned for correction or completion'],
            ].map(([s, desc]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 260, flex: '1 1 260px' }}>
                <StatusBadge status={s} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 1 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
