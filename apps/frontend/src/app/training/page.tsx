"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, Button, Chip, Badge, Progress, Tabs, Tab } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Tooltip } from "@heroui/react";
import { 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Activity,
  Zap,
  Brain,
  ArrowRight,
  TrendingUp,
  Clock,
  Server,
  Cpu,
  Shield,
  Star,
  Target,
  Play,
  Pause,
  Eye,
  Settings,
  BarChart3,
  Coins,
  Timer,
  Database,
  Network,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import toast from "react-hot-toast";

interface TrainingSession {
  id: string;
  name: string;
  description: string;
  modelType: string;
  status: 'active' | 'starting' | 'completed' | 'paused';
  participants: number;
  maxParticipants: number;
  rewardPool: number;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requirements: string[];
  progress: number;
  createdAt: string;
}

interface PlatformStats {
  activeSessions: number;
  totalParticipants: number;
  rewardsDistributed: number;
  modelsCompleted: number;
  averageReward: number;
  successRate: number;
  totalComputeHours: number;
  networkHashRate: number;
}

export default function Training() {
  const router = useRouter();
  const { connected } = useWallet();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    activeSessions: 12,
    totalParticipants: 156,
    rewardsDistributed: 2400,
    modelsCompleted: 48,
    averageReward: 15.7,
    successRate: 94.2,
    totalComputeHours: 8760,
    networkHashRate: 2.4
  });
  
  const [featuredSessions, setFeaturedSessions] = useState<TrainingSession[]>([
    {
      id: "gpt-advanced-001",
      name: "GPT-4.5 Fine-tuning",
      description: "Advanced language model fine-tuning with reinforcement learning",
      modelType: "Large Language Model", 
      status: "active",
      participants: 23,
      maxParticipants: 50,
      rewardPool: 500,
      estimatedDuration: "6 hours",
      difficulty: "advanced",
      requirements: ["16GB+ RAM", "CUDA GPU", "High bandwidth"],
      progress: 67,
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "vision-transformer-002", 
      name: "Vision Transformer Training",
      description: "Computer vision model for medical image analysis",
      modelType: "Vision Transformer",
      status: "starting",
      participants: 8,
      maxParticipants: 25,
      rewardPool: 300,
      estimatedDuration: "4 hours",
      difficulty: "intermediate",
      requirements: ["8GB+ RAM", "GPU recommended"],
      progress: 0,
      createdAt: "2024-01-16T14:30:00Z"
    },
    {
      id: "bert-classification-003",
      name: "BERT Classification",
      description: "Text classification model for sentiment analysis",
      modelType: "BERT",
      status: "active",
      participants: 15,
      maxParticipants: 30,
      rewardPool: 200,
      estimatedDuration: "2 hours",
      difficulty: "beginner", 
      requirements: ["4GB+ RAM", "CPU sufficient"],
      progress: 34,
      createdAt: "2024-01-16T16:00:00Z"
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Real-time updates simulation
    const interval = setInterval(() => {
      setPlatformStats(prev => ({
        ...prev,
        activeSessions: prev.activeSessions + Math.floor(Math.random() * 3) - 1,
        totalParticipants: prev.totalParticipants + Math.floor(Math.random() * 5) - 2
      }));
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const quickActions = [
    {
      title: "Create Session",
      description: "Start a new AI training session with custom parameters",
      icon: Plus,
      href: "/training/create",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      badge: "New"
    },
    {
      title: "Config Generator",
      description: "Generate TOML configuration files for training sessions",
      icon: Settings,
      href: "/training/config",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      badge: "Beta"
    },
    {
      title: "Browse Sessions", 
      description: "Discover and join existing training sessions",
      icon: Calendar,
      href: "/training/sessions",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "My Dashboard",
      description: "Track your training progress and earnings",
      icon: BarChart3,
      href: "/training/dashboard",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Claim Rewards",
      description: "Check and claim your earned training rewards",
      icon: Trophy,
      href: "/rewards",
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      badge: "Hot"
    },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'success', label: 'Active', icon: <Play className="h-3 w-3" /> };
      case 'starting':
        return { color: 'warning', label: 'Starting', icon: <Clock className="h-3 w-3" /> };
      case 'completed':
        return { color: 'default', label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'paused':
        return { color: 'danger', label: 'Paused', icon: <Pause className="h-3 w-3" /> };
      default:
        return { color: 'default', label: 'Unknown', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { color: 'success', label: 'Beginner', icon: <Star className="h-3 w-3" /> };
      case 'intermediate':
        return { color: 'warning', label: 'Intermediate', icon: <Target className="h-3 w-3" /> };
      case 'advanced':
        return { color: 'danger', label: 'Advanced', icon: <Shield className="h-3 w-3" /> };
      default:
        return { color: 'default', label: 'Unknown', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  const handleJoinSession = (sessionId: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      onOpen();
      return;
    }
    router.push(`/training/sessions/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <Brain className="h-16 w-16 mx-auto animate-pulse text-primary" />
            <div className="absolute inset-0 animate-ping">
              <Brain className="h-16 w-16 mx-auto text-primary/30" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Loading Training Platform</h2>
            <p className="text-default-400">Initializing AI training environment...</p>
            <Progress 
              isIndeterminate 
              color="primary" 
              className="max-w-xs mx-auto" 
              label="Loading..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
              AI Training Platform
            </h1>
            <p className="text-xl text-default-400 max-w-3xl mx-auto">
              Join the future of distributed AI training. Contribute your computational power, 
              earn real rewards, and help train next-generation AI models.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              color="primary" 
              size="lg"
              startContent={<Plus className="h-5 w-5" />}
              onClick={() => handleJoinSession('create')}
              className="px-8"
            >
              Create Session
            </Button>
            <Button 
              variant="bordered" 
              size="lg"
              startContent={<Calendar className="h-5 w-5" />}
              onClick={() => router.push('/training/sessions')}
              className="px-8"
            >
              Browse Sessions
            </Button>
          </div>
        </div>

        {/* Enhanced Platform Statistics */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Platform Statistics</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-default-400">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.activeSessions}</div>
                <div className="text-sm text-default-400">Active Sessions</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.totalParticipants}</div>
                <div className="text-sm text-default-400">Participants</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Coins className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">{(platformStats.rewardsDistributed / 1000).toFixed(1)}K</div>
                <div className="text-sm text-default-400">APT Distributed</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.modelsCompleted}</div>
                <div className="text-sm text-default-400">Models Trained</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.averageReward}</div>
                <div className="text-sm text-default-400">Avg Reward</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.successRate}%</div>
                <div className="text-sm text-default-400">Success Rate</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-pink-500" />
                </div>
                <div className="text-2xl font-bold">{(platformStats.totalComputeHours / 1000).toFixed(1)}K</div>
                <div className="text-sm text-default-400">Compute Hours</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Network className="h-6 w-6 text-teal-500" />
                </div>
                <div className="text-2xl font-bold">{platformStats.networkHashRate}</div>
                <div className="text-sm text-default-400">TH/s Network</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
            <Button variant="bordered" size="sm" onClick={() => router.push('/training/sessions')}>
              View All Sessions
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Card 
                key={action.title}
                className="group hover:scale-105 transition-transform duration-200 cursor-pointer"
                isPressable
                onPress={() => handleJoinSession(action.href)}
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${action.color} p-3 rounded-lg text-white shadow-lg`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    {action.badge && (
                      <Badge color="danger" variant="flat" size="sm">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-default-400">
                      {action.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <ArrowRight className="h-4 w-4 text-default-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Training Sessions */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Featured Training Sessions</h2>
              <p className="text-default-400">High-value opportunities available now</p>
            </div>
            <Button 
              variant="bordered" 
              size="sm" 
              startContent={<RefreshCw className="h-4 w-4" />}
              onClick={() => setIsLoading(true)}
            >
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {featuredSessions.map((session) => {
              const statusInfo = getStatusInfo(session.status);
              const difficultyInfo = getDifficultyInfo(session.difficulty);
              
              return (
                <Card 
                  key={session.id}
                  className="group hover:scale-102 transition-all duration-200"
                  isPressable
                  onPress={() => handleJoinSession(session.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start w-full">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {session.name}
                        </h3>
                        <p className="text-sm text-default-400 mt-1">
                          {session.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Chip
                          color={statusInfo.color as any}
                          variant="flat"
                          size="sm"
                          startContent={statusInfo.icon}
                        >
                          {statusInfo.label}
                        </Chip>
                        <Chip
                          color={difficultyInfo.color as any}
                          variant="bordered"
                          size="sm"
                          startContent={difficultyInfo.icon}
                        >
                          {difficultyInfo.label}
                        </Chip>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardBody className="space-y-4">
                    {/* Session Progress */}
                    {session.status === 'active' && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Training Progress</span>
                          <span>{session.progress}%</span>
                        </div>
                        <Progress 
                          value={session.progress} 
                          color="primary" 
                          size="sm"
                          className="mb-2"
                        />
                      </div>
                    )}
                    
                    {/* Session Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-default-400" />
                        <span>{session.participants}/{session.maxParticipants}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{session.rewardPool} APT</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-default-400" />
                        <span>{session.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-default-400" />
                        <span>{session.modelType}</span>
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    <div>
                      <div className="text-sm font-medium mb-2">Requirements:</div>
                      <div className="flex flex-wrap gap-1">
                        {session.requirements.slice(0, 2).map((req, index) => (
                          <Chip key={index} size="sm" variant="bordered" className="text-xs">
                            {req}
                          </Chip>
                        ))}
                        {session.requirements.length > 2 && (
                          <Tooltip content={session.requirements.slice(2).join(', ')}>
                            <Chip size="sm" variant="bordered" className="text-xs">
                              +{session.requirements.length - 2} more
                            </Chip>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-xs text-default-400">
                        Created {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                      <Button 
                        color="primary" 
                        variant="bordered"
                        size="sm"
                        endContent={<Eye className="h-4 w-4" />}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced Features Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                <span>How It Works</span>
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Connect Your Wallet</h4>
                  <p className="text-sm text-default-400">
                    Connect your Aptos wallet to participate in training sessions and receive rewards
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Choose Training Sessions</h4>
                  <p className="text-sm text-default-400">
                    Browse available AI training sessions and select ones that match your hardware capabilities
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Contribute Computing Power</h4>
                  <p className="text-sm text-default-400">
                    Share your computational resources to help train AI models securely and efficiently
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Earn APT Rewards</h4>
                  <p className="text-sm text-default-400">
                    Get rewarded with APT tokens based on your contribution quality and duration
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-500" />
                <span>Training Categories</span>
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="font-medium">Natural Language Processing</div>
                </div>
                <div className="text-sm text-default-400">
                  Train advanced language models for text understanding, generation, and conversation
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="font-medium">Computer Vision</div>
                </div>
                <div className="text-sm text-default-400">
                  Contribute to image recognition, object detection, and visual analysis models
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="font-medium">Reinforcement Learning</div>
                </div>
                <div className="text-sm text-default-400">
                  Help train AI agents for decision-making, optimization, and strategic planning
                </div>
              </div>
              
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <Network className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="font-medium">Multimodal Learning</div>
                </div>
                <div className="text-sm text-default-400">
                  Train models that understand and process multiple types of data simultaneously
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <span>Connect Wallet Required</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="text-center space-y-4">
                  <p>To participate in AI training sessions, please connect your Aptos wallet.</p>
                  <div className="p-4 bg-default-100 rounded-lg">
                    <p className="text-sm text-default-600">
                      Your wallet will be used to receive training rewards and verify your contributions to the network.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Connect Wallet
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}