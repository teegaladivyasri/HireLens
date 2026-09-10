import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Job Seeker Pages
import { SeekerDashboardPage } from './pages/seeker/SeekerDashboardPage';
import { ResumeAnalysisPage } from './pages/seeker/ResumeAnalysisPage';
import { AnalysisResultsPage } from './pages/seeker/AnalysisResultsPage';
import { AnalysisHistoryPage } from './pages/seeker/AnalysisHistoryPage';

// Recruiter Pages
import { RecruiterDashboardPage } from './pages/recruiter/RecruiterDashboardPage';
import { JobPostingsPage } from './pages/recruiter/JobPostingsPage';
import { CandidateScreeningPage } from './pages/recruiter/CandidateScreeningPage';
import { CandidateDetailPage } from './pages/recruiter/CandidateDetailPage';

export const App = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Candidate Protected Routes */}
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['JOB_SEEKER']}>
                <SeekerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/analyze"
            element={
              <ProtectedRoute allowedRoles={['JOB_SEEKER']}>
                <ResumeAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/results/:id"
            element={
              <ProtectedRoute allowedRoles={['JOB_SEEKER', 'RECRUITER']}>
                <AnalysisResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/history"
            element={
              <ProtectedRoute allowedRoles={['JOB_SEEKER']}>
                <AnalysisHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Protected Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <JobPostingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/screen"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CandidateScreeningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/candidates/:id"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CandidateDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
