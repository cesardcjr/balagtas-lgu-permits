import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', address: '', contactNumber: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register({ fullName: form.fullName, address: form.address, contactNumber: form.contactNumber, email: form.email, password: form.password });
      toast.success('Account created! Welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h1>Create Your<br/>Permit<br/>Account</h1>
        <p>Register to apply for permits online from the Municipality of Balagtas Engineering Office. Track your applications in real-time.</p>
      </div>
      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <div className="auth-logo">
          <div className="auth-logo-badge">B</div>
          <h2>Create Account</h2>
          <p>All fields are required</p>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input name="fullName" className="form-control" placeholder="Juan dela Cruz" value={form.fullName} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Complete Address <span>*</span></label>
            <input name="address" className="form-control" placeholder="Blk 1 Lot 2, Purok 3, Barangay..." value={form.address} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number <span>*</span></label>
            <input name="contactNumber" className="form-control" placeholder="09XXXXXXXXX" value={form.contactNumber} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input name="email" type="email" className="form-control" placeholder="juan@email.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span>*</span></label>
            <input name="password" type="password" className="form-control" placeholder="Minimum 8 characters" value={form.password} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password <span>*</span></label>
            <input name="confirm" type="password" className="form-control" placeholder="Re-enter password" value={form.confirm} onChange={handle} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? '⏳ Creating account...' : '✅ Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1e4e78', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
