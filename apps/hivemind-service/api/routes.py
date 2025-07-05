from fastapi import APIRouter, HTTPException, BackgroundTasks
from .models import TrainingRequest, PeerInfo, TrainingStatus, HivemindStatus
from services.hivemind_manager import HivemindManager
from services.training_service import TrainingService
from typing import List

router = APIRouter()
hivemind_manager = HivemindManager()
training_service = TrainingService()

@router.post("/hivemind/start")
async def start_hivemind_server(background_tasks: BackgroundTasks):
    """启动 Hivemind 服务器"""
    try:
        result = await hivemind_manager.start_server()
        return {"status": "success", "message": "Hivemind server started", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/status", response_model=dict)
async def get_hivemind_status():
    """获取 Hivemind 状态"""
    try:
        status = await hivemind_manager.get_status()
        return {"status": "success", "data": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hivemind/train")
async def submit_training_task(request: TrainingRequest, background_tasks: BackgroundTasks):
    """提交训练任务"""
    try:
        task_id = await training_service.submit_task(
            request.model_config,
            request.training_params,
            request.dataset_info,
            request.user_id,
            request.task_id
        )
        return {"status": "success", "task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/peers")
async def get_connected_peers():
    """获取连接的节点列表"""
    try:
        peers = await hivemind_manager.get_peers()
        return {"status": "success", "data": peers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hivemind/peers/connect")
async def connect_to_peer(peer: PeerInfo):
    """连接到指定节点"""
    try:
        result = await hivemind_manager.connect_peer(
            peer.peer_id, peer.address, peer.port
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hivemind/training/{task_id}")
async def get_training_status(task_id: str):
    """获取训练任务状态"""
    try:
        status = await training_service.get_task_status(task_id)
        return {"status": "success", "data": status}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Task not found")