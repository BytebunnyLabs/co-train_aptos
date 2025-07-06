"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Button } from "@heroui/react";
import { Chip } from "@heroui/react";
import { Progress } from "@heroui/react";
import { Badge } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { 
  Brain, 
  Zap, 
  Users, 
  Award, 
  Network,
  Activity,
  Globe,
  TrendingUp,
  Clock,
  Cpu,
  Server,
  Wifi,
  Shield,
  ArrowRight,
  Play,
  Pause,
  BarChart3,
  Target,
  Star,
  Medal,
  Gift,
  Eye,
  Settings,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAutoConnect } from "@/components/AutoConnectProvider";
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import toast from "react-hot-toast";

// Enhanced interfaces for the platform
interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalComputePower: number;
  averageLatency: number;
  networkUptime: number;
}

interface PlatformMetrics {
  totalSessions: number;
  activeTraining: number;
  rewardsDistributed: number;
  totalParticipants: number;
  avgSessionLength: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  badge?: string;
}

export default function Home() {
  const router = useRouter();
  const { connected, account } = useWallet();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 847,
    activeNodes: 734,
    totalComputePower: 156000,
    averageLatency: 45,
    networkUptime: 99.7
  });

  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics>({
    totalSessions: 12847,
    activeTraining: 156,
    rewardsDistributed: 847600,
    totalParticipants: 5647,
    avgSessionLength: 3.2
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Quick actions for the platform
  const quickActions: QuickAction[] = [
    {
      title: "Start Training",
      description: "Begin a new AI training session and earn rewards",
      icon: Brain,
      href: "/training",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      badge: "Hot"
    },
    {
      title: "Network Health",
      description: "Monitor real-time network status and performance",
      icon: Activity,
      href: "/hivemind/health",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "Node Rankings",
      description: "View performance leaderboard and node statistics",
      icon: Trophy,
      href: "/hivemind/nodes", 
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600"
    },
    {
      title: "Reward Tracker",
      description: "Track your earnings and claim available rewards",
      icon: Award,
      href: "/hivemind/rewards",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Network Topology",
      description: "Visualize P2P network connections and structure",
      icon: Network,
      href: "/hivemind/topology",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    },
    {
      title: "Profile & Settings",
      description: "Manage your account and training preferences",
      icon: Settings,
      href: "/profile",
      color: "bg-gradient-to-br from-gray-500 to-gray-600"
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate real-time data updates
    const dataInterval = setInterval(() => {
      setNetworkStats(prev => ({
        ...prev,
        activeNodes: prev.activeNodes + Math.floor(Math.random() * 3) - 1,
        averageLatency: Math.max(20, prev.averageLatency + Math.floor(Math.random() * 10) - 5)
      }));
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const handleQuickAction = (href: string) => {
    if (!connected && href !== '/about' && href !== '/docs') {
      toast.error('Please connect your wallet first');
      onOpen();
      return;
    }
    router.push(href);
  };

  const getNetworkHealthColor = () => {
    const healthScore = (networkStats.activeNodes / networkStats.totalNodes) * 100;
    if (healthScore >= 90) return 'text-green-500';
    if (healthScore >= 70) return 'text-yellow-500';
    return 'text-red-500';
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
            <h2 className="text-2xl font-bold">Initializing CoTrain Platform</h2>
            <p className="text-default-400">Connecting to decentralized AI training network...</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">CoTrain</h1>
                  <p className="text-xs text-default-400">Decentralized AI Training</p>
                </div>
              </div>
              
              <Badge 
                color={networkStats.networkUptime >= 99 ? 'success' : 'warning'} 
                variant="flat"
                className="hidden md:flex"
              >
                {networkStats.networkUptime}% Uptime
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-default-400" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
              <ThemeToggle />
              <ShadcnWalletSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
              Decentralized AI Training Platform
            </h1>
            <p className="text-xl text-default-400 max-w-3xl mx-auto">
              Join the next generation of AI development. Contribute your computational resources, 
              earn rewards, and help train the future of artificial intelligence.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              color="primary" 
              size="lg"
              startContent={<Play className="h-5 w-5" />}
              onClick={() => handleQuickAction('/training')}
              className="px-8"
            >
              Start Training
            </Button>
            <Button 
              variant="bordered" 
              size="lg"
              startContent={<Eye className="h-5 w-5" />}
              onClick={() => router.push('/about')}
              className="px-8"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Real-time Network Status */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Network Status</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-default-400">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Server className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{networkStats.totalNodes.toLocaleString()}</div>
                <div className="text-sm text-default-400">Total Nodes</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Shield className={`h-6 w-6 ${getNetworkHealthColor()}`} />
                </div>
                <div className={`text-2xl font-bold ${getNetworkHealthColor()}`}>
                  {networkStats.activeNodes.toLocaleString()}
                </div>
                <div className="text-sm text-default-400">Active Nodes</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Cpu className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">{(networkStats.totalComputePower / 1000).toFixed(1)}K</div>
                <div className="text-sm text-default-400">TFLOPS</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{networkStats.averageLatency}ms</div>
                <div className="text-sm text-default-400">Avg Latency</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">{networkStats.networkUptime}%</div>
                <div className="text-sm text-default-400">Uptime</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardBody className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{platformMetrics.totalSessions.toLocaleString()}</div>
              <div className="text-sm text-default-400">Total Sessions</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{platformMetrics.activeTraining}</div>
              <div className="text-sm text-default-400">Active Training</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{(platformMetrics.rewardsDistributed / 1000).toFixed(1)}K</div>
              <div className="text-sm text-default-400">APT Distributed</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{(platformMetrics.totalParticipants / 1000).toFixed(1)}K</div>
              <div className="text-sm text-default-400">Participants</div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold">{platformMetrics.avgSessionLength}h</div>
              <div className="text-sm text-default-400">Avg Session</div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
            <Button variant="bordered" size="sm" onClick={() => router.push('/training')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={action.title}
                className="group hover:scale-105 transition-transform duration-200 cursor-pointer"
                isPressable
                onPress={() => handleQuickAction(action.href)}
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

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                <span>Why Choose CoTrain?</span>
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Decentralized Network</h4>
                  <p className="text-sm text-default-400">
                    Participate in a truly decentralized AI training ecosystem
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Earn Real Rewards</h4>
                  <p className="text-sm text-default-400">
                    Get compensated with APT tokens for your computational contributions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/10 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Secure & Transparent</h4>
                  <p className="text-sm text-default-400">
                    Blockchain-based verification ensures fair rewards and secure training
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Target className="h-6 w-6 text-blue-500" />
                <span>Getting Started</span>
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Connect Your Wallet</h4>
                  <p className="text-sm text-default-400">
                    Connect your Aptos wallet to start participating in training sessions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Join Training Sessions</h4>
                  <p className="text-sm text-default-400">
                    Browse available AI training sessions and contribute your compute power
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Earn Rewards</h4>
                  <p className="text-sm text-default-400">
                    Receive APT tokens based on your contribution quality and duration
                  </p>
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
                  <p>To access CoTrain platform features, please connect your Aptos wallet.</p>
                  <div className="p-4 bg-default-100 rounded-lg">
                    <ShadcnWalletSelector />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}