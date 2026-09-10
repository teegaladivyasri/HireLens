import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, Briefcase, FileSearch, ArrowRight, Eye, Scale, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated, isJobSeeker, isRecruiter } = useAuth();

  const getDashboardLink = () => {
    if (isJobSeeker) return '/candidate/dashboard';
    if (isRecruiter) return '/recruiter/dashboard';
    return '/register';
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '5rem 0 4rem 0',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-alt)',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.02em',
            marginBottom: '1.75rem',
            color: 'var(--color-olive-drab)',
          }}>
            <Eye size={14} />
            <span>Explainable Talent Intelligence</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            marginBottom: '1.5rem',
            fontWeight: 700,
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1.15,
            textTransform: 'none',
            fontVariant: 'normal',
            letterSpacing: '-0.01em',
          }}>
            Better matches.<br />Clearer decisions.
          </h1>

          <p style={{
            fontSize: '1.15rem',
            lineHeight: 1.7,
            color: 'var(--color-olive-drab)',
            marginBottom: '2.5rem',
            maxWidth: '740px',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontWeight: 400,
          }}>
            HireLens bridges the gap between candidates and hiring teams through deep requirement extraction,
            transparent skill alignment, and actionable feedback—designed to assist human judgment rather than replace it.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to={isAuthenticated ? (isJobSeeker ? '/candidate/analyze' : '/recruiter/dashboard') : '/candidate/analyze'}
              className="btn btn-primary"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              <span>Check Your Match →</span>
            </Link>
            <Link
              to={isAuthenticated ? (isRecruiter ? '/recruiter/dashboard' : '/recruiter/jobs') : '/register?role=recruiter'}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              <span>For Recruiters →</span>
            </Link>
            <Link
              to="/about"
              className="btn btn-outline"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              <span>Our Methodology</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The Core Problem & Solution */}
      <section style={{ padding: '5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem auto' }}>
            <span className="badge" style={{ marginBottom: '0.75rem' }}>The Opportunity</span>
            <h2>Why Traditional Keyword Matching Fails Both Sides</h2>
            <p style={{ marginTop: '0.75rem' }}>
              Conventional applicant tracking filters act as opaque black boxes. Candidates receive arbitrary rejections without context,
              while recruiters spend hours sifting through unstructured submissions or relying on inaccurate keyword tallies.
            </p>
          </div>

          <div className="grid-2">
            <div className="card" style={{ borderLeft: '4px solid var(--color-smoky-black)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <UserCheck size={24} style={{ color: 'var(--color-smoky-black)' }} />
                <h3 style={{ fontSize: '1.25rem' }}>For Job Seekers: Constructive Clarity</h3>
              </div>
              <p style={{ marginBottom: '1.25rem' }}>
                The purpose of HireLens is not simply to approve or reject your resume. Instead, it provides actionable clarity:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.925rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Skill Gap Visibility:</strong> Distinguish between fully matched, partially matched, and missing requirements.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Experience Context:</strong> Understand how your past roles and project descriptions align with what the role demands.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Improvement Recommendations:</strong> Receive concrete guidance on rephrasing and highlighting genuine qualifications.</span>
                </li>
              </ul>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--color-olive-drab)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Briefcase size={24} style={{ color: 'var(--color-olive-drab)' }} />
                <h3 style={{ fontSize: '1.25rem' }}>For Recruiters: Cohort Screening at Scale</h3>
              </div>
              <p style={{ marginBottom: '1.25rem' }}>
                Recruiters manage candidate pools efficiently without relinquishing control or reviewing resumes one-by-one:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.925rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Bulk & ZIP Ingestion:</strong> Select multiple PDF/DOCX files at once or upload an entire ZIP archive safely.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Explainable Qualification Ranks:</strong> Review clear reasoning behind candidate scores rather than mysterious ratings.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span><strong>Collaborative Review:</strong> Move candidates through explicit stages: New, Review, Shortlisted, or Archived.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '5rem 0', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-alt)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge" style={{ marginBottom: '0.75rem' }}>Workflow</span>
            <h2>How HireLens Operates</h2>
            <p style={{ marginTop: '0.5rem' }}>A structured, document-first architecture built for precision.</p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-smoky-black)',
                color: 'var(--color-floral-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}>
                01
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Ingest Documents</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Upload PDF or DOCX files, or paste Job Descriptions directly. Recruiters can submit bulk cohorts via safe ZIP archives.
              </p>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-olive-drab)',
                color: 'var(--color-floral-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}>
                02
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Structured Extraction</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Documents are safely sanitized, parsed, and converted into structured competencies: technical skills, project scopes, and credentials.
              </p>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-smoky-black)',
                color: 'var(--color-floral-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}>
                03
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Explainable Assessment</h3>
              <p style={{ fontSize: '0.9rem' }}>
                Compare candidate qualifications against JD requirements with clear rationale, transparent missing skills, and human-in-the-loop review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible AI Commitment */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="card" style={{
            padding: '3rem 2.5rem',
            backgroundColor: 'var(--color-smoky-black)',
            color: 'var(--color-floral-white)',
            border: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-bone)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Scale size={30} style={{ color: 'var(--color-bone)' }} />
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="badge badge-outline" style={{ color: 'var(--color-bone)', borderColor: 'var(--color-bone)', marginBottom: '0.75rem' }}>
                  Ethical Hiring Principles
                </span>
                <h2 style={{ color: 'var(--color-floral-white)', marginBottom: '1rem', fontSize: '1.8rem' }}>
                  Our Responsible AI Commitment
                </h2>
                <p style={{ color: 'var(--color-bone)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  HireLens is built on the tenet that artificial intelligence must augment human decision-makers, not replace them.
                  We never execute automated reject decisions without human oversight. Every match assessment is accompanied by explainable
                  evidence, allowing recruiters to make balanced, well-informed choices and candidates to understand their strengths.
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--color-bone)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} />
                    <span>No Path Traversal / Secure Document Vault</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={16} />
                    <span>Transparent Scoring Rationale</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '4rem 0 5rem 0', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Experience Explainable Hiring?</h2>
          <p style={{ marginBottom: '2rem' }}>
            Choose your role and explore a transparent, document-centric approach to recruitment and job fit.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
              Create an Account
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
