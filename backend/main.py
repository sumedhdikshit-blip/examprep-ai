import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine
from backend.models.base import Base
from backend import models
from backend.routers import auth_router, documents_router

# Migration helper for SQLite to add missing columns if they don't exist
def run_migrations():
    import sqlite3
    from backend.config import settings
    # Extract db path from sqlite:///db_path
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        db_path = db_url.replace("sqlite:///", "")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        try:
            # Check if error_message exists in documents
            cursor.execute("PRAGMA table_info(documents);")
            columns = [col[1] for col in cursor.fetchall()]
            if "error_message" not in columns:
                cursor.execute("ALTER TABLE documents ADD COLUMN error_message VARCHAR;")
                conn.commit()
                print("Successfully added error_message column to documents table.")
        except Exception as e:
            print("Migration error:", e)
        finally:
            conn.close()

# Initialize Database tables
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(
    title="ExamPrep AI",
    description="Day 1 Foundation - Auth, User, and File Uploads API",
    version="1.0.0"
)

# CORS middleware configuration (crucial if running frontend and backend on different origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits access from any origin for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(documents_router)

# Mount frontend static directory at "/"
# This serves index.html, login.html, signup.html, dashboard.html and assets
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.abspath(os.path.join(current_dir, "..", "frontend"))

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_dir}. Static file serving is disabled.")
