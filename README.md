# HireLens

**HireLens** is an AI-powered Resume Screening & Job Matching Platform built with a **React** frontend and a **FastAPI** backend. It provides tailored experiences for two distinct user roles:

1. **Job Seeker**: Upload resumes and job descriptions (via PDF/DOCX or text paste) to receive explainable alignment feedback, missing skills, and improvement suggestions.
2. **Recruiter**: Create job postings and screen batches of candidate resumes (via multi-file selection or ZIP archive) with explainable qualification rankings to assist human decision-making.

---

## Architecture Overview

```
HireLens/
├── frontend/               # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/     # Reusable UI, Seeker, and Recruiter components
│   │   ├── context/        # Auth and role state context
│   │   ├── pages/          # Public, Candidate, and Recruiter views
│   │   ├── services/       # API client & resource services
│   │   └── styles/         # Strict HireLens design system (Vanilla CSS)
└── backend/                # FastAPI Application (Python 3.11+)
    └── app/
        ├── api/v1/         # Versioned REST endpoints
        ├── core/           # Configuration, database session, JWT security
        ├── models/         # SQLAlchemy ORM models (PostgreSQL-ready)
        ├── schemas/        # Pydantic validation schemas
        ├── services/       # Business logic layer
        ├── document_processing/ # PDF, DOCX, and secure ZIP handlers
        └── ai_matching/    # Matching engine & scoring interface contracts
```

---

## Design Identity & Color Palette

HireLens adheres to a strict four-color editorial palette:
- **Smoky Black**: `#11120D`
- **Olive Drab**: `#565449`
- **Bone**: `#D8CFBC`
- **Floral White**: `#FFFBF4`

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Backend health check: `http://localhost:8000/api/v1/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend URL: `http://localhost:5173`
