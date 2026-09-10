import unittest
from app.ai_matching.scorer import MatchingScorer
from app.ai_matching.interfaces import (
    ExtractedResumeData,
    ExtractedJobData,
    ProjectItem,
    EducationItem,
)

class TestScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = MatchingScorer()

    def test_default_weight_distribution(self):
        """Verifies standard 40/25/15/10/10 weight computation and component scores."""
        resume = ExtractedResumeData(
            candidate_name="Alice Smith",
            raw_text="5 years of experience in Python and FastAPI with Docker containers.",
            technical_skills=["Python", "FastAPI", "Docker"],
            total_experience_years=5.0,
            projects=[ProjectItem(title="E-commerce API", description="Built scalable microservices in Python", technologies=["Python", "FastAPI"])],
            education=[EducationItem(degree="Bachelor of Science in Computer Science")]
        )
        job = ExtractedJobData(
            title="Senior Backend Engineer",
            raw_text="Looking for a Python engineer with Docker experience.",
            required_skills=["Python", "FastAPI"],
            preferred_skills=["Docker", "Kubernetes"],
            required_experience_years=4.0,
            education_requirements="Bachelor"
        )

        result = self.scorer.evaluate(resume, job)

        self.assertIsNotNone(result.component_scores)
        self.assertIn("skills_score", result.component_scores)
        self.assertIn("experience_score", result.component_scores)
        self.assertIn("projects_score", result.component_scores)
        self.assertIn("education_score", result.component_scores)
        self.assertIn("preferred_skills_score", result.component_scores)

        # 2 out of 2 required matched => 100% skills coverage
        self.assertEqual(result.component_scores["skills_score"], 100.0)
        # 1 out of 2 preferred matched (Docker matched, Kubernetes missing) => 50%
        self.assertEqual(result.component_scores["preferred_skills_score"], 50.0)
        # Experience is 5.0 >= 4.0 => 100%
        self.assertEqual(result.component_scores["experience_score"], 100.0)
        # Overall score should reflect weighted total
        self.assertGreater(result.overall_score, 85.0)

    def test_fixed_weight_distribution_when_no_preferred(self):
        """When job has no preferred skills or education requirements, components default to full credit and overall score strictly follows 40/25/15/10/10."""
        resume = ExtractedResumeData(
            candidate_name="Bob Jones",
            raw_text="Python engineer with 3 years experience.",
            technical_skills=["Python"],
            total_experience_years=3.0,
            projects=[],
            education=[]
        )
        job = ExtractedJobData(
            title="Python Developer",
            raw_text="Python developer needed.",
            required_skills=["Python"],
            preferred_skills=[], # NO preferred skills -> 100%
            required_experience_years=3.0,
            education_requirements=None # NO education requirement -> 100%
        )

        result = self.scorer.evaluate(resume, job)

        # Expected: skills=100 (40), exp=100 (25), proj=50 (7.5), edu=100 (10), pref=100 (10) -> 92.5
        self.assertEqual(result.component_scores["skills_score"], 100.0)
        self.assertEqual(result.component_scores["experience_score"], 100.0)
        self.assertEqual(result.component_scores["projects_score"], 50.0)
        self.assertEqual(result.component_scores["education_score"], 100.0)
        self.assertEqual(result.component_scores["preferred_skills_score"], 100.0)
        self.assertEqual(result.overall_score, 92.5)

if __name__ == "__main__":
    unittest.main()
