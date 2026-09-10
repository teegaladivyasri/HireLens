import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events: initialize database tables and directories on startup."""
    os.makedirs(os.path.abspath(settings.UPLOAD_DIR), exist_ok=True)
    os.makedirs(os.path.abspath(settings.TEMP_DIR), exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="AI-powered Resume Screening & Job Matching Platform API",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "api_v1": "/api/v1",
        "health": "/api/v1/health",
    }
