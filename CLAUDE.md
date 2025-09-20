# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern baby data tracking application project featuring:

- **Backend**: FastAPI-based REST API with PostgreSQL database
- **Frontend**: Planned Next.js 13+ with TypeScript (not yet implemented)
- **Architecture**: Mobile-first Progressive Web App (PWA) for tracking baby care activities

## Key Development Commands

### Backend Development (backend/ directory)

```bash
# Setup virtual environment
py -m uv venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
py -m uv pip install -e .
py -m uv pip install -e ".[dev]"

# Run the API server
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Code quality and testing
black app/
isort app/
mypy app/
pytest
```

### Database Operations

```bash
# Run migrations (from backend/ directory)
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

## Architecture Overview

### Backend Structure (FastAPI)

```
backend/app/
├── core/           # Configuration, database setup
├── models/         # SQLAlchemy ORM models for baby data
├── schemas/        # Pydantic schemas for API validation
├── api/            # API routes (to be implemented)
├── tests/          # Test suite
└── main.py         # FastAPI application entry point
```

### Data Models

The application tracks 5 core baby data categories:

1. **BabyProfile**: Central entity with basic info (name, DOB, birth stats)
2. **DiaperEvent**: Detailed diaper tracking with urine/stool data
3. **FeedingSession**: Unified model for breast, bottle, and solid feeding
4. **SleepSession**: Sleep tracking with duration and quality metrics
5. **GrowthMeasurement**: Weight, length, head circumference tracking
6. **HealthEvent**: Medical events, vaccinations, milestones

All models use UUID primary keys and include proper foreign key relationships to BabyProfile.

### Technology Stack

- **Backend**: FastAPI 0.100+, SQLAlchemy 2.0, PostgreSQL, Pydantic v2
- **Development**: uv for dependency management, pytest, black, isort, mypy
- **Database**: PostgreSQL with Alembic migrations
- **Future Frontend**: Next.js 13+ with TypeScript, Tailwind CSS

## API Access

When backend is running:

- API server: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

- Database credentials (PostgreSQL)
- API settings
- CORS origins for frontend integration

## Development Notes

- Project follows modern Python practices with type hints throughout
- Uses uv instead of pip/poetry for faster dependency management
- Configured for mobile-first PWA development
- All timestamps should respect baby's timezone setting
- Code formatting: 100 character line length, Black + isort
