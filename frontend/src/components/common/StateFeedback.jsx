import React from 'react';
import { Inbox, AlertCircle, Loader2 } from 'lucide-react';

export const EmptyState = ({ title, description, action }) => {
  return (
    <div className="state-box">
      <Inbox size={36} className="state-box-icon" />
      <div className="state-box-title">{title}</div>
      {description && <p className="state-box-desc">{description}</p>}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  );
};

export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="state-box">
      <Loader2 size={32} className="state-box-icon" style={{ animation: 'spin 1s linear infinite' }} />
      <div className="state-box-title" style={{ fontSize: '1.1rem' }}>{message}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export const ErrorState = ({ title = 'An error occurred', message, onRetry }) => {
  return (
    <div className="state-box" style={{ borderColor: 'var(--border-strong)' }}>
      <AlertCircle size={32} className="state-box-icon" />
      <div className="state-box-title" style={{ fontSize: '1.15rem' }}>{title}</div>
      {message && <p className="state-box-desc">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
          Try Again
        </button>
      )}
    </div>
  );
};
