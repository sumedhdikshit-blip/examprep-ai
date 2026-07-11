from pydantic import BaseModel

class ChunkResponse(BaseModel):
    id: int
    chunk_index: int
    page_number: int | None = None
    chunk_text: str

    class Config:
        from_attributes = True
