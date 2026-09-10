import unittest
from datetime import datetime, timezone
from app.schemas.common import UtcDateTime, serialize_utc_datetime
from app.schemas.analysis import AnalysisResponse, MatchResultResponse
from app.schemas.job import JobResponse
from app.schemas.resume import ResumeResponse
from app.schemas.auth import UserResponse
from pydantic import BaseModel

class TestTimezoneSerialization(unittest.TestCase):
    def test_serialize_utc_datetime_naive(self):
        """Naive datetime is treated as UTC and serialized with trailing Z."""
        dt = datetime(2026, 9, 10, 2, 17, 43)
        res = serialize_utc_datetime(dt)
        self.assertEqual(res, "2026-09-10T02:17:43Z")

    def test_serialize_utc_datetime_aware(self):
        """Aware datetime is converted to UTC and formatted with Z."""
        dt = datetime(2026, 9, 10, 2, 17, 43, tzinfo=timezone.utc)
        res = serialize_utc_datetime(dt)
        self.assertEqual(res, "2026-09-10T02:17:43Z")

    def test_model_json_serialization_has_z(self):
        """Pydantic model dump with UtcDateTime always outputs ISO with Z."""
        class Sample(BaseModel):
            created_at: UtcDateTime

        s = Sample(created_at=datetime(2026, 9, 10, 2, 17, 43))
        json_str = s.model_dump_json()
        self.assertIn('"created_at":"2026-09-10T02:17:43Z"', json_str)

if __name__ == "__main__":
    unittest.main()
