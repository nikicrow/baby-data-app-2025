import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings

# Import routers
from app.api import analytics, babies, feeding, sleep, diaper, growth, health

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Baby Data API",
    description="Modern baby data tracking API built with FastAPI",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# "/" now serves the frontend (see the SPA block at the bottom), so the API
# banner lives under the API prefix.
@app.get(f"{settings.API_V1_STR}/")
async def root():
    return {"message": "Baby Data API - Ready to track your little one's data! 👶"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

# Include routers
app.include_router(babies.router, prefix=f"{settings.API_V1_STR}/babies", tags=["babies"])
app.include_router(feeding.router, prefix=f"{settings.API_V1_STR}/feeding", tags=["feeding"])
app.include_router(sleep.router, prefix=f"{settings.API_V1_STR}/sleep", tags=["sleep"])
app.include_router(diaper.router, prefix=f"{settings.API_V1_STR}/diaper", tags=["diaper"])
app.include_router(growth.router, prefix=f"{settings.API_V1_STR}/growth", tags=["growth"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["health"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])

# --- Frontend -----------------------------------------------------------------
# Serve the built SPA from the same origin as the API. Registered last so every
# API route above wins the match. This is what lets the Tailscale deployment be
# a single URL with no CORS entry and no VITE_API_URL baked into the bundle.
FRONTEND_DIST = settings.FRONTEND_DIST.resolve()
INDEX_HTML = FRONTEND_DIST / "index.html"

if INDEX_HTML.is_file():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # A miss under the API prefix is a real 404, not an SPA route -- without
        # this a typo'd endpoint would return index.html and confuse the client.
        if f"/{full_path}".startswith(settings.API_V1_STR):
            raise HTTPException(status_code=404, detail="Not Found")

        candidate = (FRONTEND_DIST / full_path).resolve()
        if (
            full_path
            and candidate.is_relative_to(FRONTEND_DIST)
            and candidate.is_file()
        ):
            return FileResponse(candidate)

        # BrowserRouter deep links (/insights, /activityhistory) must survive a
        # refresh, so anything else falls back to the app shell.
        return FileResponse(INDEX_HTML)
else:
    logger.warning(
        "No frontend build at %s - serving the API only. "
        "Run 'npm run build' in frontend/ to enable single-origin serving.",
        FRONTEND_DIST,
    )
