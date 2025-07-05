import hivemind
import asyncio
from typing import Dict, List, Optional
from config.settings import settings

class HivemindManager:
    def __init__(self):
        self.dht = None
        self.server = None
        self.is_running = False
        
    async def start_server(self) -> Dict:
        """启动 Hivemind DHT 服务器"""
        if self.is_running:
            return {"message": "Server already running"}
            
        try:
            # 初始化 DHT
            self.dht = hivemind.DHT(
                start=True,
                initial_peers=settings.INITIAL_PEERS,
                host_maddrs=[f"/ip4/0.0.0.0/tcp/{settings.DHT_PORT}"],
                use_ipfs=False
            )
            
            # 启动服务器
            self.server = hivemind.Server(
                dht=self.dht,
                expert_backends={},  # 将根据需要添加专家
                host_maddrs=[f"/ip4/0.0.0.0/tcp/{settings.SERVER_PORT}"],
                start=True
            )
            
            self.is_running = True
            
            return {
                "dht_address": str(self.dht.get_visible_maddrs()),
                "server_address": str(self.server.get_visible_maddrs()),
                "peer_id": str(self.dht.peer_id)
            }
            
        except Exception as e:
            raise Exception(f"Failed to start Hivemind server: {str(e)}")
    
    async def get_status(self) -> Dict:
        """获取服务器状态"""
        if not self.is_running:
            return {"status": "stopped"}
            
        try:
            peers = await self.get_peers()
            return {
                "status": "running",
                "peer_id": str(self.dht.peer_id) if self.dht else None,
                "connected_peers": len(peers),
                "dht_size": len(peers) + 1
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def get_peers(self) -> List[Dict]:
        """获取连接的节点"""
        if not self.dht:
            return []
            
        try:
            # 获取 DHT 中的节点信息
            routing_table = self.dht.routing_table
            peers = []
            
            for bucket in routing_table.buckets:
                for peer_id, peer_info in bucket.items():
                    peers.append({
                        "peer_id": str(peer_id),
                        "address": str(peer_info.addrs[0]) if peer_info.addrs else "unknown",
                        "last_seen": peer_info.last_seen
                    })
                    
            return peers
        except Exception as e:
            raise Exception(f"Failed to get peers: {str(e)}")
    
    async def connect_peer(self, peer_id: str, address: str, port: int) -> Dict:
        """连接到指定节点"""
        if not self.dht:
            raise Exception("DHT not initialized")
            
        try:
            # 构建多地址
            maddr = f"/ip4/{address}/tcp/{port}"
            
            # 连接到节点
            await self.dht.add_peers([maddr])
            
            return {
                "peer_id": peer_id,
                "address": maddr,
                "status": "connected"
            }
        except Exception as e:
            raise Exception(f"Failed to connect to peer: {str(e)}")
    
    async def stop_server(self):
        """停止服务器"""
        if self.server:
            self.server.shutdown()
        if self.dht:
            self.dht.shutdown()
        self.is_running = False