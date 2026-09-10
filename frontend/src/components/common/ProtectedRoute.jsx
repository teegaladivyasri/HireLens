import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '28px',
          height: '28px',
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--color-smoky-black)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Cross-role protection: redirect to respective dashboard
    if (user?.role === 'JOB_SEEKER') {
      return <Navigate to="/candidate/dashboard" replace />;
    } else if (user?.role === 'RECRUITER') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
