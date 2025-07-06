'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Chip, Input, Select, SelectItem, Alert } from '@heroui/react';
import { Button } from '@/components/heroui/button';
import { useToast } from '@/components/cotrain/ui/use-toast';
import { useAptosContract } from '@/hooks/useAptosContract';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Trophy, 
  AlertCircle, 
  Loader2,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface SessionDetails {
  id: string;
  name: string;
  description: string;
  rewardAmount: number;
  maxParticipants: number;
  currentParticipants: number;
  duration: number;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  creator: string;
  participants: string[];
}

type SessionStatus = 'all' | 'active' | 'completed' | 'pending';

// Mock data for demonstration (replace with real data from contract)
const mockSessions: SessionDetails[] = [
  {
    id: '0x1234567890abcdef',
    name: 'Advanced NLP Model Training',
    description: 'Train a state-of-the-art natural language processing model with distributed computing.',
    rewardAmount: 500,
    maxParticipants: 20,
    currentParticipants: 15,
    duration: 7200,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000),
    creator: '0xabcdef1234567890',
    participants: [],
  },
  {
    id: '0xfedcba0987654321',
    name: 'Computer Vision Dataset Training',
    description: 'Collaborative training on a large-scale computer vision dataset for object detection.',
    rewardAmount: 300,
    maxParticipants: 15,
    currentParticipants: 12,
    duration: 3600,
    status: 'active',
    createdAt: new Date(Date.now() - 43200000),
    creator: '0x1234567890abcdef',
    participants: [],
  },
  {
    id: '0x1111222233334444',
    name: 'Reinforcement Learning Challenge',
    description: 'Train RL agents to solve complex decision-making problems.',
    rewardAmount: 800,
    maxParticipants: 10,
    currentParticipants: 10,
    duration: 14400,
    status: 'completed',
    createdAt: new Date(Date.now() - 172800000),
    completedAt: new Date(Date.now() - 86400000),
    creator: '0x9876543210fedcba',
    participants: [],
  },
];

export default function TrainingSessions() {
  const router = useRouter();
  const { toast } = useToast();
  const { connected, account, isLoading: contractLoading } = useAptosContract();

  const [sessions, setSessions] = useState<SessionDetails[]>(mockSessions);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus>('all');

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip color="success" variant="flat">Active</Chip>;
      case 'completed':
        return <Chip color="default" variant="flat">Completed</Chip>;
      case 'pending':
        return <Chip variant="bordered">Pending</Chip>;
      default:
        return <Chip variant="bordered">{status}</Chip>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'completed':
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      default:
        return '';
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatReward = (amount: number): string => {
    return `${(amount / 100000000).toFixed(2)} APT`; // Convert octas to APT
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/training/sessions/${sessionId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Training Sessions</h1>
          <p className="text-default-400">
            Discover and participate in AI training sessions
          </p>
        </div>
        <Button onPress={() => router.push('/training/create')} isDisabled={!connected}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>

      {/* Wallet Connection Status */}
      {!connected && (
        <Alert 
          color="warning" 
          variant="flat" 
          className="mb-6"
          startContent={<AlertCircle className="h-4 w-4" />}
        >
          Connect your wallet to create sessions and participate in training.
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-default-400" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select 
                selectedKeys={[statusFilter]} 
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as SessionStatus)}
                placeholder="Filter by status"
                startContent={<Filter className="h-4 w-4" />}
              >
                <SelectItem key="all">All Sessions</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
                <SelectItem key="pending">Pending</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sessions...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="text-default-400">
              {searchQuery || statusFilter !== 'all' ? 
                'No sessions match your criteria.' : 
                'No training sessions available yet.'
              }
            </div>
            {connected && (
              <Button 
                variant="outline" 
                className="mt-4"
                onPress={() => router.push('/training/create')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Session
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(session.status)}`}
              onClick={() => handleSessionClick(session.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold line-clamp-2">{session.name}</h3>
                  {getStatusBadge(session.status)}
                </div>
                <p className="text-default-400 line-clamp-3">
                  {session.description}
                </p>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {/* Reward and Participants */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{formatReward(session.rewardAmount)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{session.currentParticipants}/{session.maxParticipants}</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-sm text-default-400">
                    <Clock className="h-4 w-4" />
                    <span>Duration: {formatDuration(session.duration)}</span>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-1 text-sm text-default-400">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {session.createdAt.toLocaleDateString()}</span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button 
                      variant={session.status === 'active' ? 'default' : 'outline'} 
                      size="sm" 
                      className="w-full"
                      onPress={() => {
                        handleSessionClick(session.id);
                      }}
                    >
                      {session.status === 'active' ? 'Join Session' : 'View Details'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-default-500">Active Sessions</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.reduce((acc, s) => acc + s.currentParticipants, 0)}
            </div>
            <div className="text-sm text-default-500">Total Participants</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {sessions.reduce((acc, s) => acc + s.rewardAmount, 0) / 100000000} APT
            </div>
            <div className="text-sm text-default-500">Total Rewards</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-default-500">Completed</div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}