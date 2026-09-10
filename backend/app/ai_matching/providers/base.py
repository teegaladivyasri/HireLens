from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any
from app.ai_matching.interfaces import ExtractedResumeData, ExtractedJobData


class BaseAIProvider(ABC):
    """Abstract interface for AI/LLM providers handling structured information extraction and explanation generation."""

    @abstractmethod
    def extract_resume(self, resume_text: str) -> ExtractedResumeData:
        """Extract structured qualifications from raw resume text."""
        pass

    @abstractmethod
    def extract_job(self, jd_text: str) -> ExtractedJobData:
        """Extract structured requirements from raw job description text."""
        pass

    @abstractmethod
    def generate_explanation(
        self,
        resume_data: ExtractedResumeData,
        job_data: ExtractedJobData,
        overall_score: float,
        matched_skills: List[str],
        missing_skills: List[str],
        partial_skills: List[str],
        critical_missing: List[str],
    ) -> Tuple[str, List[str]]:
        """
        Generate explainable rationale and constructive recommendations based on actual evidence.
        Returns (explanation_text, recommendations_list).
        """
        pass
