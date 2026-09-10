import React from 'react';
import { Shield, FileCheck, Users, Eye, CheckCircle2 } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span className="badge" style={{ marginBottom: '0.75rem' }}>Philosophy & Architecture</span>
          <h1 style={{ marginBottom: '1rem' }}>About HireLens</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-olive-drab)' }}>
            Empowering job seekers with actionable fit diagnostics and assisting recruiters with explainable cohort screening.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>The Mission</h2>
          <p style={{ marginBottom: '1rem' }}>
            Hiring processes are plagued by opacity. Job applicants frequently submit dozens of applications into automated systems,
            only to receive generic rejections with no indication of where their qualifications diverged from job expectations.
            Simultaneously, hiring teams and recruiters are inundated with hundreds of applications and forced to rely on rudimentary
            keyword filters that inadvertently filter out qualified candidates.
          </p>
          <p>
            HireLens was founded to dismantle this opacity. By extracting structured qualifications and comparing them against
            actual requirements with clear, explainable rationale, we turn the hiring pipeline into a transparent dialogue.
          </p>
        </div>

        <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Eye size={20} style={{ color: 'var(--color-smoky-black)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Explainability First</h3>
            </div>
            <p style={{ fontSize: '0.925rem' }}>
              We reject arbitrary percentage numbers that lack explanatory context. Every alignment metric is backed by specific evidence:
              identified skills, missing requirements, and relevant project experience.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Users size={20} style={{ color: 'var(--color-smoky-black)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Human-in-the-Loop</h3>
            </div>
            <p style={{ fontSize: '0.925rem' }}>
              HireLens is an assistive tool for recruiters, never an autonomous decision-maker. Recruiters manually review, evaluate,
              and assign candidate workflow statuses (Review, Shortlisted, or Archived).
            </p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Architecture & Security Safeguards</h2>
          <p style={{ marginBottom: '1.25rem', fontSize: '0.95rem' }}>
            Document processing in HireLens adheres to strict technical standards to ensure safety and data integrity:
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.925rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-smoky-black)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Path Traversal Defense:</strong> ZIP archive extractions enforce canonical path validation, preventing directory traversal vulnerabilities.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-smoky-black)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Safe Document Isolation:</strong> Uploaded resumes and job descriptions are stored securely with generated UUID references rather than exposing original file paths.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-smoky-black)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Stateless & Scalable:</strong> Modular FastAPI architecture with PostgreSQL schema readiness and JWT tokenized sessions.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
