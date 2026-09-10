import re
import os
from typing import Dict, Any, Tuple
from app.document_processing.parser import get_parser_for_extension
from app.document_processing.validators import validate_file_extension


class DocumentExtractor:
    """Extracts and cleans text and metadata from resume and job description documents."""

    @staticmethod
    def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
        """Extract text from supported document types."""
        ext = validate_file_extension(filename, allow_zip=False)
        parser = get_parser_for_extension(ext)
        if not parser:
            raise ValueError(f"No parser available for extension '{ext}'")
        raw_text = parser.parse(file_bytes)
        return DocumentExtractor.normalize_text(raw_text)

    @staticmethod
    def normalize_text(text: str) -> str:
        """Clean excessive whitespaces, tabs, and non-printable characters."""
        if not text:
            return ""
        # Normalize carriage returns and newlines
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Replace non-breaking spaces
        text = text.replace("\xa0", " ")
        # Collapse multiple blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def extract_candidate_metadata(text: str) -> Dict[str, Any]:
        """Extract candidate email and name heuristically if present."""
        metadata = {"name": None, "email": None}
        if not text:
            return metadata

        # Email regex
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
        if email_match:
            metadata["email"] = email_match.group(0).lower()

        # Extract first non-empty line as likely name candidate
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines and len(lines[0].split()) <= 4 and len(lines[0]) <= 50:
            metadata["name"] = lines[0]

        return metadata
