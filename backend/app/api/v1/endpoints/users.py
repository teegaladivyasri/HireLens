from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.auth import UserResponse
from app.api.v1.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return current_user
