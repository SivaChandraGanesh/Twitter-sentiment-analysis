"""
Database connection and session management using SQLModel and SQLite.
"""
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./database/db.sqlite"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def create_db_and_tables():
    """Create all tables on startup."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Yield a database session (for use in routes as a dependency)."""
    with Session(engine) as session:
        yield session
