import os
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.models.database import Base, engine, SessionLocal
from app.crud.crud import seed_default_categories
from app.api import auth, transactions, categories

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create database tables
Base.metadata.create_all(bind=engine)

# FastAPI App
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Include API routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])
app.include_router(categories.router, prefix="/api", tags=["categories"])

# Static Files and Root
# Ensure the static directory exists
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    """
    Serve the main HTML file.
    """
    logging.info("接收到根路徑請求 '/'")
    return FileResponse('static/index.html')

# Initial Data Seeding
@app.on_event("startup")
def startup_event():
    """
    Seed default categories on application startup if the database is empty.
    """
    db = SessionLocal()
    try:
        seed_default_categories(db)
    finally:
        db.close()
