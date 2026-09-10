import React, { useState } from 'react';
import { Upload, Archive, Files, FileText, CheckCircle2, AlertCircle, X, Loader2, Plus } from 'lucide-react';
import { resumeService } from '../../services/resumeService';

export const BatchResumeUploader = ({ onResumesUploaded, disabled = false }) => {
  const [activeMethod, setActiveMethod] = useState('multi'); // 'multi' | 'zip'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedResumes, setUploadedResumes] = useState([]);

  const handleMultiFilesSelect = (e) => {
    setErrorMessage('');
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    const validExtensions = ['.pdf', '.docx'];
    const invalidFiles = newFiles.filter(
      (f) => !validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (invalidFiles.length > 0) {
      setStatus('error');
      setErrorMessage(`${invalidFiles.length} file(s) are not valid PDF or DOCX documents.`);
      return;
    }

    // Cumulative selection: append new files without duplicates (by name and size)
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const additions = newFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
      return [...prev, ...additions];
    });

    e.target.value = '';
    setStatus('idle');
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleZipSelect = (e) => {
    setErrorMessage('');
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setStatus('error');
      setErrorMessage('Please select a valid .ZIP archive file.');
      return;
    }

    setZipFile(file);
    setStatus('idle');
  };

  const handleUpload = async () => {
    setErrorMessage('');
    setStatus('uploading');

    try {
      let results = [];
      if (activeMethod === 'multi') {
        if (selectedFiles.length === 0) return;
        results = await resumeService.uploadBatchResumes(selectedFiles);
      } else {
        if (!zipFile) return;
        results = await resumeService.uploadZipResumes(zipFile);
      }

      setUploadedResumes(results);
      setStatus('success');
      if (onResumesUploaded) {
        onResumesUploaded(results);
      }
    } catch (err) {
      setStatus('error');
      const msg = err.response?.data?.detail || 'Failed to process resume batch. Please ensure valid PDF/DOCX files.';
      setErrorMessage(msg);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setZipFile(null);
    setUploadedResumes([]);
    setStatus('idle');
    setErrorMessage('');
    if (onResumesUploaded) {
      onResumesUploaded([]);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Batch Resume Ingestion</h3>
          <p style={{ fontSize: '0.875rem' }}>Upload multiple candidate resumes for screening against this job posting.</p>
        </div>
        <div className="tabs-header" style={{ margin: 0, border: 'none' }}>
          <button
            type="button"
            className={`tab-btn ${activeMethod === 'multi' ? 'active' : ''}`}
            onClick={() => {
              setActiveMethod('multi');
              handleReset();
            }}
          >
            Multiple Files
          </button>
          <button
            type="button"
            className={`tab-btn ${activeMethod === 'zip' ? 'active' : ''}`}
            onClick={() => {
              setActiveMethod('zip');
              handleReset();
            }}
          >
            ZIP Archive
          </button>
        </div>
      </div>

      {status !== 'success' && (
        <>
          {activeMethod === 'multi' ? (
            <div>
              <div
                className="dropzone"
                onClick={() => !disabled && document.getElementById('multi-resume-input').click()}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <input
                  id="multi-resume-input"
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  disabled={disabled}
                  onChange={handleMultiFilesSelect}
                />
                <Files size={36} className="state-box-icon" />
                <div style={{ fontWeight: 600, color: 'var(--color-smoky-black)' }}>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} resume file(s) selected — click or drop to add more`
                    : 'Select multiple PDF/DOCX resumes simultaneously'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-olive-drab)' }}>
                  Hold Shift or Ctrl to select files, or add files in multiple rounds (duplicates prevented)
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Selected Documents ({selectedFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => document.getElementById('multi-resume-input').click()}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Plus size={13} />
                      <span>Add More Resumes</span>
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '1rem',
                    backgroundColor: 'var(--bg-surface-alt)',
                  }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0',
                        fontSize: '0.85rem',
                        borderBottom: idx < selectedFiles.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          <FileText size={16} style={{ color: 'var(--color-olive-drab)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                          <span style={{ color: 'var(--color-olive-drab)', fontSize: '0.775rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-olive-drab)',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={`Remove ${file.name}`}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleUpload}
                  >
                    Ingest & Extract {selectedFiles.length} Resume Document{selectedFiles.length === 1 ? '' : 's'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div
                className="dropzone"
                onClick={() => !disabled && document.getElementById('zip-resume-input').click()}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <input
                  id="zip-resume-input"
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  style={{ display: 'none' }}
                  disabled={disabled}
                  onChange={handleZipSelect}
                />
                <Archive size={36} className="state-box-icon" />
                <div style={{ fontWeight: 600, color: 'var(--color-smoky-black)' }}>
                  {zipFile ? zipFile.name : 'Upload a ZIP archive containing candidate resumes'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-olive-drab)' }}>
                  Archive must contain PDF or DOCX files (Max 100MB uncompressed)
                </div>
              </div>

              {zipFile && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-alt)',
                    marginBottom: '1rem',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{zipFile.name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--color-olive-drab)' }}>
                        {(zipFile.size / 1024 / 1024).toFixed(2)} MB ZIP Archive
                      </div>
                    </div>
                    <button type="button" onClick={handleReset} className="btn btn-outline" style={{ padding: '0.35rem 0.55rem' }}>
                      <X size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleUpload}
                  >
                    Safely Unpack & Extract Resumes from ZIP
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface-alt)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.925rem',
          fontWeight: 500,
          marginTop: '1rem',
        }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Processing candidate cohort documents securely...</span>
        </div>
      )}

      {status === 'success' && uploadedResumes.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            border: '1px solid var(--color-smoky-black)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-alt)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} />
              <div>
                <div style={{ fontWeight: 600 }}>{uploadedResumes.length} candidate resumes extracted</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-olive-drab)' }}>
                  Ready for job description screening alignment
                </div>
              </div>
            </div>
            <button type="button" onClick={handleReset} className="btn btn-outline" style={{ fontSize: '0.825rem', padding: '0.4rem 0.75rem' }}>
              Upload Another Batch
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginTop: '1rem',
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
