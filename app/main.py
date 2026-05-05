from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.redis_client import redis_client
from app.routers import rooms, questions, gameplay, admin

app = FastAPI(
    title="Kahoot Clone API",
    description="AI-powered Kahoot clone backend built with FastAPI and Redis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rooms.router)
app.include_router(questions.router)
app.include_router(gameplay.router)
app.include_router(admin.router)


@app.on_event("startup")
async def startup_event():
    """Initialize Redis connection on startup."""
    if not redis_client.health_check():
        print("Warning: Could not connect to Redis")
    else:
        redis_client.disable_write_block_on_snapshot_error()
        print("Connected to Redis successfully")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Kahoot Clone API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    redis_healthy = redis_client.health_check()
    return {
        "status": "healthy" if redis_healthy else "degraded",
        "redis": "connected" if redis_healthy else "disconnected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)