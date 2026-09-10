import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const JobDescriptionInput = ({
  value,
  onChange,
  showTitleField = true,
  titleValue = '',
  onTitleChange,
  required = true,
}) => {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'upload'
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const handleTextChange = (e) => {
    onChange({
      mode: 'text',
      text: e.target.value,
      file: null,
    });
  };

  const validateAndSetFile = (file) => {
    setFileError('');
    if (!file) return;

    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setFileError('Please select a valid PDF or DOCX file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds maximum limit of 25MB.');
      return;
    }

    setSelectedFile(file);
    onChange({
      mode: 'upload',
      text: '',
      file: file,
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError('');
    onChange({
      mode: 'upload',
      text: '',
      file: null,
    });
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Job Description</h3>
          <p style={{ fontSize: '0.875rem' }}>Provide the target job requirements to compare against.</p>
        </div>
        <div className="tabs-header" style={{ margin: 0, border: 'none' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('text');
              onChange({ mode: 'text', text: value || '', file: null });
            }}
          >
            Paste Text
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('upload');
              onChange({ mode: 'upload', text: '', file: selectedFile });
            }}
          >
            Upload Document
          </button>
        </div>
      </div>

      {showTitleField && (
        <div className="form-group">
          <label className="form-label">Job Title or Target Role</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Senior Backend Engineer, Product Designer"
            value={titleValue}
            onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
          />
        </div>
      )}

      {activeTab === 'text' ? (
        <div className="form-group">
          <label className="form-label">Job Description Text</label>
          <textarea
            className="form-textarea"
            rows={8}
            placeholder="Paste the full job description here, including responsibilities, requirements, and qualifications..."
            value={value || ''}
            onChange={handleTextChange}
            required={required}
          />
        </div>
      ) : (
        <div>
          {!selectedFile ? (
            <div
              className={`dropzone ${dragOver ? 'active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('jd-file-input').click()}
            >
              <input
                id="jd-file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
              />
              <Upload size={32} className="state-box-icon" />
              <div style={{ fontWeight: 600, color: 'var(--color-smoky-black)' }}>
                Drop Job Description file here or click to browse
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-olive-drab)' }}>
                Supported formats: PDF, DOCX (Max 25MB)
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-alt)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={22} style={{ color: 'var(--color-olive-drab)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--color-olive-drab)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.6rem' }}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {fileError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--color-smoky-black)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
