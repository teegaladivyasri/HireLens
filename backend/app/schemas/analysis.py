from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.analysis import AnalysisStatus
from app.models.candidate_status import CandidateWorkflowStatus
from app.schemas.resume import ResumeResponse
from app.schemas.job import JobResponse
from app.schemas.common import UtcDateTime


class SkillDetail(BaseModel):
    skill: str
    status: str
    evidence: Optional[str] = None
    is_required: bool = True
    importance: Optional[str] = "REQUIRED"


class ComponentScores(BaseModel):
    skills_score: float = 0.0
    experience_score: float = 0.0
    projects_score: float = 0.0
    education_score: float = 0.0
    preferred_skills_score: float = 0.0


class MatchResultResponse(BaseModel):
    overall_score: Optional[float] = None
    skill_match: Optional[float] = None
    experience_match: Optional[float] = None
    education_match: Optional[float] = None
    project_relevance: Optional[float] = None
    component_scores: Optional[Dict[str, float]] = None
    matched_skills: Optional[List[Any]] = None
    missing_skills: Optional[List[Any]] = None
    partial_skills: Optional[List[Any]] = None
    explanation: Optional[str] = None
    recommendations: Optional[List[str]] = None
    created_at: Optional[UtcDateTime] = None

    class Config:
        from_attributes = True


class ShortlistCandidateResponse(BaseModel):
    candidate_rank: int
    rank: Optional[int] = None
    analysis_id: int
    resume_id: int
    candidate_name: str
    filename: Optional[str] = None
    overall_score: float
    skill_match: float
    experience_match: float
    project_relevance: float
    required_skills_coverage: float
    key_matched_skills: List[str] = []
    key_strengths: Optional[List[str]] = None
    critical_missing_requirements: List[str] = []
    critical_missing: Optional[List[str]] = None
    current_status: str
    candidate_status: Optional[str] = None
    explanation: str
    shortlist_rationale: Optional[str] = None
    recommendation_tier: Optional[str] = "Recommended"

    def model_post_init(self, __context: Any) -> None:
        if self.rank is None:
            self.rank = self.candidate_rank
        if self.key_strengths is None:
            self.key_strengths = self.key_matched_skills
        if self.critical_missing is None:
            self.critical_missing = self.critical_missing_requirements
        if self.shortlist_rationale is None:
            self.shortlist_rationale = self.explanation
        if self.candidate_status is None:
            self.candidate_status = self.current_status


class ShortlistRecommendationResponse(BaseModel):
    job_id: int
    total_candidates: int
    total_screened: Optional[int] = None
    total_shortlisted: Optional[int] = None
    completed_candidates: int
    processing_candidates: int
    failed_candidates: int
    recommended_candidates: List[ShortlistCandidateResponse] = []
    shortlisted_candidates: Optional[List[ShortlistCandidateResponse]] = None
    summary_note: str
    summary: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if self.shortlisted_candidates is None:
            self.shortlisted_candidates = self.recommended_candidates
        if self.summary is None:
            self.summary = self.summary_note
        if self.total_screened is None:
            self.total_screened = self.total_candidates
        if self.total_shortlisted is None:
            self.total_shortlisted = len(self.recommended_candidates)


class CandidateAnalysisRequest(BaseModel):
    resume_id: int
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None


class BatchScreeningRequest(BaseModel):
    job_id: int
    resume_ids: List[int]


class CandidateStatusUpdate(BaseModel):
    status: CandidateWorkflowStatus


class AnalysisResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int
    status: AnalysisStatus
    candidate_status: CandidateWorkflowStatus
    created_at: UtcDateTime
    updated_at: UtcDateTime
    match_result: Optional[MatchResultResponse] = None
    resume: Optional[ResumeResponse] = None
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True
