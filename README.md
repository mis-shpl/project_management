# Project Management

A project management application for creating projects and tracking their workflow steps, planned dates, completion status, and materials. The React interface communicates with a FastAPI backend, which stores project data in PostgreSQL.

## 🧰 Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, Tailwind CSS 4 |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Data | PostgreSQL, SQLAlchemy, Alembic |

## 📁 Project Structure

```text
project_management/
├── backend/
│   ├── app/
│   │   ├── api/v1/                 # Versioned API router
│   │   ├── core/                   # Shared backend definitions
│   │   ├── modules/
│   │   │   ├── projects/           # Project models, schemas, routes, services
│   │   │   ├── users/
│   │   │   └── workflow_steps/
│   │   ├── config.py               # Application settings
│   │   └── database.py             # SQLAlchemy database setup
│   ├── alembic/versions/           # Database migrations
│   ├── main.py                     # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI components
│   │   ├── services/api.js         # Backend API requests
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js              # Vite config and API proxy
├── documentation/
└── README.md
```

## ✅ Prerequisites

Install the following before starting:

- **Python 3.10 or newer** and `pip`
- **Node.js 20.19+ or 22.12+** and npm
- **PostgreSQL** (a running server and a database for this application)
- **Git**

## 🚀 Getting Started

### 1. Clone the project

Replace `<repository-url>` with the URL of your Git repository:

```bash
git clone <repository-url>
cd project_management
```

### 2. Set up the backend

From the project root, create and activate a virtual environment, then install the Python dependencies.

**Windows PowerShell:**

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Create a file named `backend/.env` with the connection URL for your PostgreSQL database:

```dotenv
DATABASE_URL=postgresql+psycopg2://<username>:<password>@localhost:5432/<database_name>
```

Replace the placeholders with your PostgreSQL username, password, and database name. Keep this file private; do not commit database credentials.

With the virtual environment active and your terminal still in `backend/`, apply the database migrations:

```bash
alembic upgrade head
```

### 3. Set up the frontend

Open another terminal at the project root and install the frontend dependencies:

```bash
cd frontend
npm ci
```

## ▶️ Running the Application

Run the backend and frontend in **separate terminals**. Start the backend from the `backend/` directory, with its virtual environment activated:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In the second terminal, start the frontend from the `frontend/` directory:

```bash
npm run dev
```

Open the Vite URL shown in the terminal (by default, <http://localhost:5173>). Vite is configured to forward `/api` requests to the backend at `http://127.0.0.1:8000`.

To run either part separately, use its command above; the frontend needs the backend and PostgreSQL database to load and save project data.

## 📖 API Documentation

FastAPI provides interactive Swagger documentation at **<http://127.0.0.1:8000/docs>** while the backend is running. The versioned API routes are served under `/api/v1`.