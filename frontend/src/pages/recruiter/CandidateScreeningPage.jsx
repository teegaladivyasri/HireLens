import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { analysisService } from '../../services/analysisService';
import { BatchResumeUploader } from '../../components/recruiter/BatchResumeUploader';
import { EmptyState, LoadingState, ErrorState } from '../../components/common/StateFeedback';
import { formatLocalDate, parseUtcDate } from '../../utils/dateUtils';
import {
  Briefcase,
  FileText,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  RotateCw,
  Filter,
  ArrowUpDown,
  Award,
} from 'lucide-react';

export const CandidateScreeningPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [shortlistData, setShortlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [screeningInProgress, setScreeningInProgress] = useState(false);
  const [actionError, setActionError] = useState('');
  const [shortlistActionMsg, setShortlistActionMsg] = useState('');

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('score_desc');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const pollTimerRef = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [id]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const [jobData, screeningsData] = await Promise.all([
        jobService.getJobById(id),
        analysisService.getJobScreenings(id),
      ]);
      setJob(jobData);
      setScreenings(screeningsData || []);

      // Load shortlist recommendations if any completed screenings exist
      try {
        const slData = await analysisService.getJobShortlist(id);
        setShortlistData(slData);
      } catch (slErr) {
        // Shortlist might return empty or error if no completed analyses
        setShortlistData(null);
      }

      // Check if any candidates are pending or processing
      const hasProcessing = (screeningsData || []).some(
        (s) => s.status === 'PENDING' || s.status === 'ANALYZING' || s.status === 'PROCESSING'
      );

      if (hasProcessing) {
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(() => {
            loadData(true);
          }, 2500);
        }
      } else {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    } catch (err) {
      if (!silent) setError('Unable to load job screening data. Please check the job ID.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleResumesExtracted = (resumes) => {
    setUploadedResumes(resumes || []);
    setActionError('');
  };

  const handleRunScreening = async () => {
    if (uploadedResumes.length === 0) return;
    try {
      setScreeningInProgress(true);
      setActionError('');
      const resumeIds = uploadedResumes.map((r) => r.id);
      await analysisService.screenBatchResumes(Number(id), resumeIds);
      setUploadedResumes([]);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to initialize batch screening. Please try again.';
      setActionError(msg);
    } finally {
      setScreeningInProgress(false);
    }
  };

  const handleStatusUpdate = async (analysisId, newStatus) => {
    try {
      await analysisService.updateCandidateStatus(analysisId, newStatus);
      setShortlistActionMsg(`Candidate #${analysisId} workflow status updated to ${newStatus}.`);
      setTimeout(() => setShortlistActionMsg(''), 3000);
      await loadData(true);
    } catch (err) {
      alert('Failed to update candidate workflow status.');
    }
  };

  const handleQuickShortlist = async (analysisId, currentStatus) => {
    const targetStatus = currentStatus === 'SHORTLISTED' ? 'REVIEW' : 'SHORTLISTED';
    await handleStatusUpdate(analysisId, targetStatus);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '1040px' }}>
          <LoadingState message="Loading job posting and screening cohorts..." />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: '1040px' }}>
          <ErrorState title="Job Screening Error" message={error} onRetry={() => loadData(false)} />
        </div>
      </div>
    );
  }

  // Filter and Sort Candidates
  let filtered = screenings.filter((cand) => {
    if (filterStatus === 'ALL') return true;
    return cand.candidate_status === filterStatus;
  });

  filtered.sort((a, b) => {
    const scoreA = a.match_result?.overall_score || 0;
    const scoreB = b.match_result?.overall_score || 0;
    const skillsA = a.match_result?.component_scores?.skills_score ?? a.match_result?.skill_match ?? 0;
    const skillsB = b.match_result?.component_scores?.skills_score ?? b.match_result?.skill_match ?? 0;
    const expA = a.match_result?.component_scores?.experience_score ?? a.match_result?.experience_match ?? 0;
    const expB = b.match_result?.component_scores?.experience_score ?? b.match_result?.experience_match ?? 0;

    if (sortBy === 'score_desc') return scoreB - scoreA;
    if (sortBy === 'score_asc') return scoreA - scoreB;
    if (sortBy === 'newest') return (parseUtcDate(b.created_at)?.getTime() || 0) - (parseUtcDate(a.created_at)?.getTime() || 0);
    if (sortBy === 'oldest') return (parseUtcDate(a.created_at)?.getTime() || 0) - (parseUtcDate(b.created_at)?.getTime() || 0);
    if (sortBy === 'skills_desc') return skillsB - skillsA;
    if (sortBy === 'experience_desc') return expB - expA;
    if (sortBy === 'name_asc') {
      const nameA = a.resume?.candidate_name || a.resume?.filename || '';
      const nameB = b.resume?.candidate_name || b.resume?.filename || '';
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  const recommendedList = shortlistData?.shortlisted_candidates || shortlistData?.recommended_candidates || [];
  const hasShortlistRecommendations = recommendedList.length > 0;
  const isAnyProcessing = screenings.some((s) => s.status === 'PENDING' || s.status === 'ANALYZING' || s.status === 'PROCESSING');

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* Navigation & Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to="/recruiter/jobs"
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
            <span>Back to Job Postings</span>
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge" style={{ marginBottom: '0.5rem' }}>Recruiter Cohort Screening</span>
              <h1>{job.title}</h1>
              <p style={{ marginTop: '0.25rem' }}>
                Deterministic AI screening and explainable qualification ranking for candidate cohorts.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="badge badge-dark">Job ID #{job.id}</div>
              {isAnyProcessing && (
                <div className="badge" style={{ backgroundColor: '#fdfbf4', borderColor: '#dfd8b5', color: '#5c4e16' }}>
                  <Loader2 size={12} className="pulse-animation" /> Evaluating Candidates...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Status Notice */}
        {shortlistActionMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-smoky-black)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: 'var(--bg-surface-alt)',
          }}>
            <CheckCircle2 size={18} />
            <span>{shortlistActionMsg}</span>
          </div>
        )}

        {actionError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid #b3261e',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            color: '#b3261e',
            backgroundColor: 'var(--bg-surface-alt)',
          }}>
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section 1: AI Recommended Shortlist */}
        {hasShortlistRecommendations && (
          <div className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--color-smoky-black)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-smoky-black)' }} />
                  <h2 style={{ fontSize: '1.3rem' }}>AI Recommended Shortlist</h2>
                </div>
                <p style={{ fontSize: '0.875rem', maxWidth: '650px' }}>
                  {shortlistData.summary || 'Top performing candidates benchmarked against required qualifications and experience depth.'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-dark">
                  {shortlistData.total_shortlisted ?? recommendedList.length} Recommended of {shortlistData.total_screened ?? screenings.length} Screened
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendedList.map((cand) => {
                const isShortlisted = cand.candidate_status === 'SHORTLISTED';
                return (
                  <div
                    key={cand.analysis_id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface-alt)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: '280px', flex: 1 }}>
                      <div className="shortlist-rank-badge">
                        #{cand.rank}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-smoky-black)' }}>
                            {cand.candidate_name || `Candidate #${cand.analysis_id}`}
                          </span>
                          <span className="badge" style={{ fontSize: '0.7rem' }}>
                            {cand.recommendation_tier}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', marginTop: '0.2rem' }}>
                          Document: {cand.filename}
                        </div>

                        {/* Recommendation rationale */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.5 }}>
                          {cand.shortlist_rationale}
                        </div>

                        {/* Strengths and gaps tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {cand.key_strengths?.slice(0, 4).map((str, idx) => (
                            <span key={idx} className="pill-matched" style={{ fontSize: '0.75rem' }}>
                              ✓ {str}
                            </span>
                          ))}
                          {cand.critical_missing?.map((gap, idx) => (
                            <span key={idx} className="pill-missing" style={{ fontSize: '0.75rem', borderColor: '#dfd8b5', color: '#826d1d' }}>
                              Missing: {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score and Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>
                          {Math.round(cand.overall_score)}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-olive-drab)', marginTop: '0.2rem' }}>
                          Skills: {Math.round(cand.required_skills_coverage)}%
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                        <button
                          onClick={() => handleQuickShortlist(cand.analysis_id, cand.candidate_status)}
                          className={isShortlisted ? 'btn btn-primary' : 'btn btn-outline'}
                          style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
                        >
                          <UserCheck size={14} />
                          <span>{isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}</span>
                        </button>

                        <Link
                          to={`/recruiter/candidates/${cand.analysis_id}`}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-olive-drab)',
                            textAlign: 'center',
                            textDecoration: 'underline',
                          }}
                        >
                          View Full Evidence →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Batch Resume Uploader */}
        <BatchResumeUploader
          onResumesUploaded={handleResumesExtracted}
          disabled={screeningInProgress}
        />

        {/* Run Screening Button if resumes uploaded */}
        {uploadedResumes.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface-alt)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              {uploadedResumes.length} Candidate Resume(s) Ready for AI Screening
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Queue candidates for deterministic AI evaluation against <strong>{job.title}</strong>.
            </p>
            <button
              onClick={handleRunScreening}
              disabled={screeningInProgress}
              className="btn btn-primary"
              style={{ padding: '0.85rem 2rem' }}
            >
              {screeningInProgress ? (
                <>
                  <Loader2 size={16} className="pulse-animation" />
                  <span>Screening Cohort...</span>
                </>
              ) : (
                <span>Register & Screen Candidate Cohort</span>
              )}
            </button>
          </div>
        )}

        {/* Section 3: Screened Candidate Cohort Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Screened Candidate Cohort ({screenings.length})</h2>
              <p style={{ fontSize: '0.875rem' }}>Complete candidate cohort with transparent match scores and workflow controls.</p>
            </div>

            {/* Controls: Sorting and Filtering */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} style={{ color: 'var(--color-olive-drab)' }} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', minWidth: '120px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="REVIEW">Review</option>
                  <option value="NEW">New</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ArrowUpDown size={14} style={{ color: 'var(--color-olive-drab)' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', minWidth: '160px' }}
                >
                  <option value="score_desc">Highest Overall Score</option>
                  <option value="score_asc">Lowest Overall Score</option>
                  <option value="newest">Newest Screened</option>
                  <option value="oldest">Oldest Screened</option>
                  <option value="skills_desc">Highest Skills Coverage</option>
                  <option value="experience_desc">Highest Experience Depth</option>
                  <option value="name_asc">Candidate Name</option>
                </select>
              </div>
            </div>
          </div>

          {screenings.length === 0 ? (
            <EmptyState
              title="No candidate resumes have been screened for this job yet."
              description="Use the uploader above to select multiple PDF/DOCX resumes or drop a ZIP archive to initialize screening."
            />
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-olive-drab)' }}>
              No candidates found matching the selected filter ({filterStatus}).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filtered.map((candidate) => {
                const isCompleted = candidate.status === 'COMPLETED' && candidate.match_result;
                const isProcessing = candidate.status === 'PENDING' || candidate.status === 'ANALYZING' || candidate.status === 'PROCESSING';
                const score = Math.round(candidate.match_result?.overall_score || 0);
                const isShortlisted = candidate.candidate_status === 'SHORTLISTED';

                return (
                  <div
                    key={candidate.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.15rem 1.25rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isShortlisted ? 'rgba(216, 207, 188, 0.15)' : 'var(--bg-surface-alt)',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    {/* Left: Name and Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                      <FileText size={22} style={{ color: 'var(--color-olive-drab)', flexShrink: 0 }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {candidate.resume?.candidate_name || candidate.resume?.filename || `Candidate #${candidate.id}`}
                          </span>
                          {isShortlisted && (
                            <span className="badge badge-dark" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                              Shortlisted
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)', marginTop: '0.2rem' }}>
                          File: {candidate.resume?.filename} • Screened: {formatLocalDate(candidate.created_at)}
                        </div>

                        {/* Component tags if completed */}
                        {isCompleted && (
                          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-olive-drab)' }}>
                            <span>Skills: <strong>{Math.round(candidate.match_result?.component_scores?.skills_score || candidate.match_result?.skill_match || 0)}%</strong></span>
                            <span>•</span>
                            <span>Exp: <strong>{Math.round(candidate.match_result?.component_scores?.experience_score || candidate.match_result?.experience_match || 0)}%</strong></span>
                            <span>•</span>
                            <span>Projects: <strong>{Math.round(candidate.match_result?.component_scores?.projects_score || candidate.match_result?.project_match || 0)}%</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Score or Processing Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      {isCompleted ? (
                        <div style={{ textAlign: 'right', minWidth: '70px' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                            {score}%
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-olive-drab)' }}>
                            Overall Fit
                          </div>
                        </div>
                      ) : isProcessing ? (
                        <div className="badge" style={{ backgroundColor: '#f7f4e9', borderColor: '#dfd8b5', color: '#5c4e16' }}>
                          <Loader2 size={12} className="pulse-animation" /> Evaluating
                        </div>
                      ) : (
                        <div className="badge badge-outline">
                          {candidate.status}
                        </div>
                      )}

                      {/* Status Selector Dropdown */}
                      <select
                        value={candidate.candidate_status}
                        onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                        className="form-select"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem', minWidth: '110px' }}
                        title="Update candidate workflow status"
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEW">REVIEW</option>
                        <option value="SHORTLISTED">SHORTLISTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>

                      {/* Quick Action Button */}
                      <button
                        onClick={() => handleQuickShortlist(candidate.id, candidate.candidate_status)}
                        className={isShortlisted ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                        title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                      >
                        <UserCheck size={14} />
                        <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                      </button>

                      <Link
                        to={`/recruiter/candidates/${candidate.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      >
                        <span>Evidence</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
