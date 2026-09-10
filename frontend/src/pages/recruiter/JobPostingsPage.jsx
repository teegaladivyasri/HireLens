import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { JobDescriptionInput } from '../../components/common/JobDescriptionInput';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { Briefcase, Plus, Users, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';

export const JobPostingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jdData, setJdData] = useState({ mode: 'text', text: '', file: null });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

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
      setError('Unable to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setFormError('Please provide a job title.');
      return;
    }

    if (jdData.mode === 'text' && !jdData.text.trim()) {
      setFormError('Please enter the job description text.');
      return;
    }

    if (jdData.mode === 'upload' && !jdData.file) {
      setFormError('Please select a valid PDF or DOCX Job Description document.');
      return;
    }

    try {
      setCreating(true);
      setFormError('');

      if (jdData.mode === 'upload') {
        await jobService.createJobFromDocument(jobTitle.trim(), jdData.file);
      } else {
        await jobService.createJob({
          title: jobTitle.trim(),
          description: jdData.text.trim(),
        });
      }

      // Reset form & reload list
      setJobTitle('');
      setJdData({ mode: 'text', text: '', file: null });
      setShowCreateForm(false);
      await fetchJobs();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create job posting. Please try again.';
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await jobService.deleteJob(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err) {
      alert('Failed to delete job posting.');
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
          gap: '1rem',
        }}>
          <div>
            <span className="badge" style={{ marginBottom: '0.5rem' }}>Recruiter Roles</span>
            <h1>Job Postings</h1>
            <p style={{ marginTop: '0.25rem' }}>
              Define target positions, upload or paste requirements, and manage candidate screenings.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>{showCreateForm ? 'Cancel Creation' : 'Create New Job'}</span>
          </button>
        </div>

        {/* Create Job Form Modal/Section */}
        {showCreateForm && (
          <div className="card" style={{ marginBottom: '2.5rem', border: '1.5px solid var(--color-smoky-black)' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1.3rem' }}>Create New Job Posting</h2>
              <p style={{ fontSize: '0.875rem' }}>
                Provide the role title and requirements via document upload (PDF/DOCX) or plain text.
              </p>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                color: 'var(--color-smoky-black)',
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Position Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Lead Distributed Systems Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              {/* Reusable JobDescriptionInput */}
              <JobDescriptionInput
                value={jdData.text}
                onChange={(data) => setJdData(data)}
                showTitleField={false}
                required={true}
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem' }}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating Job Posting...</span>
                    </>
                  ) : (
                    <span>Save & Publish Job Posting</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Jobs List */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.25rem' }}>All Job Postings</h2>
          </div>

          {loading ? (
            <LoadingState message="Loading jobs..." />
          ) : error ? (
            <ErrorState title="Jobs Unavailable" message={error} onRetry={fetchJobs} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="You haven't created any jobs yet."
              description="Click 'Create New Job' above to define your first opening and start screening candidates."
              action={
                <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                  Create First Job
                </button>
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
                        ID #{job.id} • Created {formatLocalDate(job.created_at)} • Status: {job.status}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                      to={`/recruiter/jobs/${job.id}/screen`}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      <Users size={16} />
                      <span>Screen Candidates</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.75rem' }}
                      title="Delete Job"
                    >
                      <Trash2 size={16} />
                    </button>
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
