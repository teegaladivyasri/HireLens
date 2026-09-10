import os
from typing import Tuple
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_ARCHIVE_EXTENSIONS = {".zip"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/x-zip-compressed",
    "application/zip",
    "application/octet-stream",  # Often sent for docx or zip by some browsers
}


def validate_file_extension(filename: str, allow_zip: bool = False) -> str:
    """Validate file extension against allowed formats."""
    _, ext = os.path.splitext(filename.lower())
    valid_exts = ALLOWED_EXTENSIONS | ALLOWED_ARCHIVE_EXTENSIONS if allow_zip else ALLOWED_EXTENSIONS
    if ext not in valid_exts:
        expected = "PDF or DOCX" if not allow_zip else "PDF, DOCX, or ZIP"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Expected {expected}.",
        )
    return ext


def validate_file_size(file_size: int, max_mb: int = None) -> None:
    """Validate that file does not exceed maximum configured size."""
    max_bytes = (max_mb or settings.MAX_UPLOAD_SIZE_MB) * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb or settings.MAX_UPLOAD_SIZE_MB}MB.",
        )
