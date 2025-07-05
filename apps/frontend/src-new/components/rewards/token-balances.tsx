'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Progress } from '@heroui/react';
import { 
  Coins,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Download,
  Plus
} from 'lucide-react';
import { useRewardsStore } from '@/lib/stores';

export function TokenBalances() {
  const { 
    tokenBalances, 
    totalUsdValue, 
    balancesLoading, 
    refreshBalances 
  } = useRewardsStore();

  const [showValues, setShowValues] = React.useState(true);

  // Mock token balances if none exist
  const mockBalances = tokenBalances.length > 0 ? tokenBalances : [
    {
      symbol: 'COTRAIN',
      amount: 1250.75,
      decimals: 8,
      usdValue: 125.08,
      contractAddress: '0x1::cotrain::COTRAIN'
    },
    {
      symbol: 'APT',
      amount: 45.2,
      decimals: 8,
      usdValue: 542.4,
      contractAddress: '0x1::aptos_coin::AptosCoin'
    },
    {
      symbol: 'stCOTRAIN',
      amount: 890.5,
      decimals: 8,
      usdValue: 98.45,
      contractAddress: '0x1::staking::stCOTRAIN'
    }
  ];

  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'COTRAIN':
        return '🧠';
      case 'APT':
        return '🔴';
      case 'stCOTRAIN':
        return '💎';
      default:
        return '🪙';
    }
  };

  const getTokenColor = (symbol: string) => {
    switch (symbol) {
      case 'COTRAIN':
        return 'primary';
      case 'APT':
        return 'danger';
      case 'stCOTRAIN':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount: number, decimals: number = 8) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(decimals > 2 ? 2 : decimals);
  };

  const totalBalance = mockBalances.reduce((sum, token) => sum + (token.usdValue || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Coins className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Token Balances</h3>
              <p className="text-sm text-foreground-600">
                Your cryptocurrency holdings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="light"
              size="sm"
              isIconOnly
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="light"
              size="sm"
              isIconOnly
              onClick={refreshBalances}
              isLoading={balancesLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Total Value */}
        <div className="bg-foreground/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-600">Total Portfolio Value</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs text-success">+12.5%</span>
            </div>
          </div>
          <p className="text-2xl font-bold">
            {showValues ? `$${totalBalance.toFixed(2)}` : '••••••'}
          </p>
          <p className="text-xs text-foreground-600 mt-1">
            Last updated: 2 minutes ago
          </p>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {mockBalances.map((token) => (
            <div key={token.symbol} className="border border-divider rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTokenIcon(token.symbol)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{token.symbol}</h4>
                      <Chip 
                        size="sm" 
                        variant="dot" 
                        color={getTokenColor(token.symbol) as any}
                      >
                        Native
                      </Chip>
                    </div>
                    <p className="text-xs text-foreground-600">
                      {token.contractAddress?.slice(0, 10)}...
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">
                    {showValues ? formatAmount(token.amount) : '••••••'}
                  </p>
                  <p className="text-sm text-foreground-600">
                    {showValues ? `$${token.usdValue?.toFixed(2)}` : '••••••'}
                  </p>
                </div>
              </div>

              {/* Portfolio Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-600">Portfolio allocation</span>
                  <span>{((token.usdValue || 0) / totalBalance * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(token.usdValue || 0) / totalBalance * 100}
                  color={getTokenColor(token.symbol) as any}
                  size="sm"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2 mt-3">
                <Button size="sm" variant="flat" startContent={<Send className="h-3 w-3" />}>
                  Send
                </Button>
                <Button size="sm" variant="flat" startContent={<Download className="h-3 w-3" />}>
                  Receive
                </Button>
                {token.symbol === 'COTRAIN' && (
                  <Button size="sm" variant="flat" color="primary" startContent={<Plus className="h-3 w-3" />}>
                    Stake
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Token Button */}
        <Button 
          variant="bordered" 
          className="w-full"
          startContent={<Plus className="h-4 w-4" />}
        >
          Add Custom Token
        </Button>

        {/* Portfolio Insights */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary">Portfolio Insight</h4>
              <p className="text-sm text-foreground-600 mt-1">
                Your COTRAIN holdings have increased by 25% this week from training rewards. 
                Consider staking for additional passive income.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}