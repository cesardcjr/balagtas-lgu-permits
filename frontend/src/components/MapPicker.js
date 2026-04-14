import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

// Default center: Balagtas, Bulacan
const DEFAULT_CENTER = { lat: 14.8140, lng: 120.9065 };
const MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

export default function MapPicker({ lat, lng, onChange }) {
  const [marker, setMarker] = useState(lat && lng ? { lat, lng } : null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    id: 'google-map-script'
  });

  const handleClick = useCallback((e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(pos);
    onChange(pos.lat, pos.lng);
  }, [onChange]);

  const onLoad = useCallback((map) => { mapRef.current = map; }, []);

  if (!MAPS_API_KEY) {
    return (
      <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: 20, background: '#f8fafc', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Google Maps not configured</p>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Add REACT_APP_GOOGLE_MAPS_API_KEY to .env</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Latitude</label>
            <input
              type="number" step="any" className="form-control"
              placeholder="14.8140"
              value={lat || ''}
              onChange={e => onChange(parseFloat(e.target.value), lng)}
              style={{ width: 130 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Longitude</label>
            <input
              type="number" step="any" className="form-control"
              placeholder="120.9065"
              value={lng || ''}
              onChange={e => onChange(lat, parseFloat(e.target.value))}
              style={{ width: 130 }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) return <div className="alert alert-danger">Failed to load Google Maps</div>;
  if (!isLoaded) return <div style={{ height: 300, background: '#f0f4f8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>;

  return (
    <div>
      <div className="map-container" style={{ height: 300 }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={marker || DEFAULT_CENTER}
          zoom={15}
          onLoad={onLoad}
          onClick={handleClick}
          options={{ streetViewControl: false, mapTypeControl: true, fullscreenControl: true }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>
      {marker ? (
        <div className="map-coords">
          📍 <strong>Selected:</strong> {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        </div>
      ) : (
        <div className="map-coords">👆 Click on the map to pin the exact property location</div>
      )}
    </div>
  );
}
