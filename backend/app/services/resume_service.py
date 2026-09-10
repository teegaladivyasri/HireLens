import os
import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.models.resume import Resume
from app.document_processing.validators import validate_file_extension, validate_file_size
from app.document_processing.extractor import DocumentExtractor
from app.document_processing.zip_handler import SafeZipHandler


class ResumeService:
    """Service handling single and batch resume uploads, extraction, and persistence."""

    @staticmethod
    def _ensure_upload_dir() -> str:
        upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @staticmethod
    def save_resume_file(
        db: Session,
        filename: str,
        file_bytes: bytes,
        user_id: Optional[int] = None,
    ) -> Resume:
        """Process and save a single resume file (PDF or DOCX)."""
        ext = validate_file_extension(filename, allow_zip=False)
        validate_file_size(len(file_bytes))

        # Extract text
        extracted_text = DocumentExtractor.extract_text_from_file(filename, file_bytes)
        metadata = DocumentExtractor.extract_candidate_metadata(extracted_text)

        # Store to disk with secure unique filename
        upload_dir = ResumeService._ensure_upload_dir()
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(upload_dir, unique_filename)

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        # Determine MIME
        mime_type = "application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        resume = Resume(
            user_id=user_id,
            filename=filename,
            file_path=target_path,
            file_size=len(file_bytes),
            mime_type=mime_type,
            extracted_text=extracted_text,
            candidate_name=metadata.get("name"),
            candidate_email=metadata.get("email"),
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    @staticmethod
    def process_bulk_resumes(
        db: Session,
        files: List[UploadFile],
    ) -> List[Resume]:
        """Process multiple uploaded PDF/DOCX files."""
        saved_resumes = []
        for file in files:
            content = file.file.read()
            resume = ResumeService.save_resume_file(
                db=db,
                filename=file.filename,
                file_bytes=content,
                user_id=None,
            )
            saved_resumes.append(resume)
        return saved_resumes

    @staticmethod
    def process_zip_upload(
        db: Session,
        zip_file: UploadFile,
    ) -> List[Resume]:
        """Process and extract supported resumes from a ZIP archive safely."""
        validate_file_extension(zip_file.filename, allow_zip=True)
        zip_bytes = zip_file.file.read()
        validate_file_size(len(zip_bytes))

        extracted_files = SafeZipHandler.extract_supported_files(zip_bytes)
        saved_resumes = []

        for item in extracted_files:
            resume = ResumeService.save_resume_file(
                db=db,
                filename=item["filename"],
                file_bytes=item["content"],
                user_id=None,
            )
            saved_resumes.append(resume)

        return saved_resumes

    @staticmethod
    def get_resume_by_id(db: Session, resume_id: int) -> Optional[Resume]:
        return db.query(Resume).filter(Resume.id == resume_id).first()

    @staticmethod
    def get_user_resumes(db: Session, user_id: int) -> List[Resume]:
        return db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).all()
