import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeUploader } from '../../components/seeker/ResumeUploader';
import { JobDescriptionInput } from '../../components/common/JobDescriptionInput';
import { analysisService } from '../../services/analysisService';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const ResumeAnalysisPage = () => {
  const navigate = useNavigate();

  const [uploadedResume, setUploadedResume] = useState(null);
  const [jdData, setJdData] = useState({ mode: 'text', text: '', file: null });
  const [jobTitle, setJobTitle] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = uploadedResume && (
    (jdData.mode === 'text' && jdData.text.trim().length > 20) ||
    (jdData.mode === 'upload' && jdData.file !== null)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setSubmitting(true);

    try {
      let analysisResult;
      if (jdData.mode === 'upload') {
        analysisResult = await analysisService.startCandidateAnalysisWithJdFile(
          uploadedResume.id,
          jobTitle || 'Target Role Analysis',
          jdData.file
        );
      } else {
        analysisResult = await analysisService.startCandidateAnalysis({
          resume_id: uploadedResume.id,
          job_title: jobTitle || 'Target Role Analysis',
          job_description: jdData.text.trim(),
        });
      }

      // Navigate to results page
      navigate(`/candidate/results/${analysisResult.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit analysis. Please verify your inputs and try again.';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '860px' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <span className="badge" style={{ marginBottom: '0.5rem' }}>Step-by-Step Fit Evaluation</span>
          <h1>Analyze Job Fit</h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
            Pair your resume with a specific job description to evaluate qualification alignment, identify skill matches, and explore targeted resume enhancements.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginBottom: '1.5rem',
            padding: '0.85rem 1.25rem',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            color: 'var(--color-smoky-black)',
            backgroundColor: 'var(--bg-surface-alt)',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Resume Upload Component */}
          <ResumeUploader
            onResumeUploaded={(resume) => setUploadedResume(resume)}
            disabled={submitting}
          />

          {/* 2. Reusable Job Description Component */}
          <JobDescriptionInput
            value={jdData.text}
            onChange={(data) => setJdData(data)}
            titleValue={jobTitle}
            onTitleChange={(title) => setJobTitle(title)}
            showTitleField={true}
            required={true}
          />

          {/* Submission action */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="btn btn-primary"
              style={{ padding: '0.95rem 2.5rem', fontSize: '1rem' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Initiating Analysis Request...</span>
                </>
              ) : (
                <>
                  <span>Run Fit Analysis</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {!canSubmit && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--color-olive-drab)' }}>
                Please upload your resume and supply the job description to continue.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
