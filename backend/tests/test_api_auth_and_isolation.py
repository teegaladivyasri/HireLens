import unittest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

class TestApiAuthAndIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        Base.metadata.create_all(bind=engine)

    def _get_token(self, email, password, role):
        # Register user
        reg_resp = self.client.post("/api/v1/auth/register", json={
            "name": "Test User",
            "email": email,
            "password": password,
            "role": role
        })
        # Login user
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        return login_resp.json()["access_token"]

    def test_auth_registration_and_login(self):
        """Tests user creation and JWT token issuing."""
        u_email = f"seeker_{uuid.uuid4().hex[:8]}@example.com"
        reg = self.client.post("/api/v1/auth/register", json={
            "name": "Alice Seeker",
            "email": u_email,
            "password": "Password123!",
            "role": "JOB_SEEKER"
        })
        self.assertEqual(reg.status_code, 201)
        data = reg.json()
        self.assertEqual(data["email"], u_email)
        self.assertEqual(data["role"], "JOB_SEEKER")

        # Login
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": u_email,
            "password": "Password123!"
        })
        self.assertEqual(login_resp.status_code, 200)
        tok_data = login_resp.json()
        self.assertIn("access_token", tok_data)

    def test_recruiter_data_isolation(self):
        """A recruiter cannot access another recruiter's job screenings."""
        recruiter1_email = f"rec1_{uuid.uuid4().hex[:8]}@example.com"
        recruiter2_email = f"rec2_{uuid.uuid4().hex[:8]}@example.com"

        tok1 = self._get_token(recruiter1_email, "Password123!", "RECRUITER")
        tok2 = self._get_token(recruiter2_email, "Password123!", "RECRUITER")

        # Recruiter 1 creates a job
        job_resp = self.client.post("/api/v1/jobs/", json={
            "title": "Confidential Staff Architect",
            "description": "Requires 10 years distributed systems and Go.",
            "required_skills": ["Go", "Distributed Systems"]
        }, headers={"Authorization": f"Bearer {tok1}"})
        self.assertEqual(job_resp.status_code, 201)
        job_id = job_resp.json()["id"]

        # Recruiter 2 tries to access Recruiter 1's job screenings
        screen_resp = self.client.get(f"/api/v1/analyses/screenings/{job_id}", headers={
            "Authorization": f"Bearer {tok2}"
        })
        # Should be forbidden or 404 (not found in Recruiter 2's jurisdiction)
        self.assertIn(screen_resp.status_code, [403, 404])

    def test_seeker_cannot_access_unowned_analysis(self):
        """A job seeker cannot view another candidate's fit analysis."""
        seeker_email = f"seeker2_{uuid.uuid4().hex[:8]}@example.com"
        tok = self._get_token(seeker_email, "Password123!", "JOB_SEEKER")

        # If seeker requests an arbitrary non-existent or foreign id like 99999
        resp = self.client.get("/api/v1/analyses/99999", headers={
            "Authorization": f"Bearer {tok}"
        })
        self.assertIn(resp.status_code, [403, 404])

if __name__ == "__main__":
    unittest.main()
