from typing import Optional
from pydantic import BaseModel
from app.schemas.common import UtcDateTime


class ResumeResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    filename: str
    file_size: int
    mime_type: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    created_at: UtcDateTime

    class Config:
        from_attributes = True


class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    message: str
