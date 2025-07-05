import asyncio
import uuid
from typing import Dict, Any
from datetime import datetime

class TrainingService:
    def __init__(self):
        self.active_tasks = {}
        
    async def submit_task(
        self, 
        model_config: Dict[str, Any],
        training_params: Dict[str, Any],
        dataset_info: Dict[str, Any],
        user_id: str,
        external_task_id: str
    ) -> str:
        """提交训练任务"""
        
        task_id = str(uuid.uuid4())
        
        task_info = {
            "task_id": task_id,
            "external_task_id": external_task_id,
            "user_id": user_id,
            "model_config": model_config,
            "training_params": training_params,
            "dataset_info": dataset_info,
            "status": "submitted",
            "created_at": datetime.utcnow().isoformat(),
            "progress": 0.0,
            "logs": []
        }
        
        self.active_tasks[task_id] = task_info
        
        # 启动后台训练任务
        asyncio.create_task(self._run_training(task_id))
        
        return task_id
    
    async def get_task_status(self, task_id: str) -> Dict:
        """获取任务状态"""
        if task_id not in self.active_tasks:
            raise Exception("Task not found")
            
        return self.active_tasks[task_id]
    
    async def _run_training(self, task_id: str):
        """运行训练任务（后台任务）"""
        try:
            task_info = self.active_tasks[task_id]
            task_info["status"] = "running"
            task_info["started_at"] = datetime.utcnow().isoformat()
            
            # 模拟训练过程
            for i in range(10):
                await asyncio.sleep(2)  # 模拟训练步骤
                task_info["progress"] = (i + 1) * 10.0
                task_info["logs"].append(f"Training step {i+1}/10 completed")
                
            task_info["status"] = "completed"
            task_info["completed_at"] = datetime.utcnow().isoformat()
            task_info["progress"] = 100.0
            
        except Exception as e:
            task_info["status"] = "failed"
            task_info["error"] = str(e)
            task_info["failed_at"] = datetime.utcnow().isoformat()