import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.candidate_status import CandidateWorkflowStatus


class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    ANALYZING = "ANALYZING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING, nullable=False)
    candidate_status = Column(
        Enum(CandidateWorkflowStatus),
        default=CandidateWorkflowStatus.NEW,
        nullable=False,
    )
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    job = relationship("Job", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    match_result = relationship("MatchResult", back_populates="analysis", uselist=False, cascade="all, delete-orphan")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_score = Column(Float, nullable=True)
    skill_match = Column(Float, nullable=True)
    experience_match = Column(Float, nullable=True)
    education_match = Column(Float, nullable=True)
    project_relevance = Column(Float, nullable=True)
    component_scores = Column(JSON, nullable=True)
    matched_skills = Column(JSON, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    partial_skills = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="match_result")
