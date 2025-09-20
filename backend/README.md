# Baby Data API

Modern baby data tracking API built with FastAPI.

## Setup

1. **Install uv** (if not already installed):
   ```bash
   # Windows
   pip install uv
   
   # Or use the official installer
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Create and activate virtual environment:**
   ```bash
   uv venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   uv pip install -e .
   ```

4. **Install development dependencies:**
   ```bash
   uv pip install -e ".[dev]"
   ```

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual database credentials
   ```

6. **Set up PostgreSQL database:**
   - Make sure PostgreSQL is installed and running
   - Create a database named `baby_data`
   - Update the database credentials in `.env`

## Running the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Code formatting
```bash
black app/
isort app/
```

### Type checking
```bash
mypy app/
```

### Running tests
```bash
pytest
```