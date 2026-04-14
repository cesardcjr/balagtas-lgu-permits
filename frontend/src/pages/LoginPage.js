import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Balagtas<br/>e-Permit<br/>System</h1>
        <p>Apply for building permits, electrical permits, and more — online, anytime. Powered by the Municipality of Balagtas, Engineering Office.</p>
        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['🏗️ Building Permits', '⚡ Electrical Permits', '🔥 CFEI', '🔧 Mechanical Permits', '🚿 Sanitary Permits'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8a020' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-logo">
          <div className="auth-logo-badge">B</div>
          <h2>Sign In</h2>
          <p>Municipality of Balagtas — Engineering Office</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" className="form-control" placeholder="juan@email.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }} disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1e4e78', fontWeight: 600 }}>Register here</Link>
        </p>
        <div style={{ marginTop: 24, padding: 14, background: '#f0f4f8', borderRadius: 10, fontSize: 12, color: '#64748b' }}>
          <strong>Demo Admin:</strong> admin@balagtas.gov.ph / admin123456<br/>
          <em style={{ fontSize: 11 }}>Run /api/admin/seed to create admin account</em>
        </div>
      </div>
    </div>
  );
}
