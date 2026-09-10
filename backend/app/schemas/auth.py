from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.common import UtcDateTime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    name: str
    email: str


class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: UtcDateTime

    class Config:
        from_attributes = True
