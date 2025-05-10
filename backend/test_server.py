#!/usr/bin/env python3
"""
Minimal FastAPI server for testing
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

app = FastAPI(title="DentaMind Test Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "DentaMind Test Server", "version": "1.0.0"}

# Health check endpoints
@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Token endpoint (mock)
@app.post("/token")
async def token(username: str = Form(...), password: str = Form(...)):
    if username == "demo@dentamind.com" and password == "password123":
        return {
            "access_token": "mock_token_for_testing_only",
            "token_type": "bearer",
            "expires_at": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Patient endpoint
@app.get("/api/patients/sample")
async def patients_sample():
    return [
        {"id": 1, "name": "John Doe", "email": "john@example.com"},
        {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
    ]

# Public health endpoint (no auth)
@app.get("/api/public/health")
async def public_health():
    return {"status": "healthy", "auth_required": False}

if __name__ == "__main__":
    print("Starting test server...")
    port = int(os.environ.get("PORT", 8088))
    uvicorn.run(app, host="0.0.0.0", port=port) 