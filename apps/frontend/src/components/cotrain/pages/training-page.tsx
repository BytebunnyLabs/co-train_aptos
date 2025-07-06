"use client"

import type React from "react"
import { Brain, Zap, Database, Code, Image as ImageIcon, MessageSquare, Loader2 } from "lucide-react"
import { Button, Card, CardBody, Progress, Chip, Spinner } from "@heroui/react"
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
        return <Chip color="success" variant="flat">Available</Chip>
      case "training":
        return <Chip color="primary" variant="flat">Training</Chip>
      case "completed":
        return <Chip color="default" variant="flat">Completed</Chip>
      case "coming-soon":
        return <Chip color="warning" variant="flat">Coming Soon</Chip>
      default:
        return <Chip color="default" variant="flat">Unknown</Chip>
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
            variant="bordered"
            color="secondary"
            onPress={() => onNavigate("history")}
            className="font-mono text-xs"
            size="sm"
          >
            TRAINING HISTORY
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
          <Button
            variant="bordered"
            color="success"
            onPress={() => setShowContributeModal?.(true)}
            className="font-mono text-xs"
            size="sm"
          >
            CONTRIBUTE COMPUTE
          </Button>
        </div>
      </div>

      {/* Training Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingOptions.map((option) => (
          <Card
            key={option.id}
            isPressable
            isHoverable
            onPress={() => handleTrainingSelect(option)}
            className="bg-gray-900 border border-gray-800 hover:border-green-400"
          >
            <CardBody className="p-6">
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
                    <Progress 
                      value={option.progress} 
                      color="success"
                      className="w-full"
                      size="sm"
                    />
                  </div>
                )}

                {option.status === "available" && (
                  <Button
                    size="sm"
                    color="success"
                    className="w-full mt-4"
                    onPress={() => {
                      handleTrainingSelect(option)
                    }}
                  >
                    Join Training
                  </Button>
                )}

                {option.status === "training" && (
                  <div className="flex items-center gap-2 mt-4 text-green-400 text-xs">
                    <Spinner size="sm" />
                    <span>Training in progress...</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {trainingOptions.filter((o) => o.status === "training").length}
            </div>
            <div className="text-gray-400 text-sm">Active Training Sessions</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {trainingOptions.reduce((sum, o) => sum + (o.participants || 0), 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Participants</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {trainingOptions.filter((o) => o.status === "completed").length}
            </div>
            <div className="text-gray-400 text-sm">Completed Models</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-900 border border-gray-800">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-purple-400">1247</div>
            <div className="text-gray-400 text-sm">Network Nodes</div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
