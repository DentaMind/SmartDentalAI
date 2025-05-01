from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time

# Import routers
from api.routes.perio_simple import router as perio_router
from api.routes.diagnose_simple import router as diagnose_router
from api.routes.image_simple import router as image_router
from api.routes.risk_simple import router as risk_router
from api.routes.knowledge_simple import router as knowledge_router
from api.routes.treatment_simple import router as treatment_router
from api.routes.prescriptions_simple import router as prescriptions_router

# Import specialized imaging routers
from api.routes.image_fmx import router as image_fmx_router
from api.routes.image_pano import router as image_pano_router
from api.routes.image_cbct import router as image_cbct_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind API",
    description="Dental Practice Management and Diagnostic AI Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
# Note: No additional prefix needed as each router already has its own prefix
app.include_router(perio_router)
app.include_router(diagnose_router)
app.include_router(image_router)
app.include_router(risk_router)
app.include_router(knowledge_router)
app.include_router(treatment_router)
app.include_router(prescriptions_router)

# Include specialized imaging routers with prefixes
app.include_router(image_fmx_router, prefix="/api/image/fmx")
app.include_router(image_pano_router, prefix="/api/image/pano")
app.include_router(image_cbct_router, prefix="/api/image/cbct")

@app.get("/")
async def root():
    return {
        "message": "DentaMind API Root",
        "version": "1.0.0",
        "documentation": "/docs",
        "modules": [
            "Perio Assessment", 
            "X-ray Diagnostics",
            "Image Analysis",
            "Risk Assessment",
            "Knowledge Base",
            "Prescriptions",
            "Treatment Plans"
        ]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online"
        },
        "version": "1.0.0"
    }

@app.get("/api/health")
async def api_health():
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online"
        },
        "version": "1.0.0"
    } 