from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.config import settings

# For SQLite, we need to disable same thread checking
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    """Database session dependency to be used in endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
