import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analysisService } from '../../services/analysisService';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { FileText, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { formatLocalDateTime } from '../../utils/dateUtils';

export const AnalysisHistoryPage = () => {
  const [history, setHistory] = useState([]);
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
      setHistory(data || []);
    } catch (err) {
      setError('Could not retrieve your historical records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to="/candidate/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.875rem',
              color: 'var(--color-olive-drab)',
              marginBottom: '1rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge" style={{ marginBottom: '0.5rem' }}>Audit Trail</span>
              <h1>Analysis History</h1>
              <p style={{ marginTop: '0.25rem' }}>All historical resume screening comparisons registered to your account.</p>
            </div>
            <Link to="/candidate/analyze" className="btn btn-primary">
              <Plus size={16} />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <LoadingState message="Loading historical analyses..." />
          ) : error ? (
            <ErrorState title="History Load Error" message={error} onRetry={fetchHistory} />
          ) : history.length === 0 ? (
            <EmptyState
              title="Your analysis history will appear here."
              description="You haven't run any resume analyses yet. Start by comparing your resume against a target role description."
              action={
                <Link to="/candidate/analyze" className="btn btn-primary">
                  Begin Fit Analysis
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((item) => (
                <div
                  key={item.id}
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
                    <FileText size={24} style={{ color: 'var(--color-olive-drab)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {item.job?.title || 'Job Fit Comparison'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', marginTop: '0.2rem' }}>
                        Analysis #{item.id} • Created {formatLocalDateTime(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {item.status === 'COMPLETED' && item.match_result?.overall_score != null && (
                      <span className="badge badge-dark" style={{ fontWeight: 700 }}>
                        {Math.round(item.match_result.overall_score)}% Match
                      </span>
                    )}
                    <span className="badge">Status: {item.status}</span>
                    <Link to={`/candidate/results/${item.id}`} className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem' }}>
                      <span>View Record</span>
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
