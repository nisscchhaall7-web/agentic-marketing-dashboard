from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .database import engine, Base
from .config import settings
from .routers import metrics, insights, agents, brands

# Create the database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version=settings.API_VERSION)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(metrics.router)
app.include_router(insights.router)
app.include_router(agents.router)
app.include_router(brands.router)

@app.get("/")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
