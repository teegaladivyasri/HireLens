import enum
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator


class MatchStatus(str, enum.Enum):
    MATCHED = "MATCHED"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class RequirementCategory(str, enum.Enum):
    TECHNICAL_SKILLS = "Technical Skills"
    TOOLS_TECHNOLOGIES = "Tools & Technologies"
    EXPERIENCE = "Experience"
    EDUCATION = "Education"
    CERTIFICATIONS = "Certifications"
    PROJECTS = "Projects / Domain Experience"
    RESPONSIBILITIES = "Responsibilities / Competencies"


class SkillMatchItem(BaseModel):
    skill: str
    status: MatchStatus
    evidence: Optional[str] = None
    category: Optional[str] = None
    is_required: bool = True
    importance: str = "REQUIRED"  # "REQUIRED" or "PREFERRED"


class WorkExperienceItem(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    years: Optional[float] = None
    responsibilities: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    title: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    relevance_notes: Optional[str] = None


class EducationItem(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None


class ExtractedResumeData(BaseModel):
    raw_text: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    personal_summary: Optional[str] = None
    technical_skills: List[str] = Field(default_factory=list)
    tools_and_technologies: List[str] = Field(default_factory=list)
    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    cloud_technologies: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    work_experience: List[WorkExperienceItem] = Field(default_factory=list)
    internships: List[WorkExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    total_experience_years: Optional[float] = 0.0

    @field_validator("total_experience_years", mode="before")
    @classmethod
    def default_experience_to_zero(cls, v):
        if v is None:
            return 0.0
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0

    def all_skills(self) -> List[str]:
        """Aggregate all extracted skills with duplicates removed."""
        all_s = (
            self.technical_skills
            + self.tools_and_technologies
            + self.programming_languages
            + self.frameworks
            + self.databases
            + self.cloud_technologies
        )
        seen = set()
        unique = []
        for s in all_s:
            s_clean = s.strip()
            if s_clean and s_clean.lower() not in seen:
                seen.add(s_clean.lower())
                unique.append(s_clean)
        return unique


class ExtractedJobData(BaseModel):
    raw_text: str
    job_title: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    cloud_technologies: List[str] = Field(default_factory=list)
    required_experience_years: Optional[float] = None
    preferred_experience_years: Optional[float] = None
    education_requirements: Optional[str] = None
    certifications: List[str] = Field(default_factory=list)
    key_responsibilities: List[str] = Field(default_factory=list)
    domain_requirements: List[str] = Field(default_factory=list)


class EvaluationResult(BaseModel):
    overall_score: float
    skill_match_score: float
    experience_match_score: float
    education_match_score: float
    project_relevance_score: float
    preferred_score: float
    required_skills_coverage: float
    component_scores: Dict[str, float] = Field(default_factory=dict)
    matched_skills: List[SkillMatchItem] = Field(default_factory=list)
    missing_skills: List[SkillMatchItem] = Field(default_factory=list)
    partial_skills: List[SkillMatchItem] = Field(default_factory=list)
    critical_missing_requirements: List[str] = Field(default_factory=list)
    score_explanation: str
    improvement_recommendations: List[str] = Field(default_factory=list)


class ShortlistCandidate(BaseModel):
    candidate_rank: int
    analysis_id: int
    resume_id: int
    candidate_name: str
    filename: Optional[str] = None
    overall_score: float
    skill_match: float
    experience_match: float
    project_relevance: float
    required_skills_coverage: float
    key_matched_skills: List[str] = Field(default_factory=list)
    critical_missing_requirements: List[str] = Field(default_factory=list)
    current_status: str  # NEW, REVIEW, SHORTLISTED, REJECTED
    explanation: str


class ShortlistRecommendation(BaseModel):
    job_id: int
    total_candidates: int
    completed_candidates: int
    processing_candidates: int
    failed_candidates: int
    recommended_candidates: List[ShortlistCandidate] = Field(default_factory=list)
    summary_note: str


class IResumeParser(ABC):
    @abstractmethod
    def extract_information(self, resume_text: str) -> ExtractedResumeData:
        pass


class IJobParser(ABC):
    @abstractmethod
    def extract_requirements(self, jd_text: str) -> ExtractedJobData:
        pass


class IMatchingScorer(ABC):
    @abstractmethod
    def evaluate(
        self,
        resume_data: ExtractedResumeData,
        job_data: ExtractedJobData,
    ) -> EvaluationResult:
        pass


class IMatchingEngine(ABC):
    @abstractmethod
    def match(self, resume_text: str, jd_text: str) -> EvaluationResult:
        pass
