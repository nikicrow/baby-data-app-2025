from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import routers
from app.api import babies, feeding, sleep, diaper, growth, health

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

@app.get("/")
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