import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Sidebar from '../components/Sidebar';

const PERMIT_LABELS = {
  building_permit: 'Building Permit', electrical_permit: 'Electrical Permit',
  cfei: 'CFEI', mechanical_permit: 'Mechanical Permit',
  sanitary_permit: 'Sanitary Permit', fencing_permit: 'Fencing Permit', demolition_permit: 'Demolition Permit'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>{status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
);

const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

function LocationModal({ permit, onClose }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY, id: 'google-map-script' });
  const pos = { lat: parseFloat(permit.latitude), lng: parseFloat(permit.longitude) };

  return (
    <div className="compose-modal-overlay" onClick={onClose}>
      <div className="location-modal" onClick={e => e.stopPropagation()}>
        <div className="location-modal-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>📍 Property Location</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {permit.propertyAddress}{permit.barangay ? `, Brgy. ${permit.barangay}` : ''}, Balagtas, Bulacan
            </div>
            <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2, fontFamily: 'monospace' }}>
              {permit.latitude?.toFixed(6)}, {permit.longitude?.toFixed(6)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div style={{ height: 420 }}>
          {!MAPS_API_KEY ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Google Maps not configured</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add REACT_APP_GOOGLE_MAPS_API_KEY to .env</div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
                Lat: {permit.latitude?.toFixed(6)}<br/>
                Lng: {permit.longitude?.toFixed(6)}
              </div>
              <a
                href={`https://www.google.com/maps?q=${permit.latitude},${permit.longitude}`}
                target="_blank" rel="noreferrer"
                className="btn btn-primary" style={{ marginTop: 12 }}
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          ) : !isLoaded ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="spinner" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={pos}
              zoom={17}
              options={{ streetViewControl: true, mapTypeControl: true, fullscreenControl: true }}
            >
              <Marker position={pos} title={permit.applicantName} />
            </GoogleMap>
          )}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <a href={`https://www.google.com/maps?q=${permit.latitude},${permit.longitude}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            🗺️ Open in Google Maps
          </a>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPermits() {
  const [searchParams] = useSearchParams();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [locationPermit, setLocationPermit] = useState(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    axios.get(`/api/permits/all?${params}`).then(r => setPermits(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, type]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📋 All Applications</h1>
          <p>Manage and process all permit applications</p>
        </div>

        <div className="card">
          <form onSubmit={handleSearch} className="filter-bar">
            <input
              className="form-control"
              placeholder="🔍 Search by transaction # or applicant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="scheduled_for_inspection">Scheduled for Inspection</option>
              <option value="for_payment">For Payment</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
              <option value="returned">Returned</option>
            </select>
            <select className="form-control" value={type} onChange={e => setType(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Types</option>
              {Object.entries(PERMIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{permits.length} result(s)</span>
          </form>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : permits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Applications Found</h3>
              <p>No applications match the current filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Transaction #</th>
                    <th>Applicant</th>
                    <th>Type</th>
                    <th>Property</th>
                    <th>Coordinates</th>
                    <th>Date Filed</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map(p => (
                    <tr key={p._id}>
                      <td>
                        <strong style={{ color: '#1e4e78', fontFamily: 'monospace', fontSize: 11 }}>{p.transactionNumber}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{p.applicantName}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.contactNumber}</div>
                      </td>
                      <td><span className={`permit-type-tag tag-${p.permitType}`}>{PERMIT_LABELS[p.permitType]}</span></td>
                      <td style={{ maxWidth: 160 }}>
                        <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.propertyAddress}</div>
                        {p.barangay && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Brgy. {p.barangay}</div>}
                      </td>
                      <td>
                        {p.latitude && p.longitude ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setLocationPermit(p)}
                            style={{ fontSize: 10, padding: '4px 8px', color: '#1e4e78', borderColor: '#1e4e78' }}
                          >
                            📍 View Location
                          </button>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                        {p.status === 'scheduled_for_inspection' && p.inspectionDate && (
                          <div style={{ fontSize: 10, color: '#5b21b6', marginTop: 3 }}>
                            🔍 {new Date(p.inspectionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} {p.inspectionTime}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {p.assessedFee ? <span style={{ fontWeight: 600, color: '#854d0e' }}>₱{Number(p.assessedFee).toLocaleString()}</span> : '—'}
                      </td>
                      <td>
                        <Link to={`/admin/permits/${p._id}`} className="btn btn-primary btn-sm">Process →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Location Modal */}
        {locationPermit && (
          <LocationModal permit={locationPermit} onClose={() => setLocationPermit(null)} />
        )}
      </main>
    </div>
  );
}
