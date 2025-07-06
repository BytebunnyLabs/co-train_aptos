"use client"

import type React from "react"
import { Brain, Zap, Database, Code, MessageSquare } from "lucide-react";
import { Button, Card, CardBody, Progress, Chip, Spinner } from "@heroui/react";
import { History, Calendar, Award, TrendingUp, Clock, CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { CheckCircle } from "lucide-react"
import { ContributionTrends, PerformanceMetrics, MonthlyStats } from "../charts"

interface HistoryPageProps {
  onNavigate: (page: string) => void
  userTrainingHistory: any[]
  chartData?: any[]
  performanceData?: any[]
  monthlyData?: any[]
  getHistoryStatusBadge?: (status: string) => React.ReactNode
  formatDate?: (date: string) => string
  getTotalStats?: () => any
}

export function HistoryPage({
  onNavigate,
  userTrainingHistory,
  chartData = [],
  performanceData = [],
  monthlyData = [],
  getHistoryStatusBadge,
  formatDate,
  getTotalStats,
}: HistoryPageProps) {
  // Default implementations for optional functions
  const defaultGetHistoryStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Chip color="success" variant="flat">Completed</Chip>
      case "training":
        return <Chip color="primary" variant="flat">Training</Chip>
      case "failed":
        return <Chip color="danger" variant="flat">Failed</Chip>
      default:
        return <Chip color="default" variant="flat">Unknown</Chip>
    }
  }
  
  const defaultFormatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }
  
  const defaultGetTotalStats = () => ({
    totalSessions: userTrainingHistory.length,
    completedSessions: userTrainingHistory.filter(h => h.status === 'completed').length,
    totalRewards: userTrainingHistory.reduce((sum, h) => sum + (h.reward || 0), 0),
    totalComputeHours: userTrainingHistory.reduce((sum, h) => sum + (h.computeHours || 0), 0),
    totalTokens: userTrainingHistory.reduce((sum, h) => sum + (h.tokens || 0), 0),
    totalReputation: userTrainingHistory.reduce((sum, h) => sum + (h.reputation || 0), 0),
    completedProjects: userTrainingHistory.filter(h => h.status === 'completed').length,
    totalNFTs: userTrainingHistory.reduce((sum, h) => sum + (h.nfts || 0), 0)
  })
  
  // Use provided functions or defaults
  const statusBadge = getHistoryStatusBadge || defaultGetHistoryStatusBadge
  const dateFormatter = formatDate || defaultFormatDate
  const statsCalculator = getTotalStats || defaultGetTotalStats
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Brain: <Brain className="w-6 h-6" />,
      Zap: <Zap className="w-6 h-6" />,
      Database: <Database className="w-6 h-6" />,
      Code: <Code className="w-6 h-6" />,
      ImageIcon: <ImageIcon className="w-6 h-6" />,
      MessageSquare: <MessageSquare className="w-6 h-6" />,
    }
    return iconMap[iconName] || <Brain className="w-6 h-6" />
  }

  const stats = statsCalculator()

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
            variant="bordered"
            color="primary"
            onPress={() => onNavigate("training")}
            className="font-mono text-xs"
            size="sm"
          >
            TRAINING OPTIONS
          </Button>
          <Button
            variant="bordered"
            color="success"
            onPress={() => onNavigate("terminal")}
            className="font-mono text-xs"
            size="sm"
          >
            TERMINAL VIEW
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Compute Hours</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalComputeHours.toFixed(1)}</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-sm">Total Tokens</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.totalTokens.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Reputation</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.totalReputation}</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.completedProjects}</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span className="text-gray-400 text-sm">NFTs Earned</span>
            </div>
            <div className="text-2xl font-bold text-pink-400">{stats.totalNFTs}</div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ContributionTrends data={chartData} />
        <PerformanceMetrics data={performanceData} />
      </div>

      <div className="mb-8">
        <MonthlyStats data={monthlyData} />
      </div>

      {/* Training History List */}
      <div className="space-y-4">
        {userTrainingHistory.map((history) => (
          <Card
            key={history.id}
            className="bg-gray-900 border border-gray-800"
            isHoverable
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-green-400 mt-1">{getIconComponent(history.icon)}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{history.title}</h3>
                      {statusBadge(history.status)}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{history.description}</p>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Started: {dateFormatter(history.startDate)}</span>
                      </div>
                      {history.endDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Ended: {dateFormatter(history.endDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Duration: {history.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Progress</div>
                  <div className="text-2xl font-bold text-green-400">{history.progress}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 h-2 rounded-full mb-4">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    history.status === "active"
                      ? "bg-green-400"
                      : history.status === "completed"
                        ? "bg-gray-400"
                        : "bg-yellow-400"
                  }`}
                  style={{ width: `${history.progress}%` }}
                />
              </div>

              {/* Contribution Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card className="bg-gray-800">
                  <CardBody className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Compute Hours</div>
                    <div className="text-lg font-semibold text-blue-400">
                      {history.contribution.computeHours.toFixed(1)}
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gray-800">
                  <CardBody className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Tokens Processed</div>
                    <div className="text-lg font-semibold text-green-400">
                      {(history.contribution.tokensProcessed / 1000000).toFixed(0)}M
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gray-800">
                  <CardBody className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Rank</div>
                    <div className="text-lg font-semibold text-yellow-400">
                      #{history.contribution.rank} / {history.contribution.totalParticipants}
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-gray-800">
                  <CardBody className="p-3">
                    <div className="text-xs text-gray-400 mb-1">Reputation Gained</div>
                    <div className="text-lg font-semibold text-purple-400">+{history.rewards.reputation}</div>
                  </CardBody>
                </Card>
              </div>

              {/* Rewards */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">{history.rewards.tokens} Tokens</span>
                  </div>
                  {history.rewards.nfts > 0 && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-gray-300">{history.rewards.nfts} NFTs</span>
                    </div>
                  )}
                </div>
                {history.status === "active" && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Currently participating...</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {userTrainingHistory.length === 0 && (
        <div className="text-center py-12">
          <Card className="bg-gray-900 border border-gray-800 max-w-md mx-auto">
            <CardBody className="p-8">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Training History</h3>
              <p className="text-gray-400 mb-6">
                You haven't participated in any training sessions yet. Start your first training to see your history here.
              </p>
              <Button
                onPress={() => onNavigate("training")}
                color="primary"
                size="md"
              >
                Start Training
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
