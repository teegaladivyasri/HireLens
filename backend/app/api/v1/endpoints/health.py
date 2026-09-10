from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.schemas.common import HealthCheckResponse
import app

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """System health check endpoint verifying database connectivity and service state."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthCheckResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        database=db_status,
        version=app.__version__,
    )
