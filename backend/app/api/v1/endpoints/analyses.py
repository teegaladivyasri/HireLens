from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.job import Job, JobStatus
from app.schemas.analysis import (
    CandidateAnalysisRequest,
    BatchScreeningRequest,
    AnalysisResponse,
    CandidateStatusUpdate,
    ShortlistRecommendationResponse,
)
from app.services.analysis_service import AnalysisService
from app.services.job_service import JobService
from app.document_processing.extractor import DocumentExtractor
from app.api.v1.dependencies import get_current_user, require_job_seeker, require_recruiter

router = APIRouter(prefix="/analyses", tags=["Analyses"])


@router.post("/candidate", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def start_candidate_analysis(
    request: CandidateAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_job_seeker),
    db: Session = Depends(get_db),
):
    """
    Start analysis for a job seeker.
    Accepts either an existing job_id or a pasted job description (which creates an ad-hoc job context).
    """
    job_id = request.job_id
    if not job_id:
        if not request.job_description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either a job_id or a job_description text must be provided.",
            )
        # Create an ad-hoc job record for this comparison
        job = Job(
            recruiter_id=current_user.id,
            title=request.job_title or "Direct JD Comparison",
            description=request.job_description,
            status=JobStatus.ACTIVE,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        job_id = job.id

    analysis = AnalysisService.create_candidate_analysis(
        db=db,
        user_id=current_user.id,
        resume_id=request.resume_id,
        job_id=job_id,
    )
    # Trigger AI processing in background
    background_tasks.add_task(AnalysisService.process_analysis, analysis.id)
    return analysis


@router.post("/candidate/with-jd-file", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def start_candidate_analysis_with_jd_file(
    background_tasks: BackgroundTasks,
    resume_id: int = Form(...),
    job_title: Optional[str] = Form(None),
    jd_file: UploadFile = File(...),
    current_user: User = Depends(require_job_seeker),
    db: Session = Depends(get_db),
):
    """Start candidate analysis by uploading a PDF or DOCX Job Description document."""
    file_bytes = jd_file.file.read()
    extracted_jd = DocumentExtractor.extract_text_from_file(jd_file.filename, file_bytes)

    job = Job(
        recruiter_id=current_user.id,
        title=job_title or jd_file.filename or "Uploaded JD Comparison",
        description=extracted_jd,
        status=JobStatus.ACTIVE,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    analysis = AnalysisService.create_candidate_analysis(
        db=db,
        user_id=current_user.id,
        resume_id=resume_id,
        job_id=job.id,
    )
    # Trigger AI processing in background
    background_tasks.add_task(AnalysisService.process_analysis, analysis.id)
    return analysis


@router.post("/screen-batch", response_model=List[AnalysisResponse], status_code=status.HTTP_201_CREATED)
def screen_batch_resumes(
    request: BatchScreeningRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Screen multiple candidate resumes against a recruiter job."""
    # Ensure recruiter owns this job
    JobService.get_job_by_id(db, job_id=request.job_id, recruiter_id=current_user.id)
    analyses = AnalysisService.create_batch_screening(
        db=db,
        job_id=request.job_id,
        resume_ids=request.resume_ids,
    )
    # Trigger AI processing independently for each candidate
    for a in analyses:
        background_tasks.add_task(AnalysisService.process_analysis, a.id)

    return analyses


@router.get("/candidate/history", response_model=List[AnalysisResponse])
def get_candidate_history(
    current_user: User = Depends(require_job_seeker),
    db: Session = Depends(get_db),
):
    """Retrieve all past analyses for current job seeker."""
    return AnalysisService.get_candidate_analyses(db, current_user.id)


@router.get("/job/{job_id}", response_model=List[AnalysisResponse])
def get_job_screenings(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Retrieve all candidate analyses screened for a job."""
    JobService.get_job_by_id(db, job_id=job_id, recruiter_id=current_user.id)
    return AnalysisService.get_job_screenings(db, job_id=job_id)


@router.get("/job/{job_id}/shortlist", response_model=ShortlistRecommendationResponse)
def get_job_shortlist(
    job_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Generate explainable shortlist recommendations for a recruiter's job (Recruiter only)."""
    return AnalysisService.get_job_shortlist(db=db, job_id=job_id, recruiter_id=current_user.id)



@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_detail(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve analysis detail and match results with strict role data isolation."""
    analysis = AnalysisService.get_analysis_by_id(db, analysis_id)
    # Check authorization
    if current_user.role.value == "JOB_SEEKER":
        if analysis.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this analysis.")
    elif current_user.role.value == "RECRUITER":
        if not analysis.job or analysis.job.recruiter_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this candidate analysis.")
    return analysis


@router.patch("/{analysis_id}/status", response_model=AnalysisResponse)
def update_candidate_status(
    analysis_id: int,
    status_update: CandidateStatusUpdate,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Update candidate workflow status (NEW, REVIEW, SHORTLISTED, REJECTED) for a screened resume."""
    analysis = AnalysisService.get_analysis_by_id(db, analysis_id)
    # Ensure job belongs to recruiter
    JobService.get_job_by_id(db, job_id=analysis.job_id, recruiter_id=current_user.id)
    updated = AnalysisService.update_candidate_workflow_status(
        db=db,
        analysis_id=analysis_id,
        new_status=status_update.status,
    )
    return updated
