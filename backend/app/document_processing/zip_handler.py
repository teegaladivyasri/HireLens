import io
import os
import zipfile
from typing import List, Dict, Any
from fastapi import HTTPException, status
from app.document_processing.validators import ALLOWED_EXTENSIONS

MAX_ZIP_FILES = 50
MAX_UNCOMPRESSED_SIZE_MB = 100


class SafeZipHandler:
    """Safely inspects and extracts PDF and DOCX documents from ZIP archives, preventing path traversal attacks."""

    @staticmethod
    def extract_supported_files(zip_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Inspect and extract valid PDF/DOCX files from a ZIP buffer safely.
        Returns a list of dicts: {"filename": str, "content": bytes, "size": int}
        """
        extracted_files: List[Dict[str, Any]] = []
        total_size = 0

        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                infolist = zf.infolist()

                # Check total file count
                if len(infolist) > MAX_ZIP_FILES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"ZIP archive contains too many files ({len(infolist)}). Maximum allowed is {MAX_ZIP_FILES}.",
                    )

                for member in infolist:
                    # Ignore directories and macOS metadata
                    if member.is_dir() or member.filename.startswith("__MACOSX/") or os.path.basename(member.filename).startswith("."):
                        continue

                    # Defense against directory traversal: ensure clean relative path
                    clean_filename = os.path.basename(member.filename)
                    if not clean_filename:
                        continue

                    # Validate extension
                    _, ext = os.path.splitext(clean_filename.lower())
                    if ext not in ALLOWED_EXTENSIONS:
                        continue

                    # Defense against zip bombs
                    total_size += member.file_size
                    if total_size > MAX_UNCOMPRESSED_SIZE_MB * 1024 * 1024:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"ZIP contents exceed total uncompressed limit of {MAX_UNCOMPRESSED_SIZE_MB}MB.",
                        )

                    file_data = zf.read(member)
                    extracted_files.append({
                        "filename": clean_filename,
                        "content": file_data,
                        "size": len(file_data),
                    })

        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or corrupted ZIP archive.",
            )

        if not extracted_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The ZIP file does not contain any valid PDF or DOCX resume documents.",
            )

        return extracted_files
