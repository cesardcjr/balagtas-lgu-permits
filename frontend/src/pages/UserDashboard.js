import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const PERMIT_TYPES = [
  { value: 'building_permit', label: 'Building Permit', icon: '🏗️' },
  { value: 'electrical_permit', label: 'Electrical Permit', icon: '⚡' },
  { value: 'cfei', label: 'CFEI', icon: '🔥' },
  { value: 'mechanical_permit', label: 'Mechanical Permit', icon: '⚙️' },
  { value: 'sanitary_permit', label: 'Sanitary Permit', icon: '🚿' },
  { value: 'fencing_permit', label: 'Fencing Permit', icon: '🚧' },
  { value: 'demolition_permit', label: 'Demolition Permit', icon: '🏚️' },
];

const STATUS_LABELS = {
  pending: 'Pending', under_review: 'Under Review',
  scheduled_for_inspection: 'For Inspection', for_payment: 'For Payment',
  approved: 'Approved', released: 'Released', rejected: 'Rejected', returned: 'Returned'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>
);

export default function UserDashboard() {
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/permits/my').then(r => setPermits(r.data)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: permits.length,
    pending: permits.filter(p => p.status === 'pending').length,
    approved: permits.filter(p => ['approved', 'released'].includes(p.status)).length,
    ongoing: permits.filter(p => ['under_review', 'for_payment', 'scheduled_for_inspection'].includes(p.status)).length
  };

  // Upcoming inspection
  const upcomingInspection = permits.find(p =>
    p.status === 'scheduled_for_inspection' && p.inspectionDate && new Date(p.inspectionDate) >= new Date()
  );

  const recent = permits.slice(0, 5);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome, {user?.fullName?.split(' ')[0]}! 👋</h1>
          <p>Municipality of Balagtas — Engineering Office Portal</p>
        </div>

        {/* Inspection alert */}
        {upcomingInspection && (
          <div className="alert alert-purple" style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>🔍</span>
            <div style={{ flex: 1 }}>
              <strong>Upcoming Inspection!</strong> Your application <strong>{upcomingInspection.transactionNumber}</strong> has a scheduled inspection on{' '}
              <strong>{new Date(upcomingInspection.inspectionDate).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              {upcomingInspection.inspectionTime && <> at <strong>{upcomingInspection.inspectionTime}</strong></>}.
              Please ensure property access.
              <div style={{ marginTop: 6 }}>
                <Link to={`/permits/${upcomingInspection._id}`} className="btn btn-purple btn-sm">View Details →</Link>
              </div>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon blue">📋</div>
            <div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Applications</div></div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon amber">⏳</div>
            <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending</div></div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-icon cyan">🔄</div>
            <div><div className="stat-value">{stats.ongoing}</div><div className="stat-label">In Progress</div></div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon green">✅</div>
            <div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Apply for a Permit</div>
          </div>
          <div className="permit-type-grid quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {PERMIT_TYPES.map(type => (
              <Link
                key={type.value}
                to={`/apply?type=${type.value}`}
                className="btn btn-outline"
                style={{ flexDirection: 'column', padding: '14px 10px', textAlign: 'center', gap: 6, height: 'auto' }}
              >
                <span style={{ fontSize: 22 }}>{type.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{type.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Applications</div>
            <Link to="/my-permits" className="btn btn-outline btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Applications Yet</h3>
              <p>Apply for a permit using the options above.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction #</th>
                    <th>Type</th>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(p => (
                    <tr key={p._id}>
                      <td><strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: 11 }}>{p.transactionNumber}</strong></td>
                      <td><span className={`permit-type-tag tag-${p.permitType}`}>{p.permitType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{p.propertyAddress}</td>
                      <td>
                        <StatusBadge status={p.status} />
                        {p.status === 'scheduled_for_inspection' && p.inspectionDate && (
                          <div style={{ fontSize: 10, color: '#5b21b6', marginTop: 2 }}>
                            📅 {new Date(p.inspectionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} {p.inspectionTime}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(p.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><Link to={`/permits/${p._id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="alert alert-info">
          <span>ℹ️</span>
          <div>
            <strong>Need help?</strong> Contact the Engineering Office at the Municipal Hall of Balagtas, Bulacan or send us a message through your inbox. Processing time is 5–15 working days depending on the permit type.
          </div>
        </div>
      </main>
    </div>
  );
}
