from typing import Optional
from pydantic import BaseModel
from app.models.job import JobStatus
from app.schemas.common import UtcDateTime


class JobCreate(BaseModel):
    title: str
    description: str
    status: Optional[JobStatus] = JobStatus.ACTIVE


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    id: int
    recruiter_id: int
    title: str
    description: str
    status: JobStatus
    created_at: UtcDateTime
    updated_at: UtcDateTime
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True
