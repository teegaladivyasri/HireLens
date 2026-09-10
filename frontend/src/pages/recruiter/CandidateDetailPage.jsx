import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisService } from '../../services/analysisService';
import { LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { formatLocalDateTime } from '../../utils/dateUtils';
import {
  FileText,
  Briefcase,
  ArrowLeft,
  Check,
  Clock,
  UserCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  TrendingUp,
  FolderGit2,
  GraduationCap,
  Award,
  CheckCircle2,
} from 'lucide-react';

export const CandidateDetailPage = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const pollTimerRef = useRef(null);

  useEffect(() => {
    fetchDetail();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [id]);

  const getSkillName = (skill) => {
    if (!skill) return '';
    if (typeof skill === 'string') return skill;
    return skill.skill || skill.name || JSON.stringify(skill);
  };

  const fetchDetail = async () => {
    try {
      const data = await analysisService.getAnalysisDetail(id);
      setCandidate(data);
      setError('');

      if (data.status === 'PENDING' || data.status === 'ANALYZING' || data.status === 'PROCESSING') {
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(async () => {
            try {
              const updated = await analysisService.getAnalysisDetail(id);
              setCandidate(updated);
              if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
            } catch (err) {
              console.error('Polling error', err);
            }
          }, 2000);
        }
      } else {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    } catch (err) {
      setError('Unable to load candidate details. Please verify the candidate record.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      setUpdateMsg('');
      const updated = await analysisService.updateCandidateStatus(id, newStatus);
      setCandidate(updated);
      setUpdateMsg(`Candidate workflow status updated to ${newStatus}.`);
      setTimeout(() => setUpdateMsg(''), 3500);
    } catch (err) {
      alert('Failed to update candidate status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '840px' }}>
          <LoadingState message="Retrieving candidate review profile..." />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '840px' }}>
          <ErrorState title="Candidate Not Found" message={error} onRetry={fetchDetail} />
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/recruiter/jobs" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Job Postings</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPendingOrProcessing = candidate.status === 'PENDING' || candidate.status === 'ANALYZING' || candidate.status === 'PROCESSING';
  const isFailed = candidate.status === 'FAILED';
  const isCompleted = candidate.status === 'COMPLETED' && candidate.match_result;
  const result = candidate.match_result || {};
  const overallScore = Math.round(result.overall_score || 0);

  const skillsScore = Math.round(result.component_scores?.skills_score ?? result.skill_match ?? 0);
  const expScore = Math.round(result.component_scores?.experience_score ?? result.experience_match ?? 0);
  const projScore = Math.round(result.component_scores?.projects_score ?? result.project_match ?? 0);
  const eduScore = Math.round(result.component_scores?.education_score ?? result.education_match ?? 0);
  const prefScore = Math.round(result.component_scores?.preferred_skills_score ?? 0);

  const getTierBadge = (score) => {
    if (score >= 75) return { label: 'Strong Fit', color: '#2b4528', bg: '#eef2eb' };
    if (score >= 50) return { label: 'Moderate Fit', color: '#5c4e16', bg: '#f7f4e9' };
    return { label: 'Emerging Alignment', color: 'var(--color-olive-drab)', bg: 'var(--bg-surface-alt)' };
  };

  const tier = getTierBadge(overallScore);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to={`/recruiter/jobs/${candidate.job_id}/screen`}
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
            <span>Return to Screening Cohort</span>
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge" style={{ marginBottom: '0.5rem' }}>Screening Record #{candidate.id}</span>
              <h1>{candidate.resume?.candidate_name || candidate.resume?.filename || 'Candidate Review'}</h1>
              <p style={{ marginTop: '0.25rem' }}>
                Job Role: <strong>{candidate.job?.title}</strong> • Screened on {formatLocalDateTime(candidate.created_at)}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-dark" style={{ padding: '0.4rem 0.8rem' }}>
                Status: {candidate.candidate_status}
              </span>
              <span className="badge badge-outline" style={{ padding: '0.4rem 0.8rem' }}>
                Engine: {candidate.status}
              </span>
              {isPendingOrProcessing && (
                <button
                  onClick={fetchDetail}
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  title="Refresh evaluation"
                >
                  <RotateCw size={14} className="pulse-animation" />
                </button>
              )}
            </div>
          </div>
        </div>

        {updateMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-smoky-black)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-alt)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}>
            <Check size={16} />
            <span>{updateMsg}</span>
          </div>
        )}

        {/* Recruiter Decision Panel */}
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-smoky-black)' }}>
          <div className="card-header">
            <h2 style={{ fontSize: '1.2rem' }}>Recruiter Decision & Workflow Status</h2>
            <p style={{ fontSize: '0.875rem' }}>
              AI provides recommendations and explainable scoring, but human judgment assigns the workflow status.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['NEW', 'REVIEW', 'SHORTLISTED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating || candidate.candidate_status === status}
                className={candidate.candidate_status === status ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
              >
                {status === 'SHORTLISTED' && <UserCheck size={15} style={{ marginRight: '4px' }} />}
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Document Ingestion Summary */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 style={{ fontSize: '1.2rem' }}>Ingested Document Metadata</h2>
          </div>

          <div className="grid-2">
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', textTransform: 'uppercase' }}>
                Document Name
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {candidate.resume?.filename}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', textTransform: 'uppercase' }}>
                File Size & Format
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {(candidate.resume?.file_size / 1024).toFixed(1)} KB ({candidate.resume?.mime_type})
              </div>
            </div>
          </div>
        </div>

        {/* Processing State */}
        {isPendingOrProcessing && (
          <div className="card" style={{ borderLeft: '4px solid var(--color-olive-drab)', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={24} className="pulse-animation" style={{ color: 'var(--color-olive-drab)' }} />
              <h2 style={{ fontSize: '1.35rem' }}>AI Matching Engine In Progress</h2>
            </div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
              Evaluation is being calculated asynchronously in the background. Polling every 2s...
            </p>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="card" style={{ borderLeft: '4px solid #b3261e', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} style={{ color: '#b3261e' }} />
              <h2 style={{ fontSize: '1.35rem' }}>Evaluation Processing Error</h2>
            </div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
              {candidate.error_message || 'The AI matching engine encountered an issue while parsing this candidate document.'}
            </p>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <>
            {/* Overall Score Card */}
            <div className="score-hero">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-bone)' }} />
                  <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-bone)' }}>
                    Recruiter Evaluation Score
                  </span>
                </div>
                <h2 style={{ color: 'var(--color-floral-white)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Deterministic Candidate Match
                </h2>
                <p style={{ color: 'var(--color-bone)', fontSize: '0.925rem', maxWidth: '480px', margin: 0 }}>
                  Standardized multi-factor score benchmarked against the requirements of {candidate.job?.title}.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div className="score-hero-number">{overallScore}%</div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '999px',
                    backgroundColor: tier.bg,
                    color: tier.color,
                    marginTop: '0.5rem',
                  }}
                >
                  {tier.label}
                </div>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>Component Breakdown</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Transparent subscores evaluated from verified document qualifications.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Required Skills Coverage (40%)</span>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{skillsScore}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, skillsScore))}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Experience Depth (25%)</span>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{expScore}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, expScore))}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Applied Projects & Portfolio (15%)</span>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{projScore}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, projScore))}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Education & Credentials (10%)</span>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{eduScore}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill-alt" style={{ width: `${Math.min(100, Math.max(0, eduScore))}%` }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Preferred Skills (10%)</span>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>{prefScore}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill-alt" style={{ width: `${Math.min(100, Math.max(0, prefScore))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence-backed skill match list */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>Matched Skills with Resume Evidence</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Authentic snippets extracted from the candidate's document supporting each matched skill.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  <span className="pill-matched">
                    <CheckCircle2 size={12} /> {result.matched_skills?.length || 0} Matched Qualifications
                  </span>
                </h3>

                {result.matched_skills && result.matched_skills.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {result.matched_skills.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem 1rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-alt)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.skill}</span>
                          {item.matched_as && item.matched_as.toLowerCase() !== item.skill.toLowerCase() && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-olive-drab)' }}>
                              Matched as "{item.matched_as}"
                            </span>
                          )}
                        </div>
                        {item.evidence && (
                          <div className="evidence-quote">
                            "{item.evidence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-olive-drab)' }}>
                    No required skills were substantiated in the resume document.
                  </p>
                )}
              </div>

              {/* Missing Skills */}
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  <span className="pill-missing">
                    {result.missing_skills?.length || 0} Missing Required Qualifications
                  </span>
                </h3>

                {result.missing_skills && result.missing_skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.missing_skills.map((skill, idx) => (
                      <span key={idx} className="pill-missing" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                        {getSkillName(skill)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#2b4528', fontWeight: 600 }}>
                    ✓ Candidate satisfies all required skills listed in the job posting.
                  </p>
                )}
              </div>
            </div>

            {/* AI Evaluation Rationale */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>AI Evaluation Rationale</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Objective reasoning behind the candidate's deterministic match score.
                </p>
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-smoky-black)' }}>
                <p>{result.explanation}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
