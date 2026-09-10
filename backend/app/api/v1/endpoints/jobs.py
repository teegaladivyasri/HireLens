from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.services.job_service import JobService
from app.document_processing.extractor import DocumentExtractor
from app.api.v1.dependencies import get_current_user, require_recruiter

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Create a new job posting with raw text JD (Recruiter only)."""
    job = JobService.create_job(db, recruiter_id=current_user.id, job_in=job_in)
    return job


@router.post("/from-document", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job_from_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Create a job posting by extracting text from an uploaded PDF or DOCX Job Description (Recruiter only)."""
    content = file.file.read()
    extracted_jd = DocumentExtractor.extract_text_from_file(file.filename, content)
    job_in = JobCreate(title=title, description=extracted_jd)
    job = JobService.create_job(db, recruiter_id=current_user.id, job_in=job_in)
    return job


@router.get("/", response_model=List[JobResponse])
def get_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List jobs. If recruiter, returns their created jobs; if seeker, returns active jobs."""
    if current_user.role.value == "RECRUITER":
        jobs = JobService.get_recruiter_jobs(db, recruiter_id=current_user.id)
    else:
        jobs = db.query(JobService.get_recruiter_jobs(db, None)).all() if False else []
        from app.models.job import Job, JobStatus
        jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).order_by(Job.created_at.desc()).all()
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single job posting details with role-aware authorization."""
    recruiter_id = current_user.id if current_user.role.value == "RECRUITER" else None
    return JobService.get_job_by_id(db, job_id=job_id, recruiter_id=recruiter_id)


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Update job posting details (Recruiter only)."""
    return JobService.update_job(db, job_id=job_id, recruiter_id=current_user.id, job_update=job_update)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Delete a job posting (Recruiter only)."""
    JobService.delete_job(db, job_id=job_id, recruiter_id=current_user.id)
    return None
