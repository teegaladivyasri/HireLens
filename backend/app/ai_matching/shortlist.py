from typing import List, Dict, Any, Optional
from app.ai_matching.interfaces import (
    ShortlistCandidate,
    ShortlistRecommendation,
    EvaluationResult,
)


class ShortlistGenerator:
    """
    Evaluates completed candidate analyses for a recruiter job and generates
    an explainable, multi-factor recommended shortlist without overriding human control.
    """

    @staticmethod
    def generate(
        job_id: int,
        analyses_data: List[Dict[str, Any]],
    ) -> ShortlistRecommendation:
        """
        analyses_data is expected to be a list of dicts with:
        {
          "analysis_id": int,
          "resume_id": int,
          "candidate_name": str,
          "status": str, # COMPLETED, PROCESSING, PENDING, FAILED
          "candidate_status": str, # NEW, REVIEW, SHORTLISTED, REJECTED
          "match_result": dict or MatchResult object,
          "error_message": Optional[str],
        }
        """
        total = len(analyses_data)
        completed = []
        processing = 0
        failed = 0

        for a in analyses_data:
            st = a.get("status")
            if st == "COMPLETED" and a.get("match_result"):
                completed.append(a)
            elif st in {"PROCESSING", "PENDING"}:
                processing += 1
            elif st == "FAILED":
                failed += 1

        # Edge case: No completed candidates yet
        if not completed:
            if processing > 0:
                summary = f"{processing} candidate(s) still processing. Shortlist recommendations will appear once analyses complete."
            elif failed > 0:
                summary = "All candidate analyses encountered errors or could not complete."
            else:
                summary = "Shortlist recommendations will appear after candidate analyses are completed."

            return ShortlistRecommendation(
                job_id=job_id,
                total_candidates=total,
                completed_candidates=0,
                processing_candidates=processing,
                failed_candidates=failed,
                recommended_candidates=[],
                summary_note=summary,
            )

        # Multi-factor candidate scoring and ranking
        # Factors:
        # 1. Required skills coverage (highest priority)
        # 2. Overall match score
        # 3. Penalized if critical missing requirements exist
        candidate_evals = []
        for a in completed:
            mr = a["match_result"]
            # Extract attributes from dict or ORM object
            overall = getattr(mr, "overall_score", None) if hasattr(mr, "overall_score") else mr.get("overall_score", 0.0)
            skill = getattr(mr, "skill_match", None) if hasattr(mr, "skill_match") else mr.get("skill_match", 0.0)
            exp = getattr(mr, "experience_match", None) if hasattr(mr, "experience_match") else mr.get("experience_match", 0.0)
            proj = getattr(mr, "project_relevance", None) if hasattr(mr, "project_relevance") else mr.get("project_relevance", 0.0)
            req_coverage = mr.get("required_skills_coverage", skill) if isinstance(mr, dict) else getattr(mr, "skill_match", skill)

            matched_skills = mr.get("matched_skills", []) if isinstance(mr, dict) else getattr(mr, "matched_skills", [])
            missing_skills = mr.get("missing_skills", []) if isinstance(mr, dict) else getattr(mr, "missing_skills", [])
            critical_missing = mr.get("critical_missing_requirements", []) if isinstance(mr, dict) else []

            # Format skill lists if stored as dicts
            key_matched = [
                m["skill"] if isinstance(m, dict) else str(m)
                for m in matched_skills
            ][:5]
            crit_missing = [
                m["skill"] if isinstance(m, dict) and m.get("is_required") else str(m)
                for m in (critical_missing or missing_skills)
            ][:4]

            # Weighted ranking metric:
            # Emphasizes required skills coverage (50%) + overall score (40%) - penalty for critical gaps
            gap_penalty = min(20.0, len(crit_missing) * 5.0)
            rank_metric = (req_coverage * 0.50) + (overall * 0.50) - gap_penalty

            # Generate concise recruiter explanation
            if overall >= 75.0 and len(crit_missing) == 0:
                explanation = f"Top-tier match. Verified qualifications in {', '.join(key_matched[:3]) or 'core requirements'} with no critical gaps detected."
            elif overall >= 65.0:
                gap_note = f" Missing direct evidence for {', '.join(crit_missing[:2])}." if crit_missing else ""
                explanation = f"Strong alignment in {', '.join(key_matched[:3]) or 'technical requirements'}.{gap_note}"
            else:
                gap_note = f" Lacks evidence for: {', '.join(crit_missing[:2])}." if crit_missing else ""
                explanation = f"Moderate alignment.{gap_note}"

            candidate_evals.append({
                "rank_metric": rank_metric,
                "analysis_id": a["analysis_id"],
                "resume_id": a["resume_id"],
                "candidate_name": a.get("candidate_name") or f"Candidate #{a['analysis_id']}",
                "filename": a.get("filename"),
                "overall_score": round(overall, 1),
                "skill_match": round(skill, 1),
                "experience_match": round(exp, 1),
                "project_relevance": round(proj, 1),
                "required_skills_coverage": round(req_coverage, 1),
                "key_matched_skills": key_matched,
                "critical_missing_requirements": crit_missing,
                "current_status": a.get("candidate_status", "NEW"),
                "explanation": explanation,
            })

        # Sort candidates descending by rank_metric
        candidate_evals.sort(key=lambda x: x["rank_metric"], reverse=True)

        # Filter for candidates that meet threshold (e.g. overall score >= 60.0)
        qualified_candidates = [c for c in candidate_evals if c["overall_score"] >= 60.0]

        if not qualified_candidates:
            return ShortlistRecommendation(
                job_id=job_id,
                total_candidates=total,
                completed_candidates=len(completed),
                processing_candidates=processing,
                failed_candidates=failed,
                recommended_candidates=[],
                summary_note="No strong matches identified from the current candidate pool. All analyzed candidates fell below qualification threshold.",
            )

        # Build final shortlist items
        shortlist_items: List[ShortlistCandidate] = []
        for idx, item in enumerate(qualified_candidates[:10], start=1):
            shortlist_items.append(ShortlistCandidate(
                candidate_rank=idx,
                analysis_id=item["analysis_id"],
                resume_id=item["resume_id"],
                candidate_name=item["candidate_name"],
                filename=item.get("filename"),
                overall_score=item["overall_score"],
                skill_match=item["skill_match"],
                experience_match=item["experience_match"],
                project_relevance=item["project_relevance"],
                required_skills_coverage=item["required_skills_coverage"],
                key_matched_skills=item["key_matched_skills"],
                critical_missing_requirements=item["critical_missing_requirements"],
                current_status=item["current_status"],
                explanation=item["explanation"],
            ))

        processing_note = f" ({processing} candidate(s) still processing)" if processing > 0 else ""
        summary_note = (
            f"Recommended {len(shortlist_items)} candidate(s) ranked by required skill coverage and qualification alignment{processing_note}. "
            f"Final decisions remain with the recruiter."
        )

        return ShortlistRecommendation(
            job_id=job_id,
            total_candidates=total,
            completed_candidates=len(completed),
            processing_candidates=processing,
            failed_candidates=failed,
            recommended_candidates=shortlist_items,
            summary_note=summary_note,
        )
