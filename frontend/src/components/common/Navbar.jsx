import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Compass, LogOut, User as UserIcon, FileText, Briefcase, History } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isJobSeeker, isRecruiter, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--color-smoky-black)',
            color: 'var(--color-floral-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
          }}>
            H
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--color-smoky-black)',
          }}>
            HireLens
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link
            to="/about"
            style={{
              fontSize: '0.925rem',
              fontWeight: 500,
              color: isActive('/about') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
            }}
          >
            About & Mission
          </Link>

          {isAuthenticated && isJobSeeker && (
            <>
              <Link
                to="/candidate/dashboard"
                style={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  color: isActive('/candidate/dashboard') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/candidate/analyze"
                style={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  color: isActive('/candidate/analyze') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
                }}
              >
                Analyze Fit
              </Link>
              <Link
                to="/candidate/history"
                style={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  color: isActive('/candidate/history') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
                }}
              >
                History
              </Link>
            </>
          )}

          {isAuthenticated && isRecruiter && (
            <>
              <Link
                to="/recruiter/dashboard"
                style={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  color: isActive('/recruiter/dashboard') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
                }}
              >
                Recruiter Hub
              </Link>
              <Link
                to="/recruiter/jobs"
                style={{
                  fontSize: '0.925rem',
                  fontWeight: 500,
                  color: isActive('/recruiter/jobs') ? 'var(--color-smoky-black)' : 'var(--color-olive-drab)',
                }}
              >
                Job Postings
              </Link>
            </>
          )}
        </nav>

        {/* Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-smoky-black)' }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'var(--color-olive-drab)',
                  textTransform: 'uppercase',
                }}>
                  {user.role === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter'}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                title="Log out"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
