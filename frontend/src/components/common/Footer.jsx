import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-primary)',
      marginTop: 'auto',
      padding: '3rem 0 2rem 0',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '3rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-smoky-black)',
              marginBottom: '0.75rem',
            }}>
              HireLens
            </div>
            <p style={{ maxWidth: '420px', fontSize: '0.9rem', color: 'var(--color-olive-drab)' }}>
              Explainable resume screening and job fit intelligence designed to assist human judgment,
              empowering job seekers to understand their qualifications and helping recruiters screen candidate cohorts with transparency.
            </p>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-smoky-black)',
              marginBottom: '1rem',
            }}>
              Platform
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/about" style={{ color: 'var(--color-olive-drab)' }}>About & Mission</Link></li>
              <li><Link to="/login" style={{ color: 'var(--color-olive-drab)' }}>Sign In</Link></li>
              <li><Link to="/register" style={{ color: 'var(--color-olive-drab)' }}>Create Account</Link></li>
            </ul>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-smoky-black)',
              marginBottom: '1rem',
            }}>
              Responsible AI
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-olive-drab)', lineHeight: 1.6 }}>
              HireLens operates as a decision-support platform. We believe AI should inform, explain, and illuminate rather than autonomously make recruitment choices.
            </p>
          </div>
        </div>

        <div style={{
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--color-olive-drab)',
        }}>
          <div>© {new Date().getFullYear()} HireLens. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Clean Architecture</span>
            <span>PostgreSQL Ready</span>
            <span>Explainable Fit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
