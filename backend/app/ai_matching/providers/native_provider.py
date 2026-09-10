import re
from typing import Tuple, List, Dict, Any, Optional
from app.ai_matching.providers.base import BaseAIProvider
from app.ai_matching.interfaces import (
    ExtractedResumeData,
    ExtractedJobData,
    EducationItem,
    WorkExperienceItem,
    ProjectItem,
)
from app.ai_matching.semantic import TECH_ALIASES, ALIAS_TO_CANONICAL, SemanticMatcher

KNOWN_SKILLS = set(ALIAS_TO_CANONICAL.keys())


class NativeAIProvider(BaseAIProvider):
    """
    Native deterministic extraction and reasoning engine.
    Parses actual text without external network calls, extracting genuine skills,
    dates, education, projects, and evidence snippets.
    """

    def extract_resume(self, resume_text: str) -> ExtractedResumeData:
        data = ExtractedResumeData(raw_text=resume_text)
        if not resume_text:
            return data

        lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

        # 1. Candidate Name (heuristic: first clean non-empty line)
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 4 and len(first_line) <= 50 and not re.search(r"resume|cv|curriculum", first_line, re.I):
                data.candidate_name = first_line

        # 2. Candidate Email
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", resume_text)
        if email_match:
            data.candidate_email = email_match.group(0).lower()

        # 3. Detect Skills across text
        detected_skills = set()
        text_lower = resume_text.lower()
        for skill in KNOWN_SKILLS:
            pattern = r"(?:\b|_)" + re.escape(skill) + r"(?:\b|_)"
            if re.search(pattern, text_lower):
                detected_skills.add(skill)

        # Categorize detected skills
        for s in detected_skills:
            canonical = SemanticMatcher.get_canonical(s)
            formatted = s.capitalize() if len(s) > 3 else s.upper()

            if canonical in {"python", "javascript", "typescript", "sql", "html", "css"}:
                data.programming_languages.append(formatted)
            elif canonical in {"react", "fastapi", "django", "flask", "vue", "angular", "nextjs", "tailwind"}:
                data.frameworks.append(formatted)
            elif canonical in {"postgresql", "mongodb", "redis"}:
                data.databases.append(formatted)
            elif canonical in {"aws", "gcp", "azure", "docker", "kubernetes", "cicd"}:
                data.cloud_technologies.append(formatted)
            else:
                data.tools_and_technologies.append(formatted)

        data.technical_skills = list(data.all_skills())

        # 4. Extract Experience Years (defaults strictly to 0.0 if not identifiable)
        data.total_experience_years = 0.0
        exp_matches = re.findall(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?", text_lower)
        if exp_matches:
            try:
                data.total_experience_years = max(float(x) for x in exp_matches)
            except ValueError:
                data.total_experience_years = 0.0

        # 5. Extract Education
        edu_patterns = [
            (r"(?:bachelor|b\.s\.|b\.tech|b\.e\.|bs|ba)\s*(?:of|in)?\s*([a-zA-Z\s]+)?", "Bachelor's Degree"),
            (r"(?:master|m\.s\.|m\.tech|ms|ma|mba)\s*(?:of|in)?\s*([a-zA-Z\s]+)?", "Master's Degree"),
            (r"(?:ph\.?d|doctorate)\s*(?:of|in)?\s*([a-zA-Z\s]+)?", "Ph.D."),
            (r"(?:associate|a\.s\.)\s*(?:of|in)?\s*([a-zA-Z\s]+)?", "Associate Degree"),
        ]
        for pattern, degree_label in edu_patterns:
            match = re.search(pattern, text_lower)
            if match:
                field = match.group(1).strip().title() if match.group(1) else None
                if field and len(field) > 40:
                    field = field[:40]
                data.education.append(EducationItem(degree=degree_label, field=field))
                break

        # 6. Extract Projects & Evidence blocks
        project_headers = ["projects", "personal projects", "academic projects", "key projects"]
        in_projects = False
        project_lines = []
        for line in lines:
            if any(h in line.lower() for h in project_headers) and len(line) < 30:
                in_projects = True
                continue
            elif in_projects:
                if any(sec in line.lower() for sec in ["experience", "education", "skills", "certifications", "interests"]) and len(line) < 30:
                    in_projects = False
                    break
                project_lines.append(line)

        if project_lines:
            proj_title = "Featured Projects"
            proj_desc = " ".join(project_lines[:4])
            data.projects.append(ProjectItem(
                title=proj_title,
                description=proj_desc[:300],
                technologies=[s for s in data.technical_skills if s.lower() in proj_desc.lower()]
            ))

        return data

    def extract_job(self, jd_text: str) -> ExtractedJobData:
        data = ExtractedJobData(raw_text=jd_text)
        if not jd_text:
            return data

        lines = [line.strip() for line in jd_text.split("\n") if line.strip()]
        if lines:
            data.job_title = lines[0][:80]

        # Partition text into Required vs Preferred sections
        required_text = []
        preferred_text = []
        current_section = "required"

        for line in lines:
            line_lower = line.lower()
            if any(p in line_lower for p in ["preferred", "nice to have", "bonus", "desirable", "good to have", "plus"]):
                current_section = "preferred"
            elif any(r in line_lower for r in ["required", "requirements", "must have", "qualifications", "minimum qualifications", "what you need"]):
                current_section = "required"

            if current_section == "required":
                required_text.append(line)
            else:
                preferred_text.append(line)

        req_blob = " ".join(required_text).lower()
        pref_blob = " ".join(preferred_text).lower()
        full_blob = jd_text.lower()

        # Extract skills and partition into required vs preferred
        for skill in KNOWN_SKILLS:
            pattern = r"(?:\b|_)" + re.escape(skill) + r"(?:\b|_)"
            formatted = skill.capitalize() if len(skill) > 3 else skill.upper()

            if re.search(pattern, pref_blob) and not re.search(pattern, req_blob):
                data.preferred_skills.append(formatted)
            elif re.search(pattern, full_blob):
                data.required_skills.append(formatted)

        # Extract required experience years
        normalized_blob = re.sub(r"[\u2013\u2014\u2212\ufffd]", "-", full_blob)

        # 1. Range expressions (e.g. "0-1 years", "0 to 1 years", "1-2 years")
        range_match = re.search(
            r"(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?",
            normalized_blob,
        )

        # 2. Entry-level / Intern / Freshers / No Experience keywords
        entry_patterns = [
            r"no\s+(?:prior\s+)?experience\s+(?:required|needed)",
            r"without\s+(?:prior\s+)?experience",
            r"freshers?\s+(?:welcome|can apply|preferred)?",
            r"fresh\s+graduate",
            r"entry[- ]level",
            r"internship(?:\s+role)?",
            r"sde\s+intern",
            r"engineering\s+intern",
            r"less\s+than\s+1\s+year",
            r"under\s+1\s+year",
            r"\b0\s*(?:years?|yrs?)",
        ]
        is_entry_or_intern = any(re.search(p, normalized_blob) for p in entry_patterns)

        if range_match:
            min_y = float(range_match.group(1))
            max_y = float(range_match.group(2))
            data.required_experience_years = min_y
            data.preferred_experience_years = max_y
        elif is_entry_or_intern:
            data.required_experience_years = 0.0
        else:
            # 3. Minimum / Plus expressions (e.g. "1+ years", "minimum 2 years", "at least 3 years")
            min_match = re.search(r"(?:minimum|at least|min)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)", normalized_blob)
            if min_match:
                try:
                    data.required_experience_years = float(min_match.group(1))
                except ValueError:
                    data.required_experience_years = 0.0
            else:
                plus_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?", normalized_blob)
                if plus_match:
                    try:
                        data.required_experience_years = float(plus_match.group(1))
                    except ValueError:
                        data.required_experience_years = 0.0
                else:
                    data.required_experience_years = 0.0

        # Extract education requirements
        if any(w in full_blob for w in ["bachelor", "b.s.", "b.tech", "degree in computer science"]):
            data.education_requirements = "Bachelor's degree in Computer Science, Engineering, or related technical field"
        elif any(w in full_blob for w in ["master", "m.s.", "m.tech", "mba"]):
            data.education_requirements = "Master's degree or equivalent technical experience"

        return data

    def generate_explanation(
        self,
        resume_data: ExtractedResumeData,
        job_data: ExtractedJobData,
        overall_score: float,
        matched_skills: List[str],
        missing_skills: List[str],
        partial_skills: List[str],
        critical_missing: List[str],
    ) -> Tuple[str, List[str]]:
        reasons = []
        recommendations = []

        # Explainable Rationale
        if matched_skills:
            top_matched = ", ".join(matched_skills[:5])
            reasons.append(f"Demonstrates verified qualification in core competencies including {top_matched}.")
        
        if partial_skills:
            top_partial = ", ".join(partial_skills[:3])
            reasons.append(f"Shows partial exposure or related background in {top_partial}.")

        if critical_missing:
            crit_str = ", ".join(critical_missing[:3])
            reasons.append(f"Lacks direct evidence in the resume for mandatory requirements: {crit_str}.")
        elif missing_skills:
            miss_str = ", ".join(missing_skills[:3])
            reasons.append(f"Opportunity to demonstrate further qualifications in {miss_str}.")

        if job_data.required_experience_years and resume_data.total_experience_years:
            if resume_data.total_experience_years >= job_data.required_experience_years:
                reasons.append(f"Meets or exceeds the stated experience threshold ({resume_data.total_experience_years} years vs. {job_data.required_experience_years} required).")
            else:
                reasons.append(f"Experience length ({resume_data.total_experience_years} years) is below target expectation ({job_data.required_experience_years} years).")

        explanation = " ".join(reasons) if reasons else f"Overall qualification alignment calculated at {int(overall_score)}% based on verified resume evidence."

        # Actionable Recommendations for Job Seeker
        if critical_missing:
            for skill in critical_missing[:3]:
                recommendations.append(
                    f"If you have genuine experience with {skill}, highlight specific projects or implementations featuring it in your resume."
                )

        if missing_skills and not critical_missing:
            for skill in missing_skills[:2]:
                recommendations.append(
                    f"If you have worked with {skill}, consider detailing that technical exposure in your work history or personal projects."
                )

        if resume_data.projects:
            recommendations.append(
                "Ensure your project descriptions clearly articulate the problem solved, architecture used, and quantifiable results achieved."
            )
        else:
            recommendations.append(
                "Consider adding a dedicated Projects section to your resume to showcase hands-on technology implementations."
            )

        return explanation, recommendations
