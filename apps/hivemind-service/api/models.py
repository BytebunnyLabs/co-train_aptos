from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class TrainingRequest(BaseModel):
    model_config: Dict[str, Any]
    training_params: Dict[str, Any]
    dataset_info: Dict[str, Any]
    user_id: str
    task_id: str

class PeerInfo(BaseModel):
    peer_id: str
    address: str
    port: int

class TrainingStatus(BaseModel):
    task_id: str
    external_task_id: str
    user_id: str
    status: str
    progress: float
    logs: List[str]
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None

class HivemindStatus(BaseModel):
    status: str
    peer_id: Optional[str] = None
    connected_peers: int
    dht_size: int
    error: Optional[str] = None