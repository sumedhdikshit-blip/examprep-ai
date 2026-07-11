from datetime import datetime
from pydantic import BaseModel

class DocumentBase(BaseModel):
    filename: str
    file_type: str  # 'pdf' | 'md' | 'docx' | 'pptx'
    status: str = "uploaded"

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    upload_date: datetime
    error_message: str | None = None

    class Config:
        from_attributes = True
