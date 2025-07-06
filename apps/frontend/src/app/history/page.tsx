"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader, Button, Chip, Badge, Progress, Tabs, Tab } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Tooltip } from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { 
  History, 
  Calendar, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ImageIcon,
  Brain,
  Activity,
  Users,
  Coins,
  Star,
  Trophy,
  Target,
  Zap,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Timer,
  Database,
  ChevronRight,
  AlertCircle,
  Cpu,
  Server,
  Network
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import toast from "react-hot-toast";

interface TrainingSession {
  id: string;
  name: string;
  modelType: string;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: number; // hours
  rewardEarned: number;
  participantCount: number;
  computeContributed: number; // hours
  efficiency: number; // percentage
  reputation: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nftEarned?: string;
}

interface UserStats {
  totalComputeHours: number;
  totalTokens: number;
  totalReputation: number;
  completedProjects: number;
  totalNFTs: number;
  averageReward: number;
  successRate: number;
  rank: number;
  streak: number;
}

function HistoryPageContent() {
  const router = useRouter();
  const { connected } = useWallet();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalComputeHours: 24.5,
    totalTokens: 15420,
    totalReputation: 892,
    completedProjects: 12,
    totalNFTs: 3,
    averageReward: 127.5,
    successRate: 94.2,
    rank: 156,
    streak: 7
  });

  const [sessions, setSessions] = useState<TrainingSession[]>([
    {
      id: "session-001",
      name: "GPT-4.5 Fine-tuning",
      modelType: "Large Language Model",
      status: "completed",
      startTime: "2024-01-15T10:00:00Z",
      endTime: "2024-01-15T16:30:00Z",
      duration: 6.5,
      rewardEarned: 245,
      participantCount: 23,
      computeContributed: 6.5,
      efficiency: 96.8,
      reputation: 85,
      difficulty: "advanced",
      nftEarned: "Elite Trainer Badge #001"
    },
    {
      id: "session-002",
      name: "Vision Transformer Training",
      modelType: "Vision Transformer",
      status: "completed",
      startTime: "2024-01-14T14:00:00Z",
      endTime: "2024-01-14T18:00:00Z",
      duration: 4,
      rewardEarned: 180,
      participantCount: 15,
      computeContributed: 4,
      efficiency: 92.3,
      reputation: 72,
      difficulty: "intermediate"
    },
    {
      id: "session-003",
      name: "BERT Classification",
      modelType: "BERT",
      status: "in_progress",
      startTime: "2024-01-16T16:00:00Z",
      duration: 0,
      rewardEarned: 0,
      participantCount: 18,
      computeContributed: 2.3,
      efficiency: 89.1,
      reputation: 0,
      difficulty: "beginner"
    },
    {
      id: "session-004",
      name: "Reinforcement Learning Agent",
      modelType: "RL Agent",
      status: "failed",
      startTime: "2024-01-13T09:00:00Z",
      endTime: "2024-01-13T10:30:00Z",
      duration: 1.5,
      rewardEarned: 0,
      participantCount: 8,
      computeContributed: 1.5,
      efficiency: 45.2,
      reputation: -10,
      difficulty: "advanced"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (page: string) => {
    router.push(`/${page}`);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'success', label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> };
      case 'in_progress':
        return { color: 'warning', label: 'In Progress', icon: <Play className="h-3 w-3" /> };
      case 'failed':
        return { color: 'danger', label: 'Failed', icon: <AlertCircle className="h-3 w-3" /> };
      case 'cancelled':
        return { color: 'default', label: 'Cancelled', icon: <Pause className="h-3 w-3" /> };
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
        return { color: 'danger', label: 'Advanced', icon: <Trophy className="h-3 w-3" /> };
      default:
        return { color: 'default', label: 'Unknown', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      if (filterStatus !== 'all' && session.status !== filterStatus) return false;
      if (filterDifficulty !== 'all' && session.difficulty !== filterDifficulty) return false;
      return true;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    return `${hours.toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <History className="h-16 w-16 mx-auto animate-pulse text-primary" />
            <div className="absolute inset-0 animate-ping">
              <History className="h-16 w-16 mx-auto text-primary/30" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Loading Training History</h2>
            <p className="text-default-400">Retrieving your participation data...</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent flex items-center space-x-3">
              <History className="h-8 w-8 text-primary" />
              <span>Training History</span>
            </h1>
            <p className="text-default-400 text-lg">
              Your participation history in distributed AI training projects
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="bordered"
              onPress={() => handleNavigate("training")}
              startContent={<Brain className="h-4 w-4" />}
              className="px-6"
            >
              Training Options
            </Button>
            <Button
              variant="bordered"
              onPress={() => handleNavigate("terminal")}
              startContent={<Activity className="h-4 w-4" />}
              className="px-6"
            >
              Terminal View
            </Button>
          </div>
        </div>

        {/* Enhanced User Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.totalComputeHours.toFixed(1)}</div>
              <div className="text-sm text-default-400">Compute Hours</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.totalTokens.toLocaleString()}</div>
              <div className="text-sm text-default-400">Total Tokens</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.totalReputation}</div>
              <div className="text-sm text-default-400">Reputation</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.completedProjects}</div>
              <div className="text-sm text-default-400">Completed</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <ImageIcon className="h-6 w-6 text-pink-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.totalNFTs}</div>
              <div className="text-sm text-default-400">NFTs Earned</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.averageReward.toFixed(1)}</div>
              <div className="text-sm text-default-400">Avg Reward</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.successRate}%</div>
              <div className="text-sm text-default-400">Success Rate</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">#{userStats.rank}</div>
              <div className="text-sm text-default-400">Global Rank</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.streak}</div>
              <div className="text-sm text-default-400">Day Streak</div>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Select
                  selectedKeys={filterStatus !== 'all' ? [filterStatus] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilterStatus(selected || 'all');
                  }}
                  placeholder="Filter by Status"
                  startContent={<Filter className="h-4 w-4" />}
                  className="min-w-[160px]"
                >
                  <SelectItem key="all">All Status</SelectItem>
                  <SelectItem key="completed">Completed</SelectItem>
                  <SelectItem key="in_progress">In Progress</SelectItem>
                  <SelectItem key="failed">Failed</SelectItem>
                  <SelectItem key="cancelled">Cancelled</SelectItem>
                </Select>

                <Select
                  selectedKeys={filterDifficulty !== 'all' ? [filterDifficulty] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilterDifficulty(selected || 'all');
                  }}
                  placeholder="Filter by Difficulty"
                  className="min-w-[160px]"
                >
                  <SelectItem key="all">All Difficulties</SelectItem>
                  <SelectItem key="beginner">Beginner</SelectItem>
                  <SelectItem key="intermediate">Intermediate</SelectItem>
                  <SelectItem key="advanced">Advanced</SelectItem>
                </Select>

                <Select
                  selectedKeys={timeRange ? [timeRange] : []}
                  onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
                  placeholder="Time Range"
                  className="min-w-[120px]"
                >
                  <SelectItem key="7d">7 Days</SelectItem>
                  <SelectItem key="30d">30 Days</SelectItem>
                  <SelectItem key="90d">90 Days</SelectItem>
                  <SelectItem key="all">All Time</SelectItem>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="bordered" size="sm" startContent={<RefreshCw className="h-4 w-4" />}>
                  Refresh
                </Button>
                <Button variant="bordered" size="sm" startContent={<Download className="h-4 w-4" />}>
                  Export
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Enhanced Training Sessions List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <div>
                <h3 className="text-lg font-semibold">Training Sessions</h3>
                <p className="text-default-400">
                  {getFilteredSessions().length} sessions found
                </p>
              </div>
              <Badge color="primary" variant="flat">
                {timeRange.toUpperCase()} View
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {getFilteredSessions().map((session) => {
                const statusInfo = getStatusInfo(session.status);
                const difficultyInfo = getDifficultyInfo(session.difficulty);
                
                return (
                  <Card
                    key={session.id}
                    className="group hover:scale-102 transition-all duration-200 cursor-pointer"
                    isPressable
                    onPress={() => router.push(`/training/sessions/${session.id}`)}
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {session.name}
                            </h4>
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
                            {session.nftEarned && (
                              <Badge color="secondary" variant="flat" size="sm">
                                NFT
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-default-400">
                            <span className="flex items-center space-x-1">
                              <Database className="h-4 w-4" />
                              <span>{session.modelType}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(session.startTime)}</span>
                            </span>
                            {session.endTime && (
                              <span className="flex items-center space-x-1">
                                <Timer className="h-4 w-4" />
                                <span>Duration: {formatDuration(session.duration)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {session.status === 'completed' && (
                            <div className="text-green-600 font-bold text-lg">
                              +{session.rewardEarned} APT
                            </div>
                          )}
                          {session.status === 'in_progress' && (
                            <div className="text-blue-600 font-bold text-lg">
                              In Progress
                            </div>
                          )}
                          {session.status === 'failed' && (
                            <div className="text-red-600 font-bold text-lg">
                              Failed
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-default-400" />
                          <span>{session.participantCount} participants</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4 text-default-400" />
                          <span>{formatDuration(session.computeContributed)} contributed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-default-400" />
                          <span>{session.efficiency}% efficiency</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-default-400" />
                          <span>{session.reputation > 0 ? '+' : ''}{session.reputation} reputation</span>
                        </div>
                        <div className="flex justify-end">
                          <Tooltip content="View Details">
                            <Button variant="bordered" size="sm" isIconOnly>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>

                      {session.nftEarned && (
                        <div className="mt-4 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-secondary" />
                            <span className="text-sm font-medium">NFT Earned: {session.nftEarned}</span>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}

              {getFilteredSessions().length === 0 && (
                <div className="text-center py-12 text-default-400">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Training Sessions Found</h3>
                  <p>No sessions match your current filters. Try adjusting the criteria above.</p>
                  <Button 
                    color="primary" 
                    className="mt-4"
                    onPress={() => handleNavigate('training')}
                  >
                    Start Training
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

const HistoryPage = dynamic(() => Promise.resolve(HistoryPageContent), {
  ssr: false
});

export default HistoryPage;