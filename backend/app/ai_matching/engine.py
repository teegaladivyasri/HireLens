from typing import Optional
from app.ai_matching.interfaces import (
    IMatchingEngine,
    EvaluationResult,
    ExtractedResumeData,
    ExtractedJobData,
)
from app.ai_matching.providers.base import BaseAIProvider
from app.ai_matching.providers.factory import get_ai_provider
from app.ai_matching.scorer import MatchingScorer


class MatchingEngine(IMatchingEngine):
    """
    Main orchestrator for the HireLens AI Resume Screening & Job Matching pipeline.
    Pipeline:
    Resume Text -> AI Extraction -> JD Extraction -> Semantic Matching ->
    Deterministic Weighted Scoring -> Explainable Diagnostics & Recommendations.
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None, scorer: Optional[MatchingScorer] = None):
        self.provider = provider or get_ai_provider()
        self.scorer = scorer or MatchingScorer()

    def match(self, resume_text: str, jd_text: str) -> EvaluationResult:
        if not resume_text or not resume_text.strip():
            raise ValueError("Resume document text is empty. Cannot perform analysis.")

        if not jd_text or not jd_text.strip():
            raise ValueError("Job description text is empty. Cannot perform analysis.")

        # 1. Structured extraction from actual documents
        resume_data: ExtractedResumeData = self.provider.extract_resume(resume_text)
        job_data: ExtractedJobData = self.provider.extract_job(jd_text)

        # 2. Transparent weighted scoring and evidence matching
        eval_result: EvaluationResult = self.scorer.evaluate(resume_data, job_data)

        # 3. Explainable diagnostics and ethical recommendations
        matched_skills_names = [m.skill for m in eval_result.matched_skills]
        missing_skills_names = [m.skill for m in eval_result.missing_skills]
        partial_skills_names = [p.skill for p in eval_result.partial_skills]

        explanation, recommendations = self.provider.generate_explanation(
            resume_data=resume_data,
            job_data=job_data,
            overall_score=eval_result.overall_score,
            matched_skills=matched_skills_names,
            missing_skills=missing_skills_names,
            partial_skills=partial_skills_names,
            critical_missing=eval_result.critical_missing_requirements,
        )

        eval_result.score_explanation = explanation
        eval_result.improvement_recommendations = recommendations

        return eval_result
