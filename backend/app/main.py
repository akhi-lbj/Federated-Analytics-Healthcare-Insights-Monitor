import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.routers import ram

app = FastAPI(
    title="Project F.A.H.I.M. — SAS RAM Gateway & Clinical Telemetry API",
    description="Backend-For-Frontend (BFF) Application Gateway for SAS Retrieval Agent Manager (RAM) v1 and EHS Clinical Operations",
    version="1.0.0"
)

# CORS configuration for AWS Amplify and Local Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "https://*.amplifyapp.com",
    ],
    allow_origin_regex=r"^https:\/\/.*\.amplifyapp\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register RAM Router
app.include_router(ram.router, prefix="/api/ram", tags=["SAS RAM BFF Gateway"])

@app.get("/")
async def root():
    return {
        "service": "Project F.A.H.I.M. Gateway",
        "status": "operational",
        "version": "1.0.0",
        "description": "Federated Analytics & Healthcare Insights Monitor"
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Mangum handler for AWS Lambda (with Lambda Function URL or API Gateway)
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
