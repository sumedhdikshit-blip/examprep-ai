# ExamPrep AI - Day 1 Foundation

Welcome to **ExamPrep AI** (Day 1 of 8-day build). This is a full-stack application designed to help students upload study materials and generate practice questions and solutions. 

This repository contains the Day 1 Foundation, including:
- **Backend**: FastAPI web app with JWT authentication and file upload validations.
- **Database**: SQLite database using SQLAlchemy ORM.
- **Frontend**: Vanilla HTML/CSS/JS (no heavy framework) served statically by the backend.

---

## Project Structure

```
/examprep-ai
├── requirements.txt      # Pinned Python package dependencies
├── .env.example          # Environment template configuration
├── .env                  # Active environment configuration (local only)
├── README.md             # Project documentation and setup guide
├── backend/
│   ├── main.py           # Application entry point & configuration
│   ├── database.py       # DB engine & connection session handlers
│   ├── config.py         # App configuration settings (Pydantic-Settings)
│   ├── models/           # SQLAlchemy DB Models
│   │   ├── __init__.py
│   │   ├── base.py       # Declarative base
│   │   ├── user.py       # User table schema
│   │   └── document.py   # Document metadata table schema
│   ├── schemas/          # Pydantic schemas (Serialization & Request Validation)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── document.py
│   ├── routers/          # API Routers
│   │   ├── __init__.py
│   │   ├── auth.py       # /auth/signup, /auth/login, /auth/me
│   │   └── documents.py  # /documents/upload, /documents
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py # Hashing, token creation, security dependencies
│   └── uploads/          # Local storage folder for uploaded study materials
└── frontend/             # Statically-served user interface
    ├── css/
    │   └── style.css     # Clean modern UI style guide
    ├── js/
    │   ├── auth.js       # Auth helpers (tokens, cookies, redirects)
    │   └── dashboard.js  # Dashboard UI state controller (lists, uploads)
    ├── index.html        # Entry index router
    ├── signup.html       # User signup form
    ├── login.html        # User login form
    └── dashboard.html    # User file manager dashboard
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

## Manual Verification Steps

Follow these step-by-step instructions to verify the setup:

1. **Sign Up:**
   - Open your browser to `http://127.0.0.1:8000` (redirects to `login.html`).
   - Click **Sign Up** to navigate to `signup.html`.
   - Enter your name (e.g. `Jane Doe`), email (`jane@example.com`), and a password (at least 6 characters).
   - Click **Create Account**.
   - Upon successful signup, you'll be logged in automatically (JWT token stored in `localStorage` as `examprep_jwt`) and redirected to `dashboard.html`.

2. **Log Out & Log Back In:**
   - On the top right of the dashboard, click **Log Out**.
   - You should see a notification, your session token will be cleared, and you'll be redirected back to `login.html`.
   - Attempt to navigate directly to `http://127.0.0.1:8000/dashboard.html` in your browser. Verify you are automatically redirected to `login.html`.
   - On `login.html`, log back in using your registered email (`jane@example.com`) and password. Verify you land back on `dashboard.html`.

3. **Upload Valid Files:**
   - On the left side of the dashboard, click inside the dashed dragzone or drag a file to select it.
   - Select a sample `.pdf` file. Click **Upload Document**.
   - Confirm a success notification appears, the file selection resets, and the file is added to the table list on the right.
   - Repeat the upload process for the remaining allowed file formats:
     - `.md` (Markdown)
     - `.docx` (Word)
     - `.pptx` (PowerPoint)
   - Review the document table list. Verify that all 4 files appear correctly with their respective file type badge, upload timestamp, and status set to `UPLOADED`.

4. **Verify Storage on disk:**
   - Open the directory `/backend/uploads` inside the project folder.
   - Verify that your uploaded files exist on the disk, prefixed by their auto-incrementing database ID (e.g. `1_sample.pdf`, `2_doc.md`).

5. **Test Invalid File Rejection:**
   - Try selecting a file with an invalid extension, such as a photo (`.jpg` or `.png`).
   - Drag/select the file. Verify that the UI displays a clear error warning and prevents submission, or if forced, the backend API rejects the request with a clear `HTTP 400 Bad Request` detail message.
