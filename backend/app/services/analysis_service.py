from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.analysis import Analysis, AnalysisStatus, MatchResult
from app.models.candidate_status import CandidateWorkflowStatus
from app.models.job import Job
from app.models.resume import Resume


class AnalysisService:
    """Service orchestrating analysis records and candidate workflow statuses."""

    @staticmethod
    def create_candidate_analysis(
        db: Session,
        user_id: int,
        resume_id: int,
        job_id: int,
    ) -> Analysis:
        """Create an analysis record for a job seeker."""
        # Verify resume belongs to user or exists
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

        analysis = Analysis(
            job_id=job.id,
            resume_id=resume.id,
            user_id=user_id,
            status=AnalysisStatus.PENDING,
            candidate_status=CandidateWorkflowStatus.NEW,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def create_batch_screening(
        db: Session,
        job_id: int,
        resume_ids: List[int],
    ) -> List[Analysis]:
        """Create screening records for multiple candidate resumes linked to a recruiter job."""
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

        created_records = []
        for r_id in resume_ids:
            resume = db.query(Resume).filter(Resume.id == r_id).first()
            if not resume:
                continue

            analysis = Analysis(
                job_id=job.id,
                resume_id=resume.id,
                user_id=None,
                status=AnalysisStatus.PENDING,
                candidate_status=CandidateWorkflowStatus.NEW,
            )
            db.add(analysis)
            created_records.append(analysis)

        db.commit()
        for record in created_records:
            db.refresh(record)

        return created_records

    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: int) -> Analysis:
        from sqlalchemy.orm import joinedload
        analysis = (
            db.query(Analysis)
            .options(
                joinedload(Analysis.resume),
                joinedload(Analysis.job),
                joinedload(Analysis.match_result),
            )
            .filter(Analysis.id == analysis_id)
            .first()
        )
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")
        return analysis

    @staticmethod
    def get_candidate_analyses(db: Session, user_id: int) -> List[Analysis]:
        from sqlalchemy.orm import joinedload
        return (
            db.query(Analysis)
            .options(
                joinedload(Analysis.resume),
                joinedload(Analysis.job),
                joinedload(Analysis.match_result),
            )
            .filter(Analysis.user_id == user_id)
            .order_by(Analysis.created_at.desc())
            .all()
        )

    @staticmethod
    def get_job_screenings(db: Session, job_id: int) -> List[Analysis]:
        from sqlalchemy.orm import joinedload
        return (
            db.query(Analysis)
            .options(
                joinedload(Analysis.resume),
                joinedload(Analysis.job),
                joinedload(Analysis.match_result),
            )
            .filter(Analysis.job_id == job_id)
            .order_by(Analysis.created_at.desc())
            .all()
        )

    @staticmethod
    def update_candidate_workflow_status(
        db: Session,
        analysis_id: int,
        new_status: CandidateWorkflowStatus,
    ) -> Analysis:
        analysis = AnalysisService.get_analysis_by_id(db, analysis_id)
        analysis.candidate_status = new_status
        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def process_analysis(analysis_id: int) -> None:
        """
        Execute the real AI Matching pipeline asynchronously.
        Transitions: PENDING -> ANALYZING -> COMPLETED (or FAILED).
        """
        from app.core.database import SessionLocal
        from app.ai_matching.engine import MatchingEngine

        db = SessionLocal()
        try:
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if not analysis:
                return

            analysis.status = AnalysisStatus.ANALYZING
            analysis.error_message = None
            db.commit()

            resume = analysis.resume
            job = analysis.job

            if not resume or not resume.extracted_text:
                raise ValueError("Resume text is missing or unextracted.")

            if not job or not job.description:
                raise ValueError("Job description text is empty.")

            # Run MatchingEngine
            engine = MatchingEngine()
            eval_result = engine.match(resume_text=resume.extracted_text, jd_text=job.description)

            # Store serialized match details
            matched_dict = [m.model_dump() for m in eval_result.matched_skills]
            missing_dict = [m.model_dump() for m in eval_result.missing_skills]
            partial_dict = [p.model_dump() for p in eval_result.partial_skills]

            existing_mr = db.query(MatchResult).filter(MatchResult.analysis_id == analysis.id).first()
            if existing_mr:
                existing_mr.overall_score = eval_result.overall_score
                existing_mr.skill_match = eval_result.skill_match_score
                existing_mr.experience_match = eval_result.experience_match_score
                existing_mr.education_match = eval_result.education_match_score
                existing_mr.project_relevance = eval_result.project_relevance_score
                existing_mr.component_scores = eval_result.component_scores
                existing_mr.matched_skills = matched_dict
                existing_mr.missing_skills = missing_dict
                existing_mr.partial_skills = partial_dict
                existing_mr.explanation = eval_result.score_explanation
                existing_mr.recommendations = eval_result.improvement_recommendations
            else:
                mr = MatchResult(
                    analysis_id=analysis.id,
                    overall_score=eval_result.overall_score,
                    skill_match=eval_result.skill_match_score,
                    experience_match=eval_result.experience_match_score,
                    education_match=eval_result.education_match_score,
                    project_relevance=eval_result.project_relevance_score,
                    component_scores=eval_result.component_scores,
                    matched_skills=matched_dict,
                    missing_skills=missing_dict,
                    partial_skills=partial_dict,
                    explanation=eval_result.score_explanation,
                    recommendations=eval_result.improvement_recommendations,
                )
                db.add(mr)

            analysis.status = AnalysisStatus.COMPLETED
            analysis.error_message = None
            db.commit()

        except Exception as e:
            db.rollback()
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if analysis:
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = str(e)
                db.commit()
        finally:
            db.close()

    @staticmethod
    def get_job_shortlist(db: Session, job_id: int, recruiter_id: int):
        """Generate explainable shortlist recommendations for a recruiter's job."""
        from sqlalchemy.orm import joinedload
        from app.services.job_service import JobService
        from app.ai_matching.shortlist import ShortlistGenerator

        # Enforce recruiter ownership
        JobService.get_job_by_id(db, job_id=job_id, recruiter_id=recruiter_id)

        analyses = (
            db.query(Analysis)
            .options(joinedload(Analysis.resume), joinedload(Analysis.match_result))
            .filter(Analysis.job_id == job_id)
            .all()
        )
        analyses_data = []
        for a in analyses:
            analyses_data.append({
                "analysis_id": a.id,
                "resume_id": a.resume_id,
                "candidate_name": a.resume.candidate_name if a.resume else None,
                "filename": a.resume.filename if a.resume else None,
                "status": a.status.value,
                "candidate_status": a.candidate_status.value,
                "match_result": a.match_result,
                "error_message": a.error_message,
            })

        return ShortlistGenerator.generate(job_id=job_id, analyses_data=analyses_data)

