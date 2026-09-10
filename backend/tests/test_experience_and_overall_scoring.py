import unittest
from app.ai_matching.interfaces import (
    ExtractedResumeData,
    ExtractedJobData,
    ProjectItem,
    EducationItem,
)
from app.ai_matching.scorer import MatchingScorer
from app.ai_matching.providers.native_provider import NativeAIProvider


class TestExperienceAndOverallScoring(unittest.TestCase):
    def setUp(self):
        self.scorer = MatchingScorer()
        self.provider = NativeAIProvider()

    def test_1_candidate_with_0_years_for_0_to_1_years_job(self):
        """Job requires 0-1 years (intern/entry-level) and candidate has 0 years -> 100% experience score."""
        resume = ExtractedResumeData(
            candidate_name="Fresh Graduate",
            raw_text="Recent graduate in Computer Science. Skilled in React and Node.js.",
            technical_skills=["React", "Node.js"],
            total_experience_years=0.0,
            projects=[ProjectItem(title="Portfolio", description="React project", technologies=["React"])],
            education=[EducationItem(degree="Bachelor of Technology")]
        )
        job = ExtractedJobData(
            title="Software Development Engineer Intern",
            raw_text="0–1 year of experience in full-stack development. React, Node.js.",
            required_skills=["React", "Node.js"],
            required_experience_years=0.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 100.0)

    def test_2_candidate_with_no_experience_section_defaults_to_zero_and_matches_entry_level(self):
        """Resume without work experience section defaults to 0.0 years and receives 100% on 0-1 year job."""
        resume = ExtractedResumeData(
            candidate_name="College Student",
            raw_text="Student with academic projects in Python.",
            technical_skills=["Python"],
            total_experience_years=None, # Not explicitly set -> defaults/treated as 0.0
            work_experience=[],
            projects=[],
            education=[EducationItem(degree="B.S. in CS")]
        )
        job = ExtractedJobData(
            title="Junior Python Intern",
            raw_text="Entry level position. 0-1 years experience.",
            required_skills=["Python"],
            required_experience_years=0.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 100.0)

    def test_3_candidate_with_0_years_for_mid_level_job(self):
        """Job requires 2 years and candidate has 0 years -> 0% experience score."""
        resume = ExtractedResumeData(
            candidate_name="Entry Dev",
            raw_text="Developer with React skills.",
            technical_skills=["React"],
            total_experience_years=0.0,
            projects=[ProjectItem(title="React App", description="App in React", technologies=["React"])]
        )
        job = ExtractedJobData(
            title="Frontend Developer",
            raw_text="Requires 2+ years of professional React experience.",
            required_skills=["React"],
            required_experience_years=2.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 0.0)

    def test_4_candidate_with_partial_experience_gets_proportional_score(self):
        """Job requires 2 years and candidate has 1 year -> 50% experience score."""
        resume = ExtractedResumeData(
            candidate_name="Junior Dev",
            raw_text="1 year of frontend experience.",
            technical_skills=["React"],
            total_experience_years=1.0,
        )
        job = ExtractedJobData(
            title="Mid Frontend Developer",
            raw_text="Requires 2 years experience.",
            required_skills=["React"],
            required_experience_years=2.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 50.0)

    def test_5_extra_experience_not_penalized(self):
        """Candidate with 2 years experience applying for 0-1 year job gets 100% (not penalized)."""
        resume = ExtractedResumeData(
            candidate_name="Experienced Dev",
            raw_text="2 years full stack experience.",
            technical_skills=["React", "Node.js"],
            total_experience_years=2.0,
        )
        job = ExtractedJobData(
            title="Software Development Engineer Intern",
            raw_text="0-1 years experience.",
            required_skills=["React", "Node.js"],
            required_experience_years=0.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 100.0)

    def test_6_extra_experience_for_1_to_2_years_job(self):
        """Candidate with 3 years for a 1-2 years job gets 100%."""
        resume = ExtractedResumeData(
            candidate_name="Experienced Dev",
            raw_text="3 years software development experience.",
            technical_skills=["Java"],
            total_experience_years=3.0,
        )
        job = ExtractedJobData(
            title="Java Developer",
            raw_text="1-2 years of Java experience.",
            required_skills=["Java"],
            required_experience_years=1.0,
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["experience_score"], 100.0)

    def test_7_exact_overall_score_math_40_25_15_10_10(self):
        """
        Verify overall_score = (skills * 0.40) + (exp * 0.25) + (proj * 0.15) + (edu * 0.10) + (pref * 0.10).
        """
        resume = ExtractedResumeData(
            candidate_name="Test Dev",
            raw_text="Software engineer with React and Node.js.",
            technical_skills=["React", "Node.js", "Docker"],
            total_experience_years=2.0,
            projects=[ProjectItem(title="Web Platform", description="Platform using React", technologies=["React"])],
            education=[EducationItem(degree="Bachelor of Engineering")]
        )
        job = ExtractedJobData(
            title="Full Stack Engineer",
            raw_text="Required: React, Node.js. Preferred: Docker, AWS. Experience: 4 years. Education: Bachelor.",
            required_skills=["React", "Node.js"],
            preferred_skills=["Docker", "AWS"],
            required_experience_years=4.0,
            education_requirements="Bachelor"
        )

        result = self.scorer.evaluate(resume, job)
        skills = result.component_scores["skills_score"]          # 2/2 = 100.0
        exp = result.component_scores["experience_score"]         # 2.0 / 4.0 = 50.0
        proj = result.component_scores["projects_score"]          # 100.0 (has matched React)
        edu = result.component_scores["education_score"]          # 100.0
        pref = result.component_scores["preferred_skills_score"]  # 1/2 = 50.0

        expected_overall = round(
            (skills * 0.40) + (exp * 0.25) + (proj * 0.15) + (edu * 0.10) + (pref * 0.10),
            1
        )
        # Expected: 40.0 + 12.5 + 15.0 + 10.0 + 5.0 = 82.5
        self.assertEqual(result.overall_score, expected_overall)
        self.assertEqual(result.overall_score, 82.5)

    def test_8_native_provider_job_experience_extraction(self):
        """Verify NativeProvider parses 0–1 years, unicode dashes, entry-level, internship to 0.0 required years."""
        jd_texts = [
            "Requires 0–1 year of experience in full-stack development or related internships.",
            "Requirements: 0-1 years of experience in software development.",
            "Looking for candidates with 0 to 1 years experience.",
            "Freshers welcome! No experience required.",
            "Entry-level position for recent graduates.",
            "Software Development Engineer Intern position.",
            "Minimum experience: less than 1 year.",
        ]
        for jd in jd_texts:
            extracted = self.provider.extract_job(jd)
            self.assertEqual(
                extracted.required_experience_years, 0.0,
                f"Failed to parse 0.0 years from: {jd}"
            )

    def test_9_native_provider_resume_defaults_to_zero_experience(self):
        """Verify NativeProvider defaults total_experience_years to 0.0 when no work history exists."""
        resume_text = """
        Jane Doe
        Email: jane@example.com
        Education:
        B.Tech in Computer Science, 2024
        Skills:
        React, JavaScript, HTML, CSS, Node.js
        Projects:
        E-commerce Website built using React and Node.js
        """
        extracted = self.provider.extract_resume(resume_text)
        self.assertEqual(extracted.total_experience_years, 0.0)

    def test_10_sde_intern_perfect_match_case(self):
        """
        Test the exact user case:
        Job: Software Development Engineer Intern (0-1 years, React, Node.js)
        Candidate: 0 years experience, matching skills and projects
        Expected: Experience = 100%, Overall = 100%.
        """
        resume = ExtractedResumeData(
            candidate_name="Alice Intern",
            raw_text="CS graduate skilled in React, Node.js, HTML, CSS, MongoDB. Built fullstack web applications.",
            technical_skills=["React", "Node.js", "HTML", "CSS", "MongoDB"],
            total_experience_years=0.0,
            projects=[ProjectItem(title="HireLens", description="Fullstack app with React and Node.js", technologies=["React", "Node.js"])],
            education=[EducationItem(degree="Bachelor of Technology in Computer Science")]
        )
        job = ExtractedJobData(
            title="Software Development Engineer Intern",
            raw_text="0–1 year of experience in full-stack development or related internships. Skills: React, Node.js, HTML, CSS, MongoDB.",
            required_skills=["React", "Node.js", "HTML", "CSS", "MongoDB"],
            preferred_skills=[],
            required_experience_years=0.0,
            education_requirements=None
        )

        result = self.scorer.evaluate(resume, job)
        self.assertEqual(result.component_scores["skills_score"], 100.0)
        self.assertEqual(result.component_scores["experience_score"], 100.0)
        self.assertEqual(result.component_scores["projects_score"], 100.0)
        self.assertEqual(result.component_scores["education_score"], 100.0)
        self.assertEqual(result.component_scores["preferred_skills_score"], 100.0)
        self.assertEqual(result.overall_score, 100.0)


if __name__ == "__main__":
    unittest.main()
