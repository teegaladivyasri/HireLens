import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analysisService } from '../../services/analysisService';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { FileText, ArrowRight, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';

export const SeekerDashboardPage = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analysisService.getCandidateHistory();
      setAnalyses(data || []);
    } catch (err) {
      setError('Could not retrieve your past analyses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <span className="badge" style={{ marginBottom: '0.5rem' }}>Job Seeker Workspace</span>
            <h1>Welcome, {user?.name}</h1>
            <p style={{ marginTop: '0.25rem' }}>
              Evaluate your resume against target job requirements and review explainable alignment feedback.
            </p>
          </div>

          <Link to="/candidate/analyze" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
            <Plus size={18} />
            <span>New Fit Analysis</span>
          </Link>
        </div>

        {/* Content area */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Recent Fit Analyses</h2>
              <p style={{ fontSize: '0.875rem' }}>Track the progress and status of your resume comparisons.</p>
            </div>
            {analyses.length > 0 && (
              <Link to="/candidate/history" className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem' }}>
                View All History
              </Link>
            )}
          </div>

          {loading ? (
            <LoadingState message="Fetching your analysis history..." />
          ) : error ? (
            <ErrorState title="History Unavailable" message={error} onRetry={fetchHistory} />
          ) : analyses.length === 0 ? (
            <EmptyState
              title="No analyses yet"
              description="Your analysis history will appear here once you compare a resume against a target job description."
              action={
                <Link to="/candidate/analyze" className="btn btn-secondary">
                  Start Your First Analysis
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analyses.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.1rem 1.25rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-alt)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={22} style={{ color: 'var(--color-olive-drab)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {item.job?.title || 'Job Description Analysis'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)' }}>
                        Analysis #{item.id} • {formatLocalDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {item.status === 'COMPLETED' && item.match_result?.overall_score != null && (
                      <span className="badge badge-dark" style={{ fontWeight: 700 }}>
                        {Math.round(item.match_result.overall_score)}% Match
                      </span>
                    )}
                    <span className="badge">Status: {item.status}</span>
                    <Link
                      to={`/candidate/results/${item.id}`}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
                    >
                      <span>View Details</span>
                      <ArrowRight size={14} />
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
