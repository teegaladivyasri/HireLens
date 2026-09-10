import enum


class CandidateWorkflowStatus(str, enum.Enum):
    NEW = "NEW"
    REVIEW = "REVIEW"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
