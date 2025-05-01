from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from ..services.security_service import SecurityService
from ..database import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_security_service(db: Session = Depends(get_db)) -> SecurityService:
    """Get security service instance."""
    return SecurityService(db) 