from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import os
import shutil

from backend.database import get_db
from backend.models.document import Document
from backend.models.user import User
from backend.models.chunk import Chunk
from backend.schemas.document import DocumentResponse
from backend.schemas.chunk import ChunkResponse
from backend.services.auth_service import get_current_user
from backend.services.extraction_service import extract_text
from backend.services.chunking_service import chunk_text
from backend.config import settings

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".md", ".docx", ".pptx"}

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename cannot be empty"
        )
        
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed. Only .pdf, .md, .docx, and .pptx are supported."
        )
    
    file_type = ext[1:]  # e.g., 'pdf', 'md', 'docx', 'pptx'
    
    # 1. Create Document record in database
    db_document = Document(
        user_id=current_user.id,
        filename=filename,
        file_type=file_type,
        status="uploaded"
    )
    
    # Increment user's upload counter if applicable
    if file_type == "pdf":
        current_user.pdf_uploads_this_month += 1
    elif file_type == "md":
        current_user.md_uploads_this_month += 1
        
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # 2. Save file to disk using the db_document.id as prefix to prevent collisions
    disk_filename = f"{db_document.id}_{filename}"
    file_path = os.path.join(settings.upload_dir, disk_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        # Rollback DB changes if file saving fails
        db.delete(db_document)
        if file_type == "pdf":
            current_user.pdf_uploads_this_month -= 1
        elif file_type == "md":
            current_user.md_uploads_this_month -= 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file to server storage: {str(e)}"
        )
        
    return db_document

@router.get("", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all documents belonging to the authenticated user."""
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return documents

@router.post("/{document_id}/process", response_model=DocumentResponse)
def process_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger text extraction and chunking for the specified document."""
    # 1. Fetch document and verify ownership
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    # 2. Update status to 'processing' and clear previous errors
    doc.status = "processing"
    doc.error_message = None
    db.commit()
    db.refresh(doc)

    # 3. Perform text extraction and chunking
    file_path = os.path.join(settings.upload_dir, f"{doc.id}_{doc.filename}")
    
    try:
        # Extract text page-by-page
        pages = extract_text(file_path, doc.file_type)
        
        # Chunk text
        chunks = chunk_text(pages)
        
        # Delete any existing chunks for this document to support reprocessing
        db.query(Chunk).filter(Chunk.document_id == doc.id).delete()
        
        # Save chunks to database
        for idx, chunk in enumerate(chunks):
            db_chunk = Chunk(
                document_id=doc.id,
                chunk_text=chunk["text"],
                chunk_index=idx,
                page_number=chunk["page_number"]
            )
            db.add(db_chunk)
            
        doc.status = "chunked"
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        # Update status to 'extraction_failed' and log the error message
        doc.status = "extraction_failed"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)
        
    return doc

@router.get("/{document_id}/chunks", response_model=list[ChunkResponse])
def get_document_chunks(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all chunks belonging to a document, verified by owner."""
    # 1. Fetch document and verify ownership
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )
        
    # 2. Get chunks sorted by index
    chunks = db.query(Chunk).filter(Chunk.document_id == document_id).order_by(Chunk.chunk_index).all()
    return chunks
