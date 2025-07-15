#!/usr/bin/env python3
"""
Training Manager for CotrainCore

This module provides a high-level interface for managing training sessions,
including starting, stopping, and monitoring training processes.
"""

import os
import time
import threading
from pathlib import Path
from typing import Dict, Any, Optional, List
from collections import deque

from .config import load_config
from .utils.logger import get_logger

logger = get_logger(__name__)

class TrainingManager:
    """Manages training sessions and provides status monitoring"""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = load_config(config_path)
        self._is_running = False
        self._training_thread: Optional[threading.Thread] = None
        self._start_time: Optional[float] = None
        self._current_step = 0
        self._total_steps = 0
        self._current_loss = 0.0
        self._current_lr = 0.0
        self._throughput = 0.0
        self._logs = deque(maxlen=1000)  # Keep last 1000 log entries
        
    def is_running(self) -> bool:
        """Check if training is currently running"""
        return self._is_running
    
    def start_training(self, resume_from: Optional[str] = None, overrides: Optional[Dict[str, Any]] = None):
        """Start a training session"""
        if self._is_running:
            raise RuntimeError("Training is already running")
        
        self._is_running = True
        self._start_time = time.time()
        
        # Apply overrides to config if provided
        if overrides:
            self.config.update(overrides)
        
        # Start training in a separate thread
        self._training_thread = threading.Thread(
            target=self._run_training,
            args=(resume_from,),
            daemon=True
        )
        self._training_thread.start()
        
        self._log("Training session started")
    
    def stop_training(self):
        """Stop the current training session"""
        if not self._is_running:
            raise RuntimeError("No training session is currently running")
        
        self._is_running = False
        self._log("Training session stopped")
        
        # Wait for training thread to finish
        if self._training_thread and self._training_thread.is_alive():
            self._training_thread.join(timeout=10.0)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current training status"""
        return {
            "is_running": self._is_running,
            "current_step": self._current_step if self._is_running else None,
            "total_steps": self._total_steps if self._is_running else None,
            "loss": self._current_loss if self._is_running else None,
            "learning_rate": self._current_lr if self._is_running else None,
            "throughput": self._throughput if self._is_running else None,
            "uptime": time.time() - self._start_time if self._start_time else None
        }
    
    def get_logs(self, lines: int = 100) -> List[str]:
        """Get recent training logs"""
        return list(self._logs)[-lines:] if self._logs else []
    
    def _run_training(self, resume_from: Optional[str] = None):
        """Main training loop (placeholder implementation)"""
        try:
            # This is a placeholder implementation
            # In a real implementation, this would call the actual training logic
            
            self._total_steps = self.config.get("training", {}).get("max_steps", 1000)
            
            self._log(f"Starting training with config: {self.config_path}")
            if resume_from:
                self._log(f"Resuming from checkpoint: {resume_from}")
            
            # Simulate training loop
            for step in range(self._total_steps):
                if not self._is_running:
                    break
                
                # Simulate training step
                time.sleep(0.1)  # Simulate computation time
                
                # Update metrics (simulated)
                self._current_step = step + 1
                self._current_loss = 1.0 / (step + 1)  # Decreasing loss
                self._current_lr = 0.001 * (0.99 ** step)  # Decaying learning rate
                self._throughput = 100.0  # Tokens per second (simulated)
                
                # Log progress every 100 steps
                if (step + 1) % 100 == 0:
                    self._log(
                        f"Step {step + 1}/{self._total_steps}, "
                        f"Loss: {self._current_loss:.4f}, "
                        f"LR: {self._current_lr:.6f}"
                    )
            
            if self._is_running:
                self._log("Training completed successfully")
            else:
                self._log("Training was stopped")
                
        except Exception as e:
            self._log(f"Training failed with error: {e}")
            logger.error(f"Training error: {e}")
        finally:
            self._is_running = False
    
    def _log(self, message: str):
        """Add a log entry with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self._logs.append(log_entry)
        logger.info(message)