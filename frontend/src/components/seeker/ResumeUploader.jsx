import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { resumeService } from '../../services/resumeService';

export const ResumeUploader = ({ onResumeUploaded, disabled = false }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedResume, setUploadedResume] = useState(null);

  const validateAndSelectFile = (file) => {
    setErrorMessage('');
    if (!file) return;

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setStatus('error');
      setErrorMessage('Please upload a valid PDF or DOCX file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setStatus('error');
      setErrorMessage('File exceeds maximum allowed size of 25MB.');
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || status === 'uploading') return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setStatus('uploading');
      setErrorMessage('');
      const result = await resumeService.uploadResume(selectedFile);
      setUploadedResume(result);
      setStatus('success');
      if (onResumeUploaded) {
        onResumeUploaded(result);
      }
    } catch (err) {
      setStatus('error');
      const msg = err.response?.data?.detail || 'Failed to process and upload resume. Please try again.';
      setErrorMessage(msg);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadedResume(null);
    setStatus('idle');
    setErrorMessage('');
    if (onResumeUploaded) {
      onResumeUploaded(null);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <h3 style={{ fontSize: '1.15rem' }}>Your Resume</h3>
        <p style={{ fontSize: '0.875rem' }}>Upload your latest resume in PDF or DOCX format for qualification analysis.</p>
      </div>

      {!selectedFile && status !== 'success' && (
        <div
          className={`dropzone ${dragOver ? 'active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && document.getElementById('candidate-resume-input').click()}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
          <input
            id="candidate-resume-input"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            disabled={disabled}
            onChange={(e) => e.target.files && validateAndSelectFile(e.target.files[0])}
          />
          <Upload size={36} className="state-box-icon" />
          <div style={{ fontWeight: 600, color: 'var(--color-smoky-black)' }}>
            Click to choose a resume or drag and drop here
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--color-olive-drab)' }}>
            Supported formats: PDF or DOCX (Max 25MB)
          </div>
        </div>
      )}

      {selectedFile && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-alt)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={24} style={{ color: 'var(--color-olive-drab)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            {status !== 'uploading' && (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.6rem' }}
                title="Remove resume"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {status === 'idle' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              style={{ width: '100%' }}
            >
              Confirm & Extract Resume Document
            </button>
          )}

          {status === 'uploading' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.85rem',
              backgroundColor: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.925rem',
              fontWeight: 500,
            }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Extracting resume content safely...</span>
            </div>
          )}

          {status === 'success' && uploadedResume && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              border: '1px solid var(--color-smoky-black)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-alt)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              <CheckCircle2 size={18} />
              <span>Resume uploaded and text extracted successfully (ID #{uploadedResume.id})</span>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginTop: '0.85rem',
          padding: '0.75rem 1rem',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          color: 'var(--color-smoky-black)',
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
