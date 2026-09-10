import json
from typing import Tuple, List, Optional
import httpx
from app.ai_matching.providers.base import BaseAIProvider
from app.ai_matching.providers.native_provider import NativeAIProvider
from app.ai_matching.interfaces import ExtractedResumeData, ExtractedJobData


class GeminiAIProvider(BaseAIProvider):
    """Google Gemini AI Provider utilizing Gemini REST API with structured JSON output."""

    def __init__(self, api_key: str, model: Optional[str] = None):
        if not api_key:
            raise ValueError("Gemini AI Provider requires AI_API_KEY to be configured in .env.")
        self.api_key = api_key
        self.model = model or "gemini-1.5-flash"
        self.fallback = NativeAIProvider()

    def _call_gemini(self, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("Empty response from Gemini API.")
            text = candidates[0]["content"]["parts"][0]["text"]
            return text

    def extract_resume(self, resume_text: str) -> ExtractedResumeData:
        prompt = f"""
You are an expert HR document parser. Extract structured information from the following resume text into JSON format:
{{
  "candidate_name": string or null,
  "candidate_email": string or null,
  "personal_summary": string or null,
  "technical_skills": list of strings,
  "tools_and_technologies": list of strings,
  "programming_languages": list of strings,
  "frameworks": list of strings,
  "databases": list of strings,
  "cloud_technologies": list of strings,
  "total_experience_years": number or null
}}

Resume text:
\"\"\"{resume_text[:6000]}\"\"\"
"""
        try:
            raw_json = self._call_gemini(prompt)
            parsed = json.loads(raw_json)
            parsed["raw_text"] = resume_text
            return ExtractedResumeData(**parsed)
        except Exception:
            # Fallback to deterministic native extractor on network/model parsing failures
            return self.fallback.extract_resume(resume_text)

    def extract_job(self, jd_text: str) -> ExtractedJobData:
        prompt = f"""
You are an expert technical recruiter. Extract structured requirements from this job description into JSON:
{{
  "job_title": string or null,
  "required_skills": list of strings,
  "preferred_skills": list of strings,
  "programming_languages": list of strings,
  "frameworks": list of strings,
  "tools": list of strings,
  "databases": list of strings,
  "cloud_technologies": list of strings,
  "required_experience_years": number or null,
  "education_requirements": string or null,
  "key_responsibilities": list of strings
}}

Job description:
\"\"\"{jd_text[:6000]}\"\"\"
"""
        try:
            raw_json = self._call_gemini(prompt)
            parsed = json.loads(raw_json)
            parsed["raw_text"] = jd_text
            return ExtractedJobData(**parsed)
        except Exception:
            return self.fallback.extract_job(jd_text)

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
        # Always use deterministic evidence explanation for safety and consistency
        return self.fallback.generate_explanation(
            resume_data,
            job_data,
            overall_score,
            matched_skills,
            missing_skills,
            partial_skills,
            critical_missing,
        )
