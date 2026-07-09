from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    plan = Column(String, default="free", nullable=False)
    pdf_uploads_this_month = Column(Integer, default=0, nullable=False)
    md_uploads_this_month = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship to user's documents
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

