'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Button } from '@/components/cotrain/ui/button';
import { Badge } from '@/components/cotrain/ui/badge';
import { Progress } from '@/components/cotrain/ui/progress';
import { Alert, AlertDescription } from '@/components/cotrain/ui/alert';
import { Avatar, AvatarFallback } from '@/components/cotrain/ui/avatar';
import { useToast } from '@/components/cotrain/ui/use-toast';
import { useAptosContract } from '@/hooks/useAptosContract';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserPlus,
  Star,
  Activity,
  Share2,
  MoreHorizontal
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
  participants: ParticipantInfo[];
}

interface ParticipantInfo {
  address: string;
  score: number;
  joinedAt: Date;
  contribution?: string;
}

// Mock data for demonstration
const mockSessionData: SessionDetails = {
  id: '0x1234567890abcdef',
  name: 'Advanced NLP Model Training',
  description: 'Train a state-of-the-art natural language processing model with distributed computing. This session focuses on training a transformer-based model for multilingual text understanding and generation. Participants will contribute computational resources and receive rewards based on their contribution quality and duration.',
  rewardAmount: 50000000000, // 500 APT in octas
  maxParticipants: 20,
  currentParticipants: 15,
  duration: 7200,
  status: 'active',
  createdAt: new Date(Date.now() - 86400000),
  creator: '0xabcdef1234567890',
  participants: [
    {
      address: '0x1111111111111111',
      score: 95,
      joinedAt: new Date(Date.now() - 3600000),
      contribution: 'High-quality data preprocessing'
    },
    {
      address: '0x2222222222222222',
      score: 87,
      joinedAt: new Date(Date.now() - 7200000),
      contribution: 'Model optimization contributions'
    },
    {
      address: '0x3333333333333333',
      score: 92,
      joinedAt: new Date(Date.now() - 10800000),
      contribution: 'Validation data preparation'
    },
  ],
};

export default function SessionDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { 
    registerForSession, 
    getSessionDetails, 
    connected, 
    account, 
    isLoading: contractLoading,
    completeSession
  } = useAptosContract();
  const { trackTransaction, pendingTransactions } = useTransactionStatus();
  
  const sessionId = params.id as string;
  
  const { 
    sessionData: realtimeData, 
    isConnected: wsConnected, 
    participantCount: liveParticipantCount,
    recentUpdates,
    hasRecentActivity,
    getParticipantUpdates,
    refreshSessionInfo
  } = useRealtimeSession(sessionId);
  const { connected: wsEnabled, notifications } = useWebSocket();

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [userParticipation, setUserParticipation] = useState<ParticipantInfo | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (session && account) {
      const participation = session.participants.find(p => p.address === account.address.toString());
      setUserParticipation(participation || null);
    }
  }, [session, account]);

  const loadSessionData = async () => {
    setIsLoading(true);
    try {
      // In real implementation, fetch from contract
      // const sessionData = await getSessionDetails(sessionId);
      
      // For now, use mock data
      setSession(mockSessionData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load session details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to join the session.",
        variant: "destructive",
      });
      return;
    }

    if (!session) return;

    if (session.currentParticipants >= session.maxParticipants) {
      toast({
        title: "Session Full",
        description: "This session has reached maximum participants.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const result = await registerForSession(sessionId);

      if (result.success && result.hash) {
        await trackTransaction(result.hash, 'join_session', 'Joining training session');
        
        toast({
          title: "Registration Initiated",
          description: "Your registration is being processed on the blockchain.",
        });

        // Refresh session data after a delay
        setTimeout(() => {
          loadSessionData();
        }, 3000);
      } else {
        toast({
          title: "Registration Failed",
          description: result.message || "Failed to join session.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!connected || !account || !session) return;

    if (session.creator !== account.address.toString()) {
      toast({
        title: "Access Denied",
        description: "Only the session creator can complete the session.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    try {
      const result = await completeSession(sessionId);

      if (result.success && result.hash) {
        await trackTransaction(result.hash, 'complete_session', 'Completing training session');
        
        toast({
          title: "Completion Initiated",
          description: "Session completion is being processed on the blockchain.",
        });

        setTimeout(() => {
          loadSessionData();
        }, 3000);
      } else {
        toast({
          title: "Completion Failed",
          description: result.message || "Failed to complete session.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Unexpected Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    return `${(amount / 100000000).toFixed(2)} APT`;
  };

  // Use real-time participant count if available, fallback to session data
  const currentParticipants = liveParticipantCount > 0 ? liveParticipantCount : session?.currentParticipants || 0;
  const participationProgress = session ? (currentParticipants / session.maxParticipants) * 100 : 0;
  const isCreator = session && account && session.creator === account.address.toString();
  const isParticipant = !!userParticipation;
  const canJoin = session && session.status === 'active' && !isParticipant && session.currentParticipants < session.maxParticipants;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading session details...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Session not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Real-time Connection Status */}
      {wsEnabled && (
        <Alert className={`mb-6 ${wsConnected ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-500'} ${wsConnected ? 'animate-pulse' : ''}`} />
            <AlertDescription className={wsConnected ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}>
              {wsConnected ? 'Live updates enabled' : 'Connecting to live updates...'}
              {hasRecentActivity && ' • Recent activity detected'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {pendingTransactions.length} transaction(s) pending...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{session.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(session.status)}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Creator: {formatAddress(session.creator)}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {session.description}
              </p>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({currentParticipants}/{session.maxParticipants})
                {wsConnected && hasRecentActivity && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Active contributors to this training session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={participationProgress} className="w-full" />
                
                <div className="space-y-3">
                  {session.participants.map((participant, index) => (
                    <div key={participant.address} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {index + 1}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {formatAddress(participant.address)}
                            {participant.address === account?.address.toString() && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {participant.joinedAt.toLocaleDateString()}
                          </div>
                          {participant.contribution && (
                            <div className="text-sm text-muted-foreground">
                              {participant.contribution}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{participant.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {session.currentParticipants === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No participants yet. Be the first to join!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connect your wallet to participate
                  </AlertDescription>
                </Alert>
              ) : isParticipant ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    You are participating in this session
                  </AlertDescription>
                </Alert>
              ) : canJoin ? (
                <Button 
                  onClick={handleJoinSession} 
                  disabled={isJoining}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Session
                    </>
                  )}
                </Button>
              ) : session.status === 'completed' ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This session has been completed
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Session is full or not accepting participants
                  </AlertDescription>
                </Alert>
              )}

              {isCreator && session.status === 'active' && (
                <Button 
                  variant="outline" 
                  onClick={handleCompleteSession}
                  disabled={isCompleting}
                  className="w-full"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Session
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Reward Pool</span>
                </div>
                <span className="font-medium">{formatReward(session.rewardAmount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Duration</span>
                </div>
                <span className="font-medium">{formatDuration(session.duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>Created</span>
                </div>
                <span className="font-medium">{session.createdAt.toLocaleDateString()}</span>
              </div>

              {session.completedAt && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span>Completed</span>
                  </div>
                  <span className="font-medium">{session.completedAt.toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  <span>Progress</span>
                </div>
                <span className="font-medium">{participationProgress.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* User Score (if participating) */}
          {userParticipation && (
            <Card>
              <CardHeader>
                <CardTitle>Your Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-yellow-600">
                    {userParticipation.score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Contribution Score
                  </div>
                  {userParticipation.contribution && (
                    <div className="text-sm bg-muted p-2 rounded">
                      {userParticipation.contribution}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}