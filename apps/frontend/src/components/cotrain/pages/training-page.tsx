"use client"

import type React from "react"
import { Brain, Zap, Database, Code, Image as ImageIcon, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/cotrain/ui/button"
import { Badge } from "@/components/cotrain/ui/badge"
import { TrainingOption, Notification } from "../../../types/cotrain"
import { ERROR_MESSAGES, SUCCESS_MESSAGES, THEME_CONFIG } from "@/config/index"
import { handleError } from "../../../utils/error-handler"
import { useDebounce } from "../../../utils/performance"

interface TrainingPageProps {
  trainingOptions: TrainingOption[]
  onNavigate: (page: string) => void
  onTrainingSelect: (option: any) => void
  showContributeModal?: boolean
  setShowContributeModal?: (show: boolean) => void
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  addNotification?: (notification: Omit<Notification, "id">) => void
}

export function TrainingPage({
  trainingOptions,
  onNavigate,
  onTrainingSelect,
  showContributeModal,
  setShowContributeModal,
  selectedTab,
  setSelectedTab,
  addNotification,
}: TrainingPageProps) {
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

  const getTrainingStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-600 text-white">Available</Badge>
      case "training":
        return <Badge className="bg-blue-600 text-white">Training</Badge>
      case "completed":
        return <Badge className="bg-gray-600 text-white">Completed</Badge>
      case "coming-soon":
        return <Badge className="bg-yellow-600 text-white">Coming Soon</Badge>
      default:
        return <Badge className="bg-gray-600 text-white">Unknown</Badge>
    }
  }

  const handleTrainingSelect = useDebounce((option: TrainingOption) => {
    try {
      if (option.status === "available") {
        addNotification?.({
          type: "success",
          title: "Training Joined",
          message: SUCCESS_MESSAGES.TRAINING_JOINED + ` - ${option.title}`,
        })
      } else if (option.status === "coming-soon") {
        addNotification?.({
          type: "info",
          title: "Coming Soon",
          message: `${option.title} will be available soon`,
        })
      } else if (option.status === "training") {
        addNotification?.({
          type: "info",
          title: "Already Training",
          message: `${option.title} is already in progress`,
        })
      }
    } catch (error) {
      const appError = handleError(error)
      addNotification?.({
        type: "error",
        title: "Error",
        message: appError.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      })
    }
  }, 300)

  const handleNavigation = (page: string) => {
    // This would typically be handled by a router or parent component
    // For now, we'll just show a notification
    addNotification?.({
      type: "info",
      title: "Navigation",
      message: `Navigating to ${page}`,
    })
  }
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
          <p className="text-gray-400">
            Models, synthetic data generation, and agents powered by decentralized community-contributed compute.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => onNavigate("history")}
            className="bg-transparent border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black font-mono text-xs"
          >
            TRAINING HISTORY
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("terminal")}
            className="bg-transparent border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-mono text-xs"
          >
            TERMINAL VIEW
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowContributeModal?.(true)}
            className="bg-transparent border-green-400 text-green-400 hover:bg-green-400 hover:text-black font-mono text-xs"
          >
            CONTRIBUTE COMPUTE
          </Button>
        </div>
      </div>

      {/* Training Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleTrainingSelect(option)}
            className={`bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-all cursor-pointer ${
              option.status === "available" ? "hover:bg-gray-800" : ""
            } ${option.status === "coming-soon" ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-green-400">{getIconComponent(option.iconName)}</div>
              {getTrainingStatusBadge(option.status)}
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{option.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{option.description}</p>

            <div className="space-y-2">
              {option.participants && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Participants:</span>
                  <span className="text-green-400">{option.participants}</span>
                </div>
              )}

              {option.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progress:</span>
                    <span className="text-green-400">{option.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1 rounded">
                    <div
                      className="bg-green-400 h-1 rounded transition-all duration-300"
                      style={{ width: `${option.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {option.status === "available" && (
                <Button
                  size="sm"
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTrainingSelect(option)
                  }}
                >
                  Join Training
                </Button>
              )}

              {option.status === "training" && (
                <div className="flex items-center gap-2 mt-4 text-green-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Training in progress...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {trainingOptions.filter((o) => o.status === "training").length}
          </div>
          <div className="text-gray-400 text-sm">Active Training Sessions</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {trainingOptions.reduce((sum, o) => sum + (o.participants || 0), 0)}
          </div>
          <div className="text-gray-400 text-sm">Total Participants</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {trainingOptions.filter((o) => o.status === "completed").length}
          </div>
          <div className="text-gray-400 text-sm">Completed Models</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">1247</div>
          <div className="text-gray-400 text-sm">Network Nodes</div>
        </div>
      </div>
    </div>
  )
}
