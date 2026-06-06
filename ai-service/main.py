# This is the main entry point for the Vault AI Service. It sets up the FastAPI application and defines the health check endpoint.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.documents import router as documents_router
import os

load_dotenv() # Load environment variables from .env file
app = FastAPI(title = "Vault AI Service")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api/documents")

# Health check endpoint to verify that the service is running
@app.get("/health")
def health():
    return {"status": "ok", "message": "Vault AI Service is running"}
