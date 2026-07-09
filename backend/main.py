import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine
from backend.models.base import Base
from backend.routers import auth_router, documents_router

# Initialize Database tables
Base.metadata.create_all(bind=engine)

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
