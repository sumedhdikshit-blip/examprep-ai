# ExamPrep AI - Day 2: Text Extraction & Chunking Pipeline

Welcome to **ExamPrep AI** (Day 2 of 8-day build). This is a full-stack application designed to help students upload study materials, extract text, split it into chunks, and store those chunks in the database to generate practice questions and solutions.

---

## Features (Implemented so far)

- **JWT Authentication**: User signup, secure login, password hashing (bcrypt), and session persistence.
- **Multi-Format File Uploads**: Support for PDF, Markdown (`.md`), Word (`.docx`), and PowerPoint (`.pptx`) documents.
- **Text Extraction Service**: Page-by-page clean text parsing for PDFs, slides, and Word files, with graceful error handling.
- **Smart Chunking Pipeline**: Splits documents into ~400-600 word chunks on paragraph/sentence boundaries, mapping each chunk to its corresponding page or slide.
- **Dynamic Dashboard UI**: Manage uploads, trigger processing, view extracted chunks in a dedicated panel, and track processing states (`UPLOADED`, `PROCESSING`, `CHUNKED`, `FAILED`).

---

## Tech Stack

- **Backend**: FastAPI, Uvicorn, Python-docx, Python-pptx, Pdfplumber, SQLAlchemy
- **Database**: SQLite
- **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript (served statically by FastAPI)

---

## Project Structure

```
/examprep-ai
├── requirements.txt      # Pinned Python package dependencies
├── .env.example          # Environment template configuration
├── .env                  # Active environment configuration (local only)
├── README.md             # Project documentation and roadmap
├── backend/
│   ├── main.py           # Application entry point, configuration & database migrations
│   ├── database.py       # DB engine & connection session handlers
│   ├── config.py         # App configuration settings (Pydantic-Settings)
│   ├── models/           # SQLAlchemy DB Models
│   │   ├── __init__.py
│   │   ├── base.py       # Declarative base
│   │   ├── user.py       # User table schema
│   │   ├── document.py   # Document metadata table schema
│   │   └── chunk.py      # Text chunk schema (Day 2)
│   ├── schemas/          # Pydantic schemas (Serialization & Request Validation)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── document.py
│   │   └── chunk.py      # Chunk response validation schema (Day 2)
│   ├── routers/          # API Routers
│   │   ├── __init__.py
│   │   ├── auth.py       # /auth/signup, /auth/login, /auth/me
│   │   └── documents.py  # Uploading, processing, and chunk retrieval
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py # Hashing, token creation, security dependencies
│   │   ├── extraction_service.py # Parses text from .md, .pdf, .docx, and .pptx (Day 2)
│   │   └── chunking_service.py   # Paragraph and sentence-level text chunker (Day 2)
│   └── uploads/          # Local storage folder for uploaded study materials
├── test_files/           # Test documents
│   ├── generate_test_files.py # Helper script to create valid MD, DOCX, PPTX, PDF files
│   └── sample.pdf        # Corrupt file sample
└── frontend/             # Statically-served user interface
    ├── css/
    │   └── style.css     # Clean modern UI style guide and status animations
    ├── js/
    │   ├── auth.js       # Auth helpers (tokens, cookies, redirects)
    │   └── dashboard.js  # Dashboard UI state controller (lists, uploads, actions, chunks)
    ├── index.html        # Entry index router
    ├── signup.html       # User signup form
    ├── login.html        # User login form
    └── dashboard.html    # User file manager and chunk browser dashboard
```

---

## Prerequisites

- **Python 3.10+** (Recommended)
- **pip** (Python package installer)

---

## Installation & Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd examprep-ai
   ```

2. **Create a Python Virtual Environment:**
   On Windows (PowerShell):
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   On macOS/Linux:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify Environment Variables:**
   A `.env` file was automatically created for you, but you can configure database details or secret keys inside it:
   ```env
   DATABASE_URL=sqlite:///./exam_prep.db
   JWT_SECRET_KEY=supersecretkeychangeinproduction12345
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=backend/uploads
   ```

---

## Running the Application

Start the FastAPI application using `uvicorn`:

```bash
uvicorn backend.main:app --reload
```

The server will launch at: **`http://127.0.0.1:8000`**

Open `http://127.0.0.1:8000` in your web browser. You will be automatically redirected to the Login page.

---

## Verification & Testing Steps

1. **Generate Test Files**:
   Generate valid sample test files in `test_files/` folder (including downloading a valid PDF, creating a multi-page DOCX, and creating a multi-slide PPTX) by running:
   ```bash
   python test_files/generate_test_files.py
   ```
2. **Log In/Register**:
   Register a new user at `http://127.0.0.1:8000/signup.html`.
3. **Upload Files**:
   Upload files from `test_files/` directory (`valid_sample.md`, `valid_sample.docx`, `valid_sample.pptx`, `valid_sample.pdf`, and the corrupt `sample.pdf`).
4. **Trigger Processing**:
   Click **Process** next to each file.
   - The button will display a loading spinner and say "Processing...".
   - The status of valid documents will change to `CHUNKED` and display a success toast ("Document processed successfully — X chunks created").
   - The status of the corrupt document will change to `FAILED ⚠️`, showing the parsing error details in a tooltip.
5. **View Chunks**:
   Click **View Chunks** on a processed file to expand the viewer card at the bottom of the dashboard, showing the chunk indexes, approximate page locations, and text content.

---

## Project Roadmap

- [x] **Day 1**: Authentication, file upload, database foundation, dashboard UI.
- [x] **Day 2**: Text extraction (PDF/MD/Word/Slides), chunking service, database storage, and UI status interactions.
- [ ] **Day 3**: Embeddings generation, vector database indexing (Chroma/FAISS), and RAG search pipeline.
- [ ] **Day 4**: AI core integration, prompt engineering, and quiz generation service.
- [ ] **Day 5**: Frontend quiz experience, interactive quiz session rendering, and scoring logic.
- [ ] **Day 6**: Spaced repetition algorithm, review schedule system, and retention charts.
- [ ] **Day 7**: Multi-user billing/tiers, limits enforcement, and performance optimizations.
- [ ] **Day 8**: Final end-to-end integration, deployment guidelines, and production debugging.
