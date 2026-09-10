import re
from typing import Optional, Tuple, Set, Dict, List

# Comprehensive tech alias and synonym registry
TECH_ALIASES: Dict[str, Set[str]] = {
    "react": {"react", "react.js", "reactjs", "react-native", "react native"},
    "postgresql": {"postgresql", "postgres", "psql", "pgsql"},
    "nodejs": {"nodejs", "node.js", "node", "node js"},
    "typescript": {"typescript", "ts"},
    "javascript": {"javascript", "js", "ecmascript", "es6", "es6+"},
    "java": {"java", "core java", "java 8", "java 11", "java 17", "java 21", "jvm"},
    "python": {"python", "python3", "py"},
    "c": {"c", "c language", "ansi c", "c programming"},
    "cpp": {"c++", "cpp", "c plus plus"},
    "csharp": {"c#", "csharp", "c sharp", ".net", "dotnet", "asp.net"},
    "golang": {"go", "golang"},
    "rust": {"rust", "rustlang"},
    "php": {"php", "php7", "php8"},
    "ruby": {"ruby", "ruby on rails", "rails"},
    "swift": {"swift", "swiftui"},
    "kotlin": {"kotlin"},
    "docker": {"docker", "containerization", "containers", "dockerfile", "docker-compose"},
    "kubernetes": {"kubernetes", "k8s"},
    "fastapi": {"fastapi", "fast-api"},
    "django": {"django", "django rest framework", "drf"},
    "flask": {"flask"},
    "aws": {"aws", "amazon web services", "ec2", "s3", "lambda", "rds", "cloudwatch", "iam"},
    "gcp": {"gcp", "google cloud platform", "google cloud", "bigquery"},
    "azure": {"azure", "microsoft azure"},
    "git": {"git", "github", "gitlab", "bitbucket", "version control"},
    "cicd": {"ci/cd", "ci-cd", "cicd", "github actions", "jenkins", "continuous integration", "continuous deployment"},
    "mongodb": {"mongodb", "mongo"},
    "redis": {"redis", "caching", "in-memory cache"},
    "graphql": {"graphql", "apollo"},
    "rest": {"rest", "rest api", "restful", "restful api", "rest apis", "restful apis"},
    "sql": {"sql", "relational database", "rdbms", "mysql", "sqlite"},
    "html": {"html", "html5"},
    "css": {"css", "css3", "sass", "scss", "less"},
    "tailwind": {"tailwind", "tailwindcss", "tailwind-css"},
    "vue": {"vue", "vue.js", "vuejs"},
    "angular": {"angular", "angularjs"},
    "nextjs": {"nextjs", "next.js", "next"},
    "testing": {"testing", "unit testing", "pytest", "jest", "unittest", "automated testing", "integration testing"},
    "microservices": {"microservices", "microservice architecture", "distributed systems"},
    "linux": {"linux", "ubuntu", "debian", "centos", "bash", "shell scripting"},
    "pydantic": {"pydantic"},
    "sqlalchemy": {"sqlalchemy", "orm"},
    "pandas": {"pandas", "numpy", "data analysis"},
    "machine learning": {"machine learning", "ml", "deep learning", "ai", "artificial intelligence"},
}

# Reverse lookup dictionary: alias -> canonical key
ALIAS_TO_CANONICAL: Dict[str, str] = {}
for canonical, aliases in TECH_ALIASES.items():
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical


class SemanticMatcher:
    """Evaluates semantic equivalence and extracts authentic evidence from document text."""

    @staticmethod
    def get_canonical(term: str) -> str:
        """Return canonical technology key if recognized, else normalized lowercase string."""
        if not term:
            return ""
        normalized = re.sub(r"[^\w\s.+/#-]", "", term.lower()).strip()
        # Direct lookup
        if normalized in ALIAS_TO_CANONICAL:
            return ALIAS_TO_CANONICAL[normalized]
        # Cleaned without punctuation (e.g. "c++" -> "cpp" if matched, or "node.js" -> "nodejs")
        stripped = re.sub(r"[^\w]", "", normalized)
        if stripped in ALIAS_TO_CANONICAL:
            return ALIAS_TO_CANONICAL[stripped]
        return normalized

    @staticmethod
    def are_equivalent(term1: str, term2: str) -> bool:
        """Determine if two skill/technology names represent equivalent competencies."""
        if not term1 or not term2:
            return False
        c1 = SemanticMatcher.get_canonical(term1)
        c2 = SemanticMatcher.get_canonical(term2)
        if c1 == c2:
            return True

        # Exact case-insensitive match
        t1 = term1.strip().lower()
        t2 = term2.strip().lower()
        if t1 == t2:
            return True

        return False

    @staticmethod
    def find_evidence_in_text(target: str, text: str) -> Tuple[bool, Optional[str]]:
        """
        Scan text for target skill or any of its recognized synonyms.
        If located, extracts the surrounding sentence or bullet point as authentic evidence.
        Returns (is_found, evidence_snippet).
        """
        if not target or not text:
            return False, None

        canonical = SemanticMatcher.get_canonical(target)
        search_terms = set(TECH_ALIASES.get(canonical, set()))
        search_terms.add(target.lower().strip())

        # Split document into sentences and bullets
        paragraphs = text.split("\n")
        units = []
        for p in paragraphs:
            # Split by period followed by space or bullet
            subunits = re.split(r"(?<=[.!?])\s+|[•\-\*\t]", p)
            units.extend(subunits)

        for unit in units:
            unit_clean = unit.strip()
            if not unit_clean or len(unit_clean) < 4:
                continue

            unit_lower = unit_clean.lower()
            for term in search_terms:
                if not term:
                    continue
                # For single-character terms like 'c', enforce stricter word boundary
                if len(term) <= 2:
                    pattern = r"(?<!\w)" + re.escape(term) + r"(?!\w)"
                else:
                    pattern = r"(?:\b|_)" + re.escape(term) + r"(?:\b|_)"

                if re.search(pattern, unit_lower):
                    # Clean up snippet
                    snippet = unit_clean.strip(" •-*")
                    if len(snippet) > 200:
                        snippet = snippet[:197] + "..."
                    return True, snippet

        return False, None
