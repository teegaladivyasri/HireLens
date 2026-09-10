import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Briefcase, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JOB_SEEKER'); // 'JOB_SEEKER' | 'RECRUITER'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Register user
      await register({
        name,
        email,
        password,
        role,
      });

      // 2. Automatically authenticate
      const user = await login({ email, password });

      // 3. Redirect to role dashboard
      if (user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your information and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ fontSize: '0.925rem' }}>Select your account type to access specialized platform tools.</p>
        </div>

        <div className="card">
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              color: 'var(--color-smoky-black)',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">I am joining as a:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setRole('JOB_SEEKER')}
                  style={{
                    padding: '1rem',
                    border: `1.5px solid ${role === 'JOB_SEEKER' ? 'var(--color-smoky-black)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: role === 'JOB_SEEKER' ? 'var(--bg-surface-alt)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <UserCheck size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Job Seeker</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-olive-drab)' }}>
                    Analyze resumes against JDs & get actionable fit feedback.
                  </p>
                </div>

                <div
                  onClick={() => setRole('RECRUITER')}
                  style={{
                    padding: '1rem',
                    border: `1.5px solid ${role === 'RECRUITER' ? 'var(--color-smoky-black)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: role === 'RECRUITER' ? 'var(--bg-surface-alt)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Briefcase size={18} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recruiter</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-olive-drab)' }}>
                    Post jobs, upload cohorts (bulk/ZIP), & screen candidates.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                required
                className="form-input"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Setting up account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-olive-drab)',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-smoky-black)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
