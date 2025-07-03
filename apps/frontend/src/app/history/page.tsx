"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/cotrain/ui/button";
import { Badge } from "@/components/cotrain/ui/badge";
import { History, Calendar, Award, TrendingUp, Clock, CheckCircle2, ImageIcon } from "lucide-react";

function HistoryPageContent() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    router.push(`/${page}`);
  };

  const mockStats = {
    totalComputeHours: 24.5,
    totalTokens: 15420,
    totalReputation: 892,
    completedProjects: 12,
    totalNFTs: 3
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <History className="w-8 h-8 text-green-400" />
            Training History
          </h1>
          <p className="text-gray-400">Your participation history in distributed AI training projects</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => handleNavigate("training")}
            className="bg-transparent border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black font-mono text-xs"
          >
            TRAINING OPTIONS
          </Button>
          <Button
            variant="outline"
            onClick={() => handleNavigate("terminal")}
            className="bg-transparent border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-mono text-xs"
          >
            TERMINAL VIEW
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Compute Hours</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{mockStats.totalComputeHours.toFixed(1)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-sm">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{mockStats.totalTokens.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Reputation</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{mockStats.totalReputation}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">Completed</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{mockStats.completedProjects}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-pink-400" />
            <span className="text-gray-400 text-sm">NFTs Earned</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">{mockStats.totalNFTs}</div>
        </div>
      </div>

      {/* Training History List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Training Sessions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-white">GPT-4 Fine-tuning</h4>
              <p className="text-sm text-gray-400">Completed on Jan 15, 2024</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-600 text-white">Completed</Badge>
              <span className="text-green-400 font-mono">+150 tokens</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-white">BERT Large Training</h4>
              <p className="text-sm text-gray-400">In progress since Jan 16, 2024</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-600 text-white">Training</Badge>
              <span className="text-blue-400 font-mono">~200 tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HistoryPage = dynamic(() => Promise.resolve(HistoryPageContent), {
  ssr: false
});

export default HistoryPage;