from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Engine configuration with connection pooling for PostgreSQL or SQLite check_same_thread
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """FastAPI dependency to yield a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables."""
    import app.models  # noqa: F401 - ensure models are registered
    Base.metadata.create_all(bind=engine)

    # Safe auto-migration for newly added columns
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            if settings.DATABASE_URL.startswith("sqlite"):
                cursor = conn.exec_driver_sql("PRAGMA table_info(match_results)")
                cols = [c[1] for c in cursor.fetchall()]
                if "component_scores" not in cols and "id" in cols:
                    conn.exec_driver_sql("ALTER TABLE match_results ADD COLUMN component_scores JSON")
            else:
                conn.execute(text("ALTER TABLE match_results ADD COLUMN IF NOT EXISTS component_scores JSONB"))
    except Exception:
        pass
