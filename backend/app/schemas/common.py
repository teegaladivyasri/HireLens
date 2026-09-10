from datetime import datetime, timezone
from typing import Any, Optional, Annotated
from pydantic import BaseModel, PlainSerializer


def serialize_utc_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Serialize datetime to ISO-8601 string with UTC indicator (Z)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


UtcDateTime = Annotated[datetime, PlainSerializer(serialize_utc_datetime, return_type=str, when_used="json")]


class HealthCheckResponse(BaseModel):
    status: str
    app: str
    environment: str
    database: str
    version: str


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
