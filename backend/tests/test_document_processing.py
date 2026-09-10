import zipfile
import io
import unittest
from fastapi import HTTPException
from app.document_processing.zip_handler import SafeZipHandler

class TestDocumentProcessing(unittest.TestCase):
    def test_safe_zip_extraction(self):
        """Standard valid zip extraction works smoothly."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("resume1.pdf", b"%PDF-1.4 sample pdf content")
            zf.writestr("resume2.docx", b"PK\x03\x04 sample docx content")

        zip_bytes = zip_buffer.getvalue()
        extracted = SafeZipHandler.extract_supported_files(zip_bytes)
        self.assertEqual(len(extracted), 2)
        filenames = [f["filename"] for f in extracted]
        self.assertIn("resume1.pdf", filenames)
        self.assertIn("resume2.docx", filenames)

    def test_path_traversal_filenames_sanitized(self):
        """Zip slip / path traversal paths are sanitized to base filenames."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("../../../evil.pdf", b"%PDF-1.4 malicious attempt")

        zip_bytes = zip_buffer.getvalue()
        extracted = SafeZipHandler.extract_supported_files(zip_bytes)
        self.assertEqual(len(extracted), 1)
        # Basename sanitization strips ../../
        self.assertEqual(extracted[0]["filename"], "evil.pdf")

    def test_unsupported_extensions_filtered_out(self):
        """Non-resume files (.exe, .sh, .py) are safely ignored."""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("script.sh", b"rm -rf /")
            zf.writestr("candidate.pdf", b"%PDF-1.4 real resume")

        zip_bytes = zip_buffer.getvalue()
        extracted = SafeZipHandler.extract_supported_files(zip_bytes)
        self.assertEqual(len(extracted), 1)
        self.assertEqual(extracted[0]["filename"], "candidate.pdf")

if __name__ == "__main__":
    unittest.main()
