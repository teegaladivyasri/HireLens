import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/jobService';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { Briefcase, Plus, Users, ArrowRight, FileCheck, Layers } from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';

export const RecruiterDashboardPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await jobService.getJobs();
      setJobs(data || []);
    } catch (err) {
      setError('Unable to load your job postings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <span className="badge" style={{ marginBottom: '0.5rem' }}>Recruiter Workspace</span>
            <h1>Welcome, {user?.name}</h1>
            <p style={{ marginTop: '0.25rem' }}>
              Manage job requirements, ingest resume batches, and screen candidate cohorts with explainable intelligence.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/recruiter/jobs" className="btn btn-primary">
              <Plus size={18} />
              <span>Create New Job</span>
            </Link>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Your Job Postings</h2>
              <p style={{ fontSize: '0.875rem' }}>Active roles available for resume cohort screening.</p>
            </div>
            <Link to="/recruiter/jobs" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem' }}>
              Manage All Jobs
            </Link>
          </div>

          {loading ? (
            <LoadingState message="Loading your job postings..." />
          ) : error ? (
            <ErrorState title="Error Loading Jobs" message={error} onRetry={fetchJobs} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="You haven't created any jobs yet."
              description="Create your first job posting by providing a title and Job Description (upload PDF/DOCX or paste text) to start screening candidates."
              action={
                <Link to="/recruiter/jobs" className="btn btn-primary">
                  Create First Job Posting
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-alt)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Briefcase size={24} style={{ color: 'var(--color-olive-drab)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{job.title}</div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--color-olive-drab)', marginTop: '0.25rem' }}>
                        Created {formatLocalDate(job.created_at)} • Status: {job.status}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link
                      to={`/recruiter/jobs/${job.id}/screen`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      <Users size={16} />
                      <span>Screen Candidates</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
