import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import ApplyPermit from './pages/ApplyPermit';
import MyPermits from './pages/MyPermits';
import PermitDetail from './pages/PermitDetail';
import Inbox from './pages/Inbox';
import AdminDashboard from './pages/AdminDashboard';
import AdminPermits from './pages/AdminPermits';
import AdminPermitDetail from './pages/AdminPermitDetail';
import AdminInbox from './pages/AdminInbox';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading Balagtas e-Permit System...</p></div>;
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute><ApplyPermit /></ProtectedRoute>} />
      <Route path="/my-permits" element={<ProtectedRoute><MyPermits /></ProtectedRoute>} />
      <Route path="/permits/:id" element={<ProtectedRoute><PermitDetail /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/permits" element={<ProtectedRoute adminOnly><AdminPermits /></ProtectedRoute>} />
      <Route path="/admin/permits/:id" element={<ProtectedRoute adminOnly><AdminPermitDetail /></ProtectedRoute>} />
      <Route path="/admin/inbox" element={<ProtectedRoute adminOnly><AdminInbox /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}
