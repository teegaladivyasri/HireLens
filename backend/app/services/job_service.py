from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse


class JobService:
    """Job posting management service for recruiters."""

    @staticmethod
    def create_job(db: Session, recruiter_id: int, job_in: JobCreate) -> Job:
        job = Job(
            recruiter_id=recruiter_id,
            title=job_in.title.strip(),
            description=job_in.description.strip(),
            status=job_in.status or JobStatus.ACTIVE,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def get_recruiter_jobs(db: Session, recruiter_id: int) -> List[Job]:
        return db.query(Job).filter(Job.recruiter_id == recruiter_id).order_by(Job.created_at.desc()).all()

    @staticmethod
    def get_job_by_id(db: Session, job_id: int, recruiter_id: Optional[int] = None) -> Job:
        query = db.query(Job).filter(Job.id == job_id)
        if recruiter_id is not None:
            query = query.filter(Job.recruiter_id == recruiter_id)
        job = query.first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found.",
            )
        return job

    @staticmethod
    def update_job(db: Session, job_id: int, recruiter_id: int, job_update: JobUpdate) -> Job:
        job = JobService.get_job_by_id(db, job_id, recruiter_id=recruiter_id)
        if job_update.title is not None:
            job.title = job_update.title.strip()
        if job_update.description is not None:
            job.description = job_update.description.strip()
        if job_update.status is not None:
            job.status = job_update.status
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def delete_job(db: Session, job_id: int, recruiter_id: int) -> None:
        job = JobService.get_job_by_id(db, job_id, recruiter_id=recruiter_id)
        db.delete(job)
        db.commit()
