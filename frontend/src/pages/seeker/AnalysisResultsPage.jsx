import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisService } from '../../services/analysisService';
import { LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { formatLocalDateTime } from '../../utils/dateUtils';
import {
  FileText,
  Briefcase,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Award,
  Sparkles,
  TrendingUp,
  BookOpen,
  FolderGit2,
  GraduationCap,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

export const AnalysisResultsPage = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollTimerRef = useRef(null);

  useEffect(() => {
    fetchAnalysis();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const data = await analysisService.getAnalysisDetail(id);
      setAnalysis(data);
      setError('');

      // If pending or analyzing/processing, set up polling
      if (data.status === 'PENDING' || data.status === 'ANALYZING' || data.status === 'PROCESSING') {
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(async () => {
            try {
              const updated = await analysisService.getAnalysisDetail(id);
              setAnalysis(updated);
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
      if (err.response?.status === 403) {
        setError('You are not authorized to view this analysis.');
      } else if (err.response?.status === 404) {
        setError('Analysis record not found. Please verify the analysis ID.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Unable to load analysis details. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSkillName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') return item.skill || JSON.stringify(item);
    return String(item);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '840px' }}>
          <LoadingState message="Loading your fit analysis..." />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '840px' }}>
          <ErrorState title="Analysis Unavailable" message={error || 'Unable to locate analysis record.'} onRetry={fetchAnalysis} />
          <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/candidate/analyze" className="btn btn-primary">
              Return to Analyze Fit
            </Link>
            <Link to="/candidate/dashboard" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPendingOrProcessing = analysis.status === 'PENDING' || analysis.status === 'ANALYZING' || analysis.status === 'PROCESSING';
  const isFailed = analysis.status === 'FAILED';
  const isCompleted = analysis.status === 'COMPLETED';
  const result = analysis.match_result || {};
  const overallScore = Math.round(result.overall_score || 0);

  const skillsScore = Math.round(result.component_scores?.skills_score ?? result.skill_match ?? 0);
  const expScore = Math.round(result.component_scores?.experience_score ?? result.experience_match ?? 0);
  const projScore = Math.round(result.component_scores?.projects_score ?? result.project_relevance ?? 0);
  const eduScore = Math.round(result.component_scores?.education_score ?? result.education_match ?? 0);
  const prefScore = Math.round(result.component_scores?.preferred_skills_score ?? 0);

  const getTierLabel = (score) => {
    if (score >= 75) return { label: 'Strong Fit', color: '#2b4528', bg: '#eef2eb' };
    if (score >= 50) return { label: 'Moderate Fit', color: '#5c4e16', bg: '#f7f4e9' };
    return { label: 'Emerging Alignment', color: 'var(--color-olive-drab)', bg: 'var(--bg-surface-alt)' };
  };

  const tier = getTierLabel(overallScore);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation & Header */}
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
            <span>Return to Candidate Dashboard</span>
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge" style={{ marginBottom: '0.5rem' }}>Evaluation #{analysis.id}</span>
              <h1>Job Fit Evaluation</h1>
              <p style={{ marginTop: '0.25rem' }}>
                Evaluated on {formatLocalDateTime(analysis.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-dark" style={{ padding: '0.4rem 0.8rem' }}>
                Status: {analysis.status}
              </span>
              {isPendingOrProcessing && (
                <button
                  onClick={fetchAnalysis}
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                  title="Refresh status"
                >
                  <RotateCw size={14} className="pulse-animation" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real Document Pairing Card */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <FileText size={20} style={{ color: 'var(--color-smoky-black)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>Target Resume</h3>
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 600 }}>
              {analysis.resume?.filename || `Resume Document #${analysis.resume_id}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', marginTop: '0.35rem' }}>
              Candidate: {analysis.resume?.candidate_name || 'Direct Submission'} • Format: {analysis.resume?.mime_type || 'Document'}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <Briefcase size={20} style={{ color: 'var(--color-smoky-black)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>Job Target</h3>
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 600 }}>
              {analysis.job?.title || 'Job Description'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', marginTop: '0.35rem' }}>
              Target Job ID #{analysis.job_id} • Status: {analysis.job?.status || 'Active'}
            </div>
          </div>
        </div>

        {/* State 1: In Progress / Pending / Analyzing */}
        {isPendingOrProcessing && (
          <div className="card" style={{ borderLeft: '4px solid var(--color-olive-drab)', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Clock size={24} className="pulse-animation" style={{ color: 'var(--color-olive-drab)' }} />
              <h2 style={{ fontSize: '1.35rem' }}>Your fit analysis is being calculated...</h2>
            </div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
              HireLens is extracting core qualifications, normalizing skill competencies, and comparing experience depth against the job description.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-olive-drab)', lineHeight: 1.7 }}>
              This page automatically polls every 2 seconds. Once complete, your deterministic score breakdown and evidence-backed rationale will display here.
            </p>
          </div>
        )}

        {/* State 2: Failed */}
        {isFailed && (
          <div className="card" style={{ borderLeft: '4px solid #b3261e', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} style={{ color: '#b3261e' }} />
              <h2 style={{ fontSize: '1.35rem' }}>Unable to complete this analysis.</h2>
            </div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
              {analysis.error_message || 'The AI matching engine encountered an issue while parsing the document text. Please verify document formatting and try again.'}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/candidate/analyze" className="btn btn-primary">
                Return to Analyze Fit
              </Link>
              <Link to="/candidate/dashboard" className="btn btn-secondary">
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Completed Evaluation */}
        {isCompleted && (
          <>
            {/* Overall Score Hero Card */}
            <div className="score-hero">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-bone)' }} />
                  <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-bone)' }}>
                    Deterministic Job Fit Score
                  </span>
                </div>
                <h2 style={{ color: 'var(--color-floral-white)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Overall Compatibility
                </h2>
                <p style={{ color: 'var(--color-bone)', fontSize: '0.925rem', maxWidth: '480px', margin: 0 }}>
                  Calculated from multi-factor deterministic scoring: required skills, verified experience, relevant projects, and educational credentials.
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

            {/* Component Scores Breakdown */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>Scoring Component Breakdown</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Transparent, weighted evaluation factors normalized to the job requirements.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Required Skills */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--color-smoky-black)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Required Skills Coverage (Weight: 40%)</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {skillsScore}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, skillsScore))}%` }} />
                  </div>
                </div>

                {/* 2. Experience */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: 'var(--color-smoky-black)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Relevant Experience Depth (Weight: 25%)</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {expScore}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, expScore))}%` }} />
                  </div>
                </div>

                {/* 3. Projects */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FolderGit2 size={16} style={{ color: 'var(--color-smoky-black)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Applied Projects & Portfolio (Weight: 15%)</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {projScore}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, projScore))}%` }} />
                  </div>
                </div>

                {/* 4. Education */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={16} style={{ color: 'var(--color-smoky-black)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Education & Credentials (Weight: 10%)</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {eduScore}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill-alt" style={{ width: `${Math.min(100, Math.max(0, eduScore))}%` }} />
                  </div>
                </div>

                {/* 5. Preferred Skills */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={16} style={{ color: 'var(--color-smoky-black)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Preferred & Nice-to-Have Skills (Weight: 10%)</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {prefScore}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill-alt" style={{ width: `${Math.min(100, Math.max(0, prefScore))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence-Backed Skill Match Results */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>Skills Match & Document Evidence</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Every match is substantiated with direct evidence extracted from your uploaded resume.
                </p>
              </div>

              {/* Matched Skills */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="pill-matched">
                    <CheckCircle2 size={12} /> {result.matched_skills?.length || 0} Matched Skills
                  </span>
                </h3>

                {result.matched_skills && result.matched_skills.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getSkillName(item)}</span>
                          {item.matched_as && item.matched_as.toLowerCase() !== getSkillName(item).toLowerCase() && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-olive-drab)' }}>
                              Matched via synonym: <em>"{item.matched_as}"</em>
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
                  <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--color-olive-drab)' }}>
                    No exact required skills were verified in the resume document text.
                  </p>
                )}
              </div>

              {/* Partial Skills if any */}
              {result.partial_skills && result.partial_skills.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pill-partial">
                      <AlertTriangle size={12} /> {result.partial_skills.length} Partially Matched Skills
                    </span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {result.partial_skills.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem 1rem',
                          border: '1px solid #dfd8b5',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#fdfbf4',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getSkillName(item)}</span>
                          <span style={{ fontSize: '0.75rem', color: '#5c4e16' }}>
                            Partial context match
                          </span>
                        </div>
                        {item.evidence && (
                          <div className="evidence-quote">
                            "{item.evidence}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    ✓ All required skills listed in the job description were verified in your profile!
                  </p>
                )}
              </div>
            </div>

            {/* Explainable Rationale */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>Why This Score</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Detailed rationale generated by the HireLens deterministic scoring engine.
                </p>
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-smoky-black)' }}>
                <p>{result.explanation}</p>
              </div>
            </div>

            {/* Actionable & Ethical Recommendations */}
            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-smoky-black)' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1.25rem' }}>How to Improve Your Fit</h2>
                <p style={{ fontSize: '0.875rem' }}>
                  Actionable guidance to strengthen your application for this position.
                </p>
              </div>

              {result.recommendations && result.recommendations.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ fontSize: '0.925rem', lineHeight: 1.6, color: 'var(--color-smoky-black)' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-olive-drab)' }}>
                  Your profile strongly aligns with the core requirements for this role. Ensure your project links and contact details are up to date.
                </p>
              )}

              <div style={{
                marginTop: '1.5rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--color-olive-drab)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Ethical Guidance:</strong> HireLens provides explainable alignment insights to help you emphasize genuine accomplishments. Never fabricate experience or incorporate skills you cannot substantiate during interviews.
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/candidate/analyze" className="btn btn-primary">
                Analyze Another Role
              </Link>
              <Link to="/candidate/history" className="btn btn-secondary">
                View Evaluation History
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
