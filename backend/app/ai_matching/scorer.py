import re
from typing import List, Dict, Any, Tuple, Optional
from app.ai_matching.interfaces import (
    IMatchingScorer,
    ExtractedResumeData,
    ExtractedJobData,
    EvaluationResult,
    SkillMatchItem,
    MatchStatus,
)
from app.ai_matching.semantic import SemanticMatcher

# Initial default configurable weights (sums to 1.0)
DEFAULT_WEIGHTS = {
    "required_skills": 0.40,
    "experience": 0.25,
    "projects": 0.15,
    "education": 0.10,
    "preferred_skills": 0.10,
}


class MatchingScorer(IMatchingScorer):
    """
    Deterministic, explainable, and transparent weighted scoring engine.
    Calculates component and overall scores based on genuine evidence extracted from resume and JD.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or dict(DEFAULT_WEIGHTS)

    def evaluate(
        self,
        resume_data: ExtractedResumeData,
        job_data: ExtractedJobData,
    ) -> EvaluationResult:
        resume_skills_lower = [s.lower() for s in resume_data.all_skills()]
        resume_raw_text = resume_data.raw_text or ""

        # 1. Match Required Skills with Evidence
        matched_items: List[SkillMatchItem] = []
        partial_items: List[SkillMatchItem] = []
        missing_items: List[SkillMatchItem] = []
        critical_missing: List[str] = []

        required_skills = job_data.required_skills or []
        preferred_skills = job_data.preferred_skills or []

        # If JD has no explicit skills listed, extract nouns/tokens
        if not required_skills and not preferred_skills:
            required_skills = ["Technical Competence"]

        req_matched_count = 0
        for req_skill in required_skills:
            is_matched = False
            evidence_str = None

            # Check direct list equivalence first
            for candidate_s in resume_data.all_skills():
                if SemanticMatcher.are_equivalent(req_skill, candidate_s):
                    is_matched = True
                    break

            # Search document text for authentic sentence/bullet evidence
            found_in_text, text_evidence = SemanticMatcher.find_evidence_in_text(req_skill, resume_raw_text)
            if found_in_text:
                is_matched = True
                evidence_str = text_evidence

            if is_matched:
                req_matched_count += 1
                matched_items.append(SkillMatchItem(
                    skill=req_skill,
                    status=MatchStatus.MATCHED,
                    evidence=evidence_str or f"Document lists verified competency in {req_skill}.",
                    is_required=True,
                    importance="REQUIRED",
                ))
            else:
                # Check for partial related competence (e.g. general term match or related technology)
                partial_found = False
                canonical = SemanticMatcher.get_canonical(req_skill)
                for cand_skill in resume_skills_lower:
                    if canonical in cand_skill or cand_skill in canonical:
                        partial_found = True
                        break

                if partial_found:
                    partial_items.append(SkillMatchItem(
                        skill=req_skill,
                        status=MatchStatus.PARTIAL,
                        evidence=f"Candidate demonstrates related exposure, but lacks dedicated depth in {req_skill}.",
                        is_required=True,
                        importance="REQUIRED",
                    ))
                else:
                    missing_items.append(SkillMatchItem(
                        skill=req_skill,
                        status=MatchStatus.MISSING,
                        evidence=None,
                        is_required=True,
                        importance="REQUIRED",
                    ))
                    critical_missing.append(req_skill)

        # 2. Match Preferred Skills
        pref_matched_count = 0
        for pref_skill in preferred_skills:
            is_matched = False
            evidence_str = None

            for candidate_s in resume_data.all_skills():
                if SemanticMatcher.are_equivalent(pref_skill, candidate_s):
                    is_matched = True
                    break

            found_in_text, text_evidence = SemanticMatcher.find_evidence_in_text(pref_skill, resume_raw_text)
            if found_in_text:
                is_matched = True
                evidence_str = text_evidence

            if is_matched:
                pref_matched_count += 1
                matched_items.append(SkillMatchItem(
                    skill=pref_skill,
                    status=MatchStatus.MATCHED,
                    evidence=evidence_str or f"Document demonstrates exposure to {pref_skill}.",
                    is_required=False,
                    importance="PREFERRED",
                ))
            else:
                missing_items.append(SkillMatchItem(
                    skill=pref_skill,
                    status=MatchStatus.MISSING,
                    evidence=None,
                    is_required=False,
                    importance="PREFERRED",
                ))

        # 3. Calculate Component Scores
        # Skills Score (Required skills have primary weight)
        total_req = max(len(required_skills), 1)
        required_skills_coverage = round((req_matched_count / total_req) * 100.0, 1)
        
        # Required skills score includes partial credit
        partial_req_count = len([p for p in partial_items if p.is_required])
        skills_score = round(min(100.0, ((req_matched_count + 0.5 * partial_req_count) / total_req) * 100.0), 1)

        # Preferred Skills Score
        if preferred_skills:
            preferred_score = round((pref_matched_count / len(preferred_skills)) * 100.0, 1)
        else:
            preferred_score = 100.0

        # Experience Score
        candidate_exp = float(resume_data.total_experience_years) if resume_data.total_experience_years is not None else 0.0
        req_exp = float(job_data.required_experience_years) if job_data.required_experience_years is not None else 0.0

        if req_exp <= 0.0:
            # 0 years / 0-1 years / entry-level / intern / freshers requirement:
            # Candidate with 0+ years meets or exceeds requirement -> 100%
            experience_score = 100.0
        else:
            if candidate_exp >= req_exp:
                # Candidate meets or exceeds requirement -> full match (extra experience not penalized)
                experience_score = 100.0
            else:
                # Candidate has less experience than required
                experience_score = round((candidate_exp / req_exp) * 100.0, 1)

        # Project Relevance Score
        projects_score = 50.0  # baseline if no projects section
        if resume_data.projects:
            # Evaluate how many projects feature matched technologies
            matched_tech_set = {m.skill.lower() for m in matched_items}
            relevant_proj_count = 0
            for proj in resume_data.projects:
                proj_blob = (proj.title + " " + (proj.description or "") + " " + " ".join(proj.technologies)).lower()
                if any(tech in proj_blob for tech in matched_tech_set):
                    relevant_proj_count += 1
            
            relevance_ratio = min(1.0, relevant_proj_count / max(len(resume_data.projects), 1))
            projects_score = round(60.0 + 40.0 * relevance_ratio, 1)

        # Education Alignment Score
        has_edu_requirement = bool(job_data.education_requirements)
        if has_edu_requirement:
            if resume_data.education:
                education_score = 100.0
            else:
                education_score = 50.0  # lacks stated degree
        else:
            education_score = 100.0  # not required, do not penalize

        # 4. Overall Score Calculation
        # Strictly matches the 5 displayed weights:
        # Required Skills: 40%, Experience: 25%, Projects: 15%, Education: 10%, Preferred Skills: 10%
        w_skills = self.weights.get("required_skills", 0.40)
        w_exp = self.weights.get("experience", 0.25)
        w_proj = self.weights.get("projects", 0.15)
        w_edu = self.weights.get("education", 0.10)
        w_pref = self.weights.get("preferred_skills", 0.10)

        overall_score = round(
            (skills_score * w_skills)
            + (experience_score * w_exp)
            + (projects_score * w_proj)
            + (education_score * w_edu)
            + (preferred_score * w_pref),
            1,
        )
        overall_score = max(0.0, min(100.0, overall_score))

        comp_scores = {
            "skills_score": skills_score,
            "experience_score": experience_score,
            "projects_score": projects_score,
            "education_score": education_score,
            "preferred_skills_score": preferred_score,
        }

        return EvaluationResult(
            overall_score=overall_score,
            skill_match_score=skills_score,
            experience_match_score=experience_score,
            education_match_score=education_score,
            project_relevance_score=projects_score,
            preferred_score=preferred_score,
            required_skills_coverage=required_skills_coverage,
            component_scores=comp_scores,
            matched_skills=matched_items,
            partial_skills=partial_items,
            missing_skills=missing_items,
            critical_missing_requirements=critical_missing,
            score_explanation="",  # Will be populated by engine with AI provider
            improvement_recommendations=[],
        )
