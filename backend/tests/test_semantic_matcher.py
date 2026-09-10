import unittest
from app.ai_matching.semantic import SemanticMatcher

class TestSemanticMatcher(unittest.TestCase):
    def setUp(self):
        self.matcher = SemanticMatcher()

    def test_canonical_programming_languages_distinct(self):
        """Java and JavaScript must NEVER be treated as equivalent."""
        self.assertFalse(self.matcher.are_equivalent("Java", "JavaScript"))
        self.assertFalse(self.matcher.are_equivalent("JavaScript", "Java"))
        self.assertFalse(self.matcher.are_equivalent("java", "javascript"))

    def test_c_family_distinct(self):
        """C, C++, C#, and CSS must be kept strictly distinct."""
        self.assertFalse(self.matcher.are_equivalent("C", "CSS"))
        self.assertFalse(self.matcher.are_equivalent("C", "C++"))
        self.assertFalse(self.matcher.are_equivalent("C", "C#"))
        self.assertFalse(self.matcher.are_equivalent("C++", "C#"))
        self.assertFalse(self.matcher.are_equivalent("CSS", "C"))

    def test_python_and_frameworks_distinct(self):
        """Python should not match Django or Flask; Go should not match Django."""
        self.assertFalse(self.matcher.are_equivalent("Python", "Django"))
        self.assertFalse(self.matcher.are_equivalent("Go", "Django"))
        self.assertFalse(self.matcher.are_equivalent("Rust", "Ruby"))

    def test_canonical_aliases_match(self):
        """Standard industry aliases should be recognized as equivalent."""
        self.assertTrue(self.matcher.are_equivalent("golang", "go"))
        self.assertTrue(self.matcher.are_equivalent("cpp", "c++"))
        self.assertTrue(self.matcher.are_equivalent("csharp", "c#"))
        self.assertTrue(self.matcher.are_equivalent("js", "javascript"))
        self.assertTrue(self.matcher.are_equivalent("ts", "typescript"))
        self.assertTrue(self.matcher.are_equivalent("react", "react.js"))
        self.assertTrue(self.matcher.are_equivalent("postgres", "postgresql"))

    def test_substring_containment_prevention(self):
        """Verifies short tokens do not trigger substring false positives in text."""
        doc_text = "Experienced in Go development and Django backend architecture."
        # 'go' should find 'Go' as a word, but not inside 'Django'
        found_go, _ = self.matcher.find_evidence_in_text("Go", doc_text)
        found_django, _ = self.matcher.find_evidence_in_text("Django", doc_text)
        found_java, _ = self.matcher.find_evidence_in_text("Java", doc_text)

        self.assertTrue(found_go)
        self.assertTrue(found_django)
        self.assertFalse(found_java)

if __name__ == "__main__":
    unittest.main()
