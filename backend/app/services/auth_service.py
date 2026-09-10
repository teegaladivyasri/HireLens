from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """Authentication and User management business logic."""

    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        """Register a new user with hashed password."""
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        hashed_pw = hash_password(user_in.password)
        db_user = User(
            name=user_in.name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=hashed_pw,
            role=user_in.role,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Token:
        """Authenticate user and return signed JWT token."""
        user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            subject=user.id,
            role=user.role.value,
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            name=user.name,
            email=user.email,
        )

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
