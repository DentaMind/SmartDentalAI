"""
Database connection setup and session management for DentaMind
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Import settings from config module
from .config.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create base class for declarative models
Base = declarative_base()

# Create engine with appropriate pool settings
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=settings.DB_POOL_RECYCLE
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Add event listeners for connection pooling statistics
@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log when connections are checked out from the pool"""
    if settings.DEBUG:
        logger.debug(f"Connection checkout (active: {engine.pool.checkedout()})")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """Log when connections are checked in to the pool"""
    if settings.DEBUG:
        logger.debug(f"Connection checkin (active: {engine.pool.checkedout()})")

def get_db() -> Generator[Session, None, None]:
    """
    Get a database session from the pool
    
    Yields:
        Session: An SQLAlchemy session
        
    Usage:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            # Use db session here
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db() -> None:
    """
    Initialize database by creating all tables
    
    Use this for testing or initial setup only.
    For production, use Alembic migrations.
    """
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def get_engine():
    """Return the SQLAlchemy engine (for testing or direct access)"""
    return engine

def get_db_stats() -> dict:
    """
    Get database connection pool statistics
    
    Returns:
        dict: Statistics about the connection pool
    """
    stats = {
        "pool_size": engine.pool.size(),
        "checkedout": engine.pool.checkedout(),
        "overflow": engine.pool.overflow(),
        "checkedin": engine.pool.checkedin(),
    }
    return stats 