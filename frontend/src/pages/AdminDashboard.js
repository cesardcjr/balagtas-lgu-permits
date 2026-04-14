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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/permits/stats/summary'),
      axios.get('/api/permits/all')
    ]).then(([s, p]) => {
      setStats(s.data);
      setRecent(p.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📊 Admin Dashboard</h1>
          <p>Municipality of Balagtas — Engineering Office | {today}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-icon blue">📋</div>
                <div>
                  <div className="stat-value">{stats?.total || 0}</div>
                  <div className="stat-label">Total Applications</div>
                </div>
              </div>
              <div className="stat-card amber">
                <div className="stat-icon amber">⏳</div>
                <div>
                  <div className="stat-value">{stats?.pending || 0}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
              </div>
              <div className="stat-card cyan">
                <div className="stat-icon cyan">🔍</div>
                <div>
                  <div className="stat-value">{stats?.under_review || 0}</div>
                  <div className="stat-label">Under Review</div>
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon purple">📅</div>
                <div>
                  <div className="stat-value">{stats?.scheduled || 0}</div>
                  <div className="stat-label">For Inspection</div>
                </div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon green">✅</div>
                <div>
                  <div className="stat-value">{stats?.approved || 0}</div>
                  <div className="stat-label">Approved</div>
                </div>
              </div>
              <div className="stat-card blue">
                <div className="stat-icon blue">📤</div>
                <div>
                  <div className="stat-value">{stats?.released || 0}</div>
                  <div className="stat-label">Released</div>
                </div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon red">❌</div>
                <div>
                  <div className="stat-value">{stats?.rejected || 0}</div>
                  <div className="stat-label">Rejected</div>
                </div>
              </div>
              <div className="stat-card green" style={{ gridColumn: 'span 1' }}>
                <div className="stat-icon green">💰</div>
                <div>
                  <div className="stat-value" style={{ fontSize: 18 }}>₱{Number(stats?.revenue || 0).toLocaleString()}</div>
                  <div className="stat-label">Revenue Collected</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {/* Recent Applications */}
              <div className="card" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <div className="card-header">
                  <div className="card-title">Recent Applications</div>
                  <Link to="/admin/permits" className="btn btn-outline btn-sm">View All →</Link>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Transaction #</th>
                        <th>Applicant</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map(p => (
                        <tr key={p._id}>
                          <td><strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: 11 }}>{p.transactionNumber}</strong></td>
                          <td style={{ fontSize: 12 }}>{p.applicantName}</td>
                          <td><span className={`permit-type-tag tag-${p.permitType}`} style={{ fontSize: 9 }}>{PERMIT_LABELS[p.permitType]}</span></td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                          <td><StatusBadge status={p.status} /></td>
                          <td><Link to={`/admin/permits/${p._id}`} className="btn btn-ghost btn-sm">→</Link></td>
                        </tr>
                      ))}
                      {recent.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No applications yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Type */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>Applications by Type</div>
                {stats?.byType?.length ? stats.byType.map(t => {
                  const pct = stats.total > 0 ? Math.round((t.count / stats.total) * 100) : 0;
                  return (
                    <div key={t._id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{PERMIT_LABELS[t._id] || t._id}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{t.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>No data yet</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/admin/permits?status=pending" className="btn btn-outline btn-sm">⏳ Pending ({stats?.pending || 0})</Link>
                <Link to="/admin/permits?status=under_review" className="btn btn-outline btn-sm">🔍 Under Review</Link>
                <Link to="/admin/permits?status=scheduled_for_inspection" className="btn btn-purple btn-sm">📅 For Inspection ({stats?.scheduled || 0})</Link>
                <Link to="/admin/permits?status=for_payment" className="btn btn-outline btn-sm">💳 For Payment</Link>
                <Link to="/admin/permits?status=approved" className="btn btn-success btn-sm">✅ Approved / Release</Link>
                <Link to="/admin/inbox" className="btn btn-primary btn-sm">✉️ Inbox</Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
