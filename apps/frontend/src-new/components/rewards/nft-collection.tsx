'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { 
  Award,
  Search,
  Filter,
  Star,
  Eye,
  ExternalLink,
  Grid3X3,
  List,
  Crown,
  Gem,
  Trophy
} from 'lucide-react';
import { useRewardsStore, type NFTReward } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

interface NFTCollectionProps {
  expanded?: boolean;
}

export function NFTCollection({ expanded = false }: NFTCollectionProps) {
  const { nftRewards } = useRewardsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock NFT rewards if none exist
  const mockNFTs: NFTReward[] = nftRewards.length > 0 ? nftRewards : [
    {
      id: 'nft_001',
      name: 'AI Trainer Genesis',
      description: 'First-generation AI trainer badge for early contributors',
      image: '/api/placeholder/200/200',
      collection: 'CoTrain Badges',
      rarity: 'legendary',
      earnedDate: '2024-01-15T10:00:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Training Hours', value: 100 },
        { trait_type: 'Efficiency', value: '95%' }
      ],
      tokenId: '001',
      contractAddress: '0x1::cotrain_nfts::TrainerBadge'
    },
    {
      id: 'nft_002',
      name: 'Efficiency Master',
      description: 'Awarded for maintaining 90%+ efficiency for 30 days',
      image: '/api/placeholder/200/200',
      collection: 'Achievement NFTs',
      rarity: 'epic',
      earnedDate: '2024-01-12T14:30:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Epic' },
        { trait_type: 'Achievement', value: 'Efficiency Master' },
        { trait_type: 'Duration', value: '30 days' }
      ],
      tokenId: '045',
      contractAddress: '0x1::cotrain_nfts::AchievementBadge'
    },
    {
      id: 'nft_003',
      name: 'Neural Network Pioneer',
      description: 'Contributed to training the first neural network model',
      image: '/api/placeholder/200/200',
      collection: 'Pioneer Series',
      rarity: 'rare',
      earnedDate: '2024-01-10T09:15:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Rare' },
        { trait_type: 'Model Type', value: 'Neural Network' },
        { trait_type: 'Contribution', value: 'Pioneer' }
      ],
      tokenId: '127',
      contractAddress: '0x1::cotrain_nfts::PioneerBadge'
    },
    {
      id: 'nft_004',
      name: 'Daily Contributor',
      description: 'Consistent daily training participant',
      image: '/api/placeholder/200/200',
      collection: 'Consistency Rewards',
      rarity: 'common',
      earnedDate: '2024-01-08T16:45:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Streak', value: '7 days' },
        { trait_type: 'Type', value: 'Consistency' }
      ],
      tokenId: '892',
      contractAddress: '0x1::cotrain_nfts::ConsistencyBadge'
    },
    {
      id: 'nft_005',
      name: 'Top Performer',
      description: 'Ranked in top 100 global leaderboard',
      image: '/api/placeholder/200/200',
      collection: 'Performance Series',
      rarity: 'epic',
      earnedDate: '2024-01-05T12:20:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Epic' },
        { trait_type: 'Rank', value: 'Top 100' },
        { trait_type: 'Achievement', value: 'Leaderboard' }
      ],
      tokenId: '234',
      contractAddress: '0x1::cotrain_nfts::PerformanceBadge'
    },
    {
      id: 'nft_006',
      name: 'Model Whisperer',
      description: 'Contributed to 5 different AI model types',
      image: '/api/placeholder/200/200',
      collection: 'Diversity Awards',
      rarity: 'rare',
      earnedDate: '2024-01-03T11:10:00Z',
      attributes: [
        { trait_type: 'Rarity', value: 'Rare' },
        { trait_type: 'Models', value: 5 },
        { trait_type: 'Diversity', value: 'High' }
      ],
      tokenId: '567',
      contractAddress: '0x1::cotrain_nfts::DiversityBadge'
    }
  ];

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Crown className="h-4 w-4" />;
      case 'epic':
        return <Gem className="h-4 w-4" />;
      case 'rare':
        return <Star className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'warning';
      case 'epic':
        return 'secondary';
      case 'rare':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  // Filter and search logic
  const filteredNFTs = mockNFTs.filter(nft => {
    const matchesSearch = 
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collection.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRarity = rarityFilter === 'all' || nft.rarity === rarityFilter;
    
    return matchesSearch && matchesRarity;
  });

  const displayNFTs = expanded ? filteredNFTs : filteredNFTs.slice(0, 3);

  const rarityCount = {
    legendary: mockNFTs.filter(nft => nft.rarity === 'legendary').length,
    epic: mockNFTs.filter(nft => nft.rarity === 'epic').length,
    rare: mockNFTs.filter(nft => nft.rarity === 'rare').length,
    common: mockNFTs.filter(nft => nft.rarity === 'common').length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Award className="h-5 w-5 text-warning" />
            <div>
              <h3 className="text-lg font-semibold">NFT Collection</h3>
              <p className="text-sm text-foreground-600">
                {mockNFTs.length} achievement NFTs collected
              </p>
            </div>
          </div>
          
          {expanded && (
            <div className="flex items-center space-x-2">
              <Button
                variant="light"
                size="sm"
                isIconOnly
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Filters (only show in expanded mode) */}
        {expanded && (
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
              className="md:max-w-xs"
            />
            
            <Select
              placeholder="Filter by rarity"
              selectedKeys={rarityFilter ? [rarityFilter] : []}
              onSelectionChange={(keys) => setRarityFilter(Array.from(keys)[0] as string || 'all')}
              className="md:max-w-xs"
              startContent={<Filter className="h-4 w-4" />}
            >
              <SelectItem key="all" value="all">All Rarities</SelectItem>
              <SelectItem key="legendary" value="legendary">Legendary</SelectItem>
              <SelectItem key="epic" value="epic">Epic</SelectItem>
              <SelectItem key="rare" value="rare">Rare</SelectItem>
              <SelectItem key="common" value="common">Common</SelectItem>
            </Select>
          </div>
        )}

        {/* Rarity Distribution */}
        {expanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(rarityCount).map(([rarity, count]) => (
              <div key={rarity} className="text-center p-3 bg-foreground/5 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <div className={`text-${getRarityColor(rarity)}`}>
                    {getRarityIcon(rarity)}
                  </div>
                </div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-foreground-600 capitalize">{rarity}</p>
              </div>
            ))}
          </div>
        )}

        {/* NFT Grid/List */}
        {mockNFTs.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-foreground-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No NFTs Yet</h3>
            <p className="text-foreground-600">
              Complete training sessions and achievements to earn your first NFT!
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? `grid grid-cols-1 ${expanded ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3'} gap-4`
              : 'space-y-4'
          }>
            {displayNFTs.map((nft) => (
              <div key={nft.id} className={viewMode === 'grid' ? '' : 'flex items-center space-x-4'}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="border border-divider rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* NFT Image with Rarity Border */}
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityGradient(nft.rarity)} opacity-20`}></div>
                      <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Award className="h-16 w-16 text-primary opacity-50" />
                      </div>
                      
                      {/* Rarity Badge */}
                      <div className="absolute top-2 right-2">
                        <Chip 
                          size="sm" 
                          color={getRarityColor(nft.rarity) as any}
                          variant="flat"
                          startContent={getRarityIcon(nft.rarity)}
                        >
                          {nft.rarity.toUpperCase()}
                        </Chip>
                      </div>
                    </div>
                    
                    {/* NFT Details */}
                    <div className="p-4">
                      <h4 className="font-semibold mb-1">{nft.name}</h4>
                      <p className="text-sm text-foreground-600 mb-2 line-clamp-2">
                        {nft.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-foreground-500 mb-3">
                        <span>{nft.collection}</span>
                        <span>#{nft.tokenId}</span>
                      </div>
                      
                      <p className="text-xs text-foreground-600 mb-3">
                        Earned {formatDistanceToNow(new Date(nft.earnedDate), { addSuffix: true })}
                      </p>
                      
                      {/* Quick Actions */}
                      <div className="flex space-x-2">
                        <Button size="sm" variant="flat" className="flex-1" startContent={<Eye className="h-3 w-3" />}>
                          View
                        </Button>
                        <Button size="sm" variant="light" isIconOnly>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center space-x-4 border border-divider rounded-lg p-4 w-full">
                    {/* NFT Thumbnail */}
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    
                    {/* NFT Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold truncate">{nft.name}</h4>
                        <Chip 
                          size="sm" 
                          color={getRarityColor(nft.rarity) as any}
                          variant="flat"
                          startContent={getRarityIcon(nft.rarity)}
                        >
                          {nft.rarity.toUpperCase()}
                        </Chip>
                      </div>
                      <p className="text-sm text-foreground-600 mb-1 line-clamp-1">
                        {nft.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-foreground-500">
                        <span>{nft.collection}</span>
                        <span>#{nft.tokenId}</span>
                        <span>Earned {formatDistanceToNow(new Date(nft.earnedDate), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="flat" startContent={<Eye className="h-3 w-3" />}>
                        View
                      </Button>
                      <Button size="sm" variant="light" isIconOnly>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show More Button (only in compact mode) */}
        {!expanded && mockNFTs.length > 3 && (
          <Button variant="bordered" className="w-full">
            View All {mockNFTs.length} NFTs
          </Button>
        )}

        {/* Collection Value */}
        {mockNFTs.length > 0 && (
          <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-warning">Collection Value</h4>
                <p className="text-sm text-foreground-600">
                  {mockNFTs.length} unique NFTs across {new Set(mockNFTs.map(nft => nft.collection)).size} collections
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">Floor: 0.25 APT</p>
                <p className="text-sm text-foreground-600">Est. Value: 2.8 APT</p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}