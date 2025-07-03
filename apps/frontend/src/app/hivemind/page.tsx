'use client';

import React from 'react';
import { P2PNetworkMonitor } from '@/components/hivemind/p2p-network-monitor';

export default function HivemindPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Hivemind P2P Network</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring and management of the decentralized AI training network
          </p>
        </div>
        
        <P2PNetworkMonitor />
      </div>
    </div>
  );
}