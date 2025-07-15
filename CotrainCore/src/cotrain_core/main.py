#!/usr/bin/env python3
"""
CotrainCore API Server

This module provides a FastAPI-based REST API for CotrainCore functionality,
including configuration management, training coordination, and status monitoring.
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add the src directory to Python path
src_path = Path(__file__).parent.parent
sys.path.insert(0, str(src_path))

from cotrain_core.config import load_config
from cotrain_core.training_manager import TrainingManager
from cotrain_core.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CotrainCore API",
    description="Distributed training coordination and management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global training manager instance
training_manager: Optional[TrainingManager] = None

# Pydantic models for API
class ConfigRequest(BaseModel):
    config_path: str
    overrides: Optional[Dict[str, Any]] = None

class TrainingRequest(BaseModel):
    config_path: str
    resume_from: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: float

class ConfigResponse(BaseModel):
    config: Dict[str, Any]
    config_path: str

class TrainingStatus(BaseModel):
    is_running: bool
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    loss: Optional[float] = None
    learning_rate: Optional[float] = None
    throughput: Optional[float] = None

# Startup time for uptime calculation
import time
START_TIME = time.time()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime=time.time() - START_TIME
    )

@app.get("/api/v1/configs", response_model=List[str])
async def list_configs():
    """List available configuration files"""
    try:
        config_dir = Path(os.getenv("CONFIG_PATH", "/app/configs"))
        if not config_dir.exists():
            raise HTTPException(status_code=404, detail="Config directory not found")
        
        configs = []
        for config_file in config_dir.rglob("*.toml"):
            configs.append(str(config_file.relative_to(config_dir)))
        
        return configs
    except Exception as e:
        logger.error(f"Error listing configs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/config/load", response_model=ConfigResponse)
async def load_configuration(request: ConfigRequest):
    """Load and validate a configuration file"""
    try:
        config_path = Path(os.getenv("CONFIG_PATH", "/app/configs")) / request.config_path
        if not config_path.exists():
            raise HTTPException(status_code=404, detail=f"Config file not found: {request.config_path}")
        
        config = load_config(str(config_path))
        
        # Apply overrides if provided
        if request.overrides:
            config.update(request.overrides)
        
        return ConfigResponse(
            config=config,
            config_path=str(config_path)
        )
    except Exception as e:
        logger.error(f"Error loading config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/training/start")
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Start a training session"""
    global training_manager
    
    try:
        if training_manager and training_manager.is_running():
            raise HTTPException(status_code=409, detail="Training is already running")
        
        config_path = Path(os.getenv("CONFIG_PATH", "/app/configs")) / request.config_path
        if not config_path.exists():
            raise HTTPException(status_code=404, detail=f"Config file not found: {request.config_path}")
        
        # Initialize training manager
        training_manager = TrainingManager(str(config_path))
        
        # Start training in background
        background_tasks.add_task(
            training_manager.start_training,
            resume_from=request.resume_from,
            overrides=request.overrides
        )
        
        return {"message": "Training started successfully", "status": "started"}
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/training/stop")
async def stop_training():
    """Stop the current training session"""
    global training_manager
    
    try:
        if not training_manager or not training_manager.is_running():
            raise HTTPException(status_code=409, detail="No training session is currently running")
        
        training_manager.stop_training()
        return {"message": "Training stopped successfully", "status": "stopped"}
    except Exception as e:
        logger.error(f"Error stopping training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/training/status", response_model=TrainingStatus)
async def get_training_status():
    """Get current training status"""
    global training_manager
    
    try:
        if not training_manager:
            return TrainingStatus(is_running=False)
        
        status = training_manager.get_status()
        return TrainingStatus(**status)
    except Exception as e:
        logger.error(f"Error getting training status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/training/logs")
async def get_training_logs(lines: int = 100):
    """Get recent training logs"""
    global training_manager
    
    try:
        if not training_manager:
            return {"logs": [], "message": "No training session available"}
        
        logs = training_manager.get_logs(lines=lines)
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Error getting training logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8002))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    logger.info(f"Starting CotrainCore API server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="debug" if debug else "info"
    )