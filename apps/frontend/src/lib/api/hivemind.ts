import { apiClient } from '../../services/api';

export interface TrainingRequest {
  model_config: Record<string, any>;
  training_params: Record<string, any>;
  dataset_info: Record<string, any>;
  user_id: string;
  task_id: string;
}

export interface TrainingStatus {
  task_id: string;
  status: 'submitted' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PeerInfo {
  peer_id: string;
  address: string;
  last_seen: string;
}

export const hivemindApi = {
  // 启动 Hivemind 服务器
  async startServer() {
    const response = await apiClient.post('/api/v1/hivemind-ml/start');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to start Hivemind server');
  },

  // 获取服务器状态
  async getStatus() {
    const response = await apiClient.get('/api/v1/hivemind-ml/status');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get Hivemind status');
  },

  // 提交训练任务
  async submitTrainingTask(request: TrainingRequest) {
    const response = await apiClient.post('/api/v1/hivemind-ml/train', request);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to submit training task');
  },

  // 获取训练状态
  async getTrainingStatus(taskId: string): Promise<TrainingStatus> {
    const response = await apiClient.get(`/api/v1/hivemind-ml/training/${taskId}`);
    if (response.success) {
      return (response.data as any).data;
    }
    throw new Error(response.error || 'Failed to get training status');
  },

  // 获取连接的节点
  async getConnectedPeers(): Promise<PeerInfo[]> {
    const response = await apiClient.get('/api/v1/hivemind-ml/peers');
    if (response.success) {
      return (response.data as any).data;
    }
    throw new Error(response.error || 'Failed to get connected peers');
  },
};