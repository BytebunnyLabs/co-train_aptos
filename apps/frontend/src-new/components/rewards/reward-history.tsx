'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Pagination } from '@heroui/react';
import { 
  Clock,
  Search,
  Filter,
  ExternalLink,
  Download,
  TrendingUp,
  TrendingDown,
  Coins,
  Award,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from 'lucide-react';
import { useRewardsStore, type RewardTransaction } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

export function RewardHistory() {
  const { transactions } = useRewardsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock transactions if none exist
  const mockTransactions: RewardTransaction[] = transactions.length > 0 ? transactions : [
    {
      id: 'tx_001',
      type: 'earned',
      amount: 125.5,
      symbol: 'COTRAIN',
      timestamp: '2024-01-15T10:00:00Z',
      status: 'confirmed',
      txHash: '0xabcd1234...5678efgh',
      blockHeight: 12345678,
      gasUsed: 500,
      description: 'Training reward for Language Model session',
      source: 'training'
    },
    {
      id: 'tx_002',
      type: 'claimed',
      amount: 75.25,
      symbol: 'COTRAIN',
      timestamp: '2024-01-14T16:30:00Z',
      status: 'confirmed',
      txHash: '0x1234abcd...efgh5678',
      blockHeight: 12345456,
      gasUsed: 350,
      description: 'Claimed weekly training rewards',
      source: 'training'
    },
    {
      id: 'tx_003',
      type: 'staked',
      amount: 500.0,
      symbol: 'COTRAIN',
      timestamp: '2024-01-12T09:15:00Z',
      status: 'confirmed',
      txHash: '0x5678efgh...abcd1234',
      blockHeight: 12344890,
      gasUsed: 800,
      description: 'Staked tokens in Premium Pool',
      source: 'contribution'
    },
    {
      id: 'tx_004',
      type: 'earned',
      amount: 50.0,
      symbol: 'APT',
      timestamp: '2024-01-10T14:20:00Z',
      status: 'confirmed',
      txHash: '0xefgh5678...1234abcd',
      blockHeight: 12344234,
      gasUsed: 400,
      description: 'Bonus reward for milestone achievement',
      source: 'bonus'
    },
    {
      id: 'tx_005',
      type: 'transferred',
      amount: 25.0,
      symbol: 'COTRAIN',
      timestamp: '2024-01-08T11:45:00Z',
      status: 'confirmed',
      txHash: '0x9876dcba...4321fedc',
      blockHeight: 12343567,
      gasUsed: 300,
      description: 'Sent tokens to external wallet',
      source: 'training'
    },
    {
      id: 'tx_006',
      type: 'earned',
      amount: 200.75,
      symbol: 'COTRAIN',
      timestamp: '2024-01-05T08:30:00Z',
      status: 'confirmed',
      txHash: '0xfedc4321...dcba9876',
      blockHeight: 12342890,
      gasUsed: 600,
      description: 'Computer Vision training session reward',
      source: 'training'
    },
    {
      id: 'tx_007',
      type: 'claimed',
      amount: 15.5,
      symbol: 'COTRAIN',
      timestamp: '2024-01-03T19:10:00Z',
      status: 'pending',
      description: 'Claiming staking rewards',
      source: 'contribution'
    },
    {
      id: 'tx_008',
      type: 'earned',
      amount: 10.25,
      symbol: 'COTRAIN',
      timestamp: '2024-01-01T12:00:00Z',
      status: 'failed',
      description: 'Training session reward (failed)',
      source: 'training'
    }
  ];

  const getTransactionIcon = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'claimed':
        return <Coins className="h-4 w-4 text-primary" />;
      case 'staked':
        return <Award className="h-4 w-4 text-warning" />;
      case 'transferred':
        return <Send className="h-4 w-4 text-secondary" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'earned': return 'success';
      case 'claimed': return 'primary';
      case 'staked': return 'warning';
      case 'transferred': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: RewardTransaction['status']) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getAmountDirection = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'earned':
      case 'claimed':
        return '+';
      case 'transferred':
      case 'staked':
        return '-';
      default:
        return '';
    }
  };

  const getAmountColor = (type: RewardTransaction['type']) => {
    switch (type) {
      case 'earned':
      case 'claimed':
        return 'text-success';
      case 'transferred':
      case 'staked':
        return 'text-warning';
      default:
        return 'text-foreground';
    }
  };

  // Filter and search logic
  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by timestamp (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const csvContent = [
      'Date,Type,Amount,Symbol,Status,Description,TX Hash',
      ...sortedTransactions.map(tx => [
        new Date(tx.timestamp).toLocaleDateString(),
        tx.type,
        tx.amount,
        tx.symbol,
        tx.status,
        `"${tx.description}"`,
        tx.txHash || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reward-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals for summary
  const totalEarned = mockTransactions
    .filter(tx => tx.type === 'earned' && tx.status === 'confirmed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalClaimed = mockTransactions
    .filter(tx => tx.type === 'claimed' && tx.status === 'confirmed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingAmount = mockTransactions
    .filter(tx => tx.status === 'pending')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">{totalEarned.toFixed(2)}</p>
            <p className="text-sm text-foreground-600">Total Earned</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{totalClaimed.toFixed(2)}</p>
            <p className="text-sm text-foreground-600">Total Claimed</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-warning/10">
                <RefreshCw className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingAmount.toFixed(2)}</p>
            <p className="text-sm text-foreground-600">Pending</p>
          </CardBody>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
              className="md:max-w-xs"
            />
            
            <Select
              placeholder="Filter by type"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
              startContent={<Filter className="h-4 w-4" />}
            >
              <SelectItem key="all" value="all">All Types</SelectItem>
              <SelectItem key="earned" value="earned">Earned</SelectItem>
              <SelectItem key="claimed" value="claimed">Claimed</SelectItem>
              <SelectItem key="staked" value="staked">Staked</SelectItem>
              <SelectItem key="transferred" value="transferred">Transferred</SelectItem>
            </Select>

            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="confirmed" value="confirmed">Confirmed</SelectItem>
              <SelectItem key="pending" value="pending">Pending</SelectItem>
              <SelectItem key="failed" value="failed">Failed</SelectItem>
            </Select>

            <Button
              variant="flat"
              size="sm"
              startContent={<Download className="h-4 w-4" />}
              onClick={handleExport}
              className="ml-auto"
            >
              Export CSV
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <p className="text-sm text-foreground-600">
                  {filteredTransactions.length} transactions found
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardBody className="p-0">
          <div className="space-y-1">
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-foreground-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
                <p className="text-foreground-600">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'No transactions match your current filters'
                    : 'Start training to see your transaction history'
                  }
                </p>
              </div>
            ) : (
              paginatedTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="border-b border-divider last:border-b-0 p-4 hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <Chip 
                            size="sm" 
                            color={getTransactionColor(transaction.type) as any}
                            variant="flat"
                          >
                            {transaction.type.toUpperCase()}
                          </Chip>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-foreground-600">
                          <span>
                            {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                          </span>
                          
                          {transaction.txHash && (
                            <div className="flex items-center space-x-1">
                              <span>TX: {transaction.txHash.slice(0, 10)}...</span>
                              <Button
                                variant="light"
                                size="sm"
                                isIconOnly
                                className="h-4 w-4 min-w-4"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          {transaction.blockHeight && (
                            <span>Block: {transaction.blockHeight.toLocaleString()}</span>
                          )}
                          
                          {transaction.gasUsed && (
                            <span>Gas: {transaction.gasUsed}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                          {getAmountDirection(transaction.type)}{transaction.amount.toFixed(2)} {transaction.symbol}
                        </p>
                        <Chip 
                          size="sm" 
                          color={getStatusColor(transaction.status) as any}
                          variant="dot"
                        >
                          {transaction.status.toUpperCase()}
                        </Chip>
                      </div>
                      
                      {transaction.source && (
                        <p className="text-xs text-foreground-500 capitalize mt-1">
                          {transaction.source}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}
    </div>
  );
}