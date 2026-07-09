from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.models.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'pdf' | 'md' | 'docx' | 'pptx'
    upload_date = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String, default="uploaded", nullable=False)

    # Optional: Relationship back to User model
    user = relationship("User", back_populates="documents")

# We should also add back_populates to User model later or just use backref. Let's update backend/models/user.py to include relationships or keep it simple. Let's write this file and then update User.
