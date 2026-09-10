from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeUploadResponse
from app.services.resume_service import ResumeService
from app.api.v1.dependencies import get_current_user, require_recruiter

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a single resume file (PDF or DOCX). Linked to current user if Job Seeker."""
    content = file.file.read()
    user_id = current_user.id if current_user.role.value == "JOB_SEEKER" else None
    resume = ResumeService.save_resume_file(
        db=db,
        filename=file.filename,
        file_bytes=content,
        user_id=user_id,
    )
    return resume


@router.post("/upload-batch", response_model=List[ResumeResponse], status_code=status.HTTP_201_CREATED)
def upload_batch_resumes(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Upload multiple PDF/DOCX resumes simultaneously (Recruiter only)."""
    resumes = ResumeService.process_bulk_resumes(db=db, files=files)
    return resumes


@router.post("/upload-zip", response_model=List[ResumeResponse], status_code=status.HTTP_201_CREATED)
def upload_zip_resumes(
    file: UploadFile = File(...),
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Upload a ZIP archive containing multiple PDF/DOCX resumes (Recruiter only)."""
    resumes = ResumeService.process_zip_upload(db=db, zip_file=file)
    return resumes


@router.get("/my", response_model=List[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve resumes uploaded by the current user."""
    return ResumeService.get_user_resumes(db, current_user.id)


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get metadata for a specific resume with ownership authorization."""
    resume = ResumeService.get_resume_by_id(db, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    # Check ownership
    if current_user.role.value == "JOB_SEEKER":
        if resume.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this resume.")
    elif current_user.role.value == "RECRUITER":
        # Ensure resume has been screened for a job owned by this recruiter
        from app.models.analysis import Analysis
        from app.models.job import Job
        has_access = (
            db.query(Analysis)
            .join(Job, Analysis.job_id == Job.id)
            .filter(Analysis.resume_id == resume_id, Job.recruiter_id == current_user.id)
            .first()
        )
        if not has_access and resume.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this candidate resume.")

    return resume
