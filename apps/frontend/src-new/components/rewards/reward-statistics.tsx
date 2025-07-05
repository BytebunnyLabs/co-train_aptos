'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Chip } from '@heroui/react';
import { 
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Flame,
  Star,
  Trophy,
  Clock,
  Zap
} from 'lucide-react';
import { useRewardsStore } from '@/lib/stores';

export function RewardStatistics() {
  const { stats } = useRewardsStore();

  // Mock enhanced statistics
  const enhancedStats = {
    ...stats,
    totalEarned: 2847.5,
    totalClaimed: 2125.75,
    totalStaked: 1750.0,
    nftCount: 12,
    rank: 147,
    streak: 14,
    weeklyEarnings: 125.5,
    monthlyEarnings: 487.2,
    efficiency: 94.2,
    completedSessions: 67,
    totalHours: 284.5,
    averageSessionRating: 4.8
  };

  const achievements = [
    {
      id: 'first_100_hours',
      name: '100 Hour Milestone',
      description: 'Completed 100+ training hours',
      icon: '⏰',
      unlocked: true,
      progress: 100
    },
    {
      id: 'efficiency_master',
      name: 'Efficiency Master',
      description: 'Maintain 90%+ efficiency for 30 days',
      icon: '⚡',
      unlocked: true,
      progress: 100
    },
    {
      id: 'consistency_champion',
      name: 'Consistency Champion',
      description: 'Train for 30 consecutive days',
      icon: '🔥',
      unlocked: false,
      progress: 47
    },
    {
      id: 'top_performer',
      name: 'Top Performer',
      description: 'Reach top 100 global ranking',
      icon: '🏆',
      unlocked: true,
      progress: 100
    }
  ];

  const weeklyData = [
    { day: 'Mon', earned: 18.5, claimed: 15.2 },
    { day: 'Tue', earned: 22.1, claimed: 18.7 },
    { day: 'Wed', earned: 16.8, claimed: 20.3 },
    { day: 'Thu', earned: 25.4, claimed: 22.1 },
    { day: 'Fri', earned: 19.7, claimed: 16.8 },
    { day: 'Sat', earned: 12.3, claimed: 14.9 },
    { day: 'Sun', earned: 10.7, claimed: 17.5 }
  ];

  const maxWeeklyEarned = Math.max(...weeklyData.map(d => d.earned));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Reward Statistics</h3>
            <p className="text-sm text-foreground-600">
              Your training performance and rewards overview
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-foreground/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <p className="text-lg font-bold">#{enhancedStats.rank}</p>
            <p className="text-xs text-foreground-600">Global Rank</p>
          </div>
          
          <div className="bg-foreground/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-lg font-bold">{enhancedStats.streak}</p>
            <p className="text-xs text-foreground-600">Day Streak</p>
          </div>
          
          <div className="bg-foreground/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 text-success" />
            </div>
            <p className="text-lg font-bold">{enhancedStats.efficiency}%</p>
            <p className="text-xs text-foreground-600">Efficiency</p>
          </div>
          
          <div className="bg-foreground/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-lg font-bold">{enhancedStats.totalHours.toFixed(1)}h</p>
            <p className="text-xs text-foreground-600">Total Hours</p>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="space-y-3">
          <h4 className="font-medium">Earnings Overview</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-600">Total Earned</span>
              <span className="font-semibold">{enhancedStats.totalEarned.toFixed(2)} COTRAIN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-600">Total Claimed</span>
              <span className="font-semibold text-success">{enhancedStats.totalClaimed.toFixed(2)} COTRAIN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground-600">Currently Staked</span>
              <span className="font-semibold text-primary">{enhancedStats.totalStaked.toFixed(2)} COTRAIN</span>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Claim Rate</span>
              <span className="text-sm">{((enhancedStats.totalClaimed / enhancedStats.totalEarned) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(enhancedStats.totalClaimed / enhancedStats.totalEarned) * 100}
              color="success"
              size="sm"
            />
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="space-y-3">
          <h4 className="font-medium">Weekly Activity</h4>
          <div className="space-y-2">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex items-center space-x-3">
                <span className="text-xs font-medium w-8">{day.day}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-primary">Earned: {day.earned.toFixed(1)}</span>
                    <span className="text-success">Claimed: {day.claimed.toFixed(1)}</span>
                  </div>
                  <div className="flex space-x-1">
                    <div 
                      className="h-2 bg-primary/20 rounded-full relative overflow-hidden"
                      style={{ width: '50%' }}
                    >
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(day.earned / maxWeeklyEarned) * 100}%` }}
                      />
                    </div>
                    <div 
                      className="h-2 bg-success/20 rounded-full relative overflow-hidden"
                      style={{ width: '50%' }}
                    >
                      <div 
                        className="h-full bg-success rounded-full"
                        style={{ width: `${(day.claimed / maxWeeklyEarned) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Achievements</h4>
            <Chip size="sm" variant="flat" color="primary">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </Chip>
          </div>
          
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`border rounded-lg p-3 ${
                  achievement.unlocked 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-divider'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-sm">{achievement.name}</h5>
                      {achievement.unlocked && (
                        <Chip size="sm" color="success" variant="flat">
                          Unlocked
                        </Chip>
                      )}
                    </div>
                    <p className="text-xs text-foreground-600 mb-2">
                      {achievement.description}
                    </p>
                    
                    {!achievement.unlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress 
                          value={achievement.progress}
                          color="primary"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-secondary mt-0.5" />
            <div>
              <h4 className="font-medium text-secondary">Performance Insight</h4>
              <p className="text-sm text-foreground-600 mt-1">
                Your efficiency has improved by 15% this month! Consider increasing your 
                staking position to maximize passive rewards from your consistent performance.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-warning" />
              <span className="text-sm">NFTs Collected</span>
            </div>
            <span className="font-semibold">{enhancedStats.nftCount}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm">Training Sessions</span>
            </div>
            <span className="font-semibold">{enhancedStats.completedSessions}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-secondary" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <span className="font-semibold">{enhancedStats.averageSessionRating}/5.0</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}