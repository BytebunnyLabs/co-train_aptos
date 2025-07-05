'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { 
  Wallet,
  Shield,
  Zap,
  Star,
  ChevronRight,
  Info
} from 'lucide-react';
import { useRewardsStore } from '@/lib/stores';

export function WalletConnection() {
  const { connectWallet, error } = useRewardsStore();

  const walletOptions = [
    {
      name: 'Petra Wallet',
      description: 'The most popular Aptos wallet',
      icon: '🟣',
      type: 'petra',
      features: ['Secure', 'Easy to use', 'Mobile app']
    },
    {
      name: 'Martian Wallet',
      description: 'Multi-chain wallet with Aptos support',
      icon: '🔴',
      type: 'martian',
      features: ['Multi-chain', 'DeFi ready', 'NFT support']
    },
    {
      name: 'MSafe Wallet',
      description: 'Multi-signature wallet for teams',
      icon: '🔒',
      type: 'msafe',
      features: ['Multi-sig', 'Team accounts', 'Enterprise']
    },
    {
      name: 'Fewcha Wallet',
      description: 'Lightweight Aptos wallet',
      icon: '🟡',
      type: 'fewcha',
      features: ['Lightweight', 'Fast', 'Simple']
    }
  ];

  const handleConnect = async (walletType: string) => {
    try {
      await connectWallet(walletType);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardBody className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-lg text-foreground-600 mb-6 max-w-2xl mx-auto">
            Connect your Aptos wallet to access your training rewards, stake tokens, and manage your NFT collection from distributed AI training contributions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-success" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="h-4 w-4 text-warning" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Star className="h-4 w-4 text-secondary" />
              <span>Earn Rewards</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-l-danger bg-danger/5">
          <CardBody>
            <div className="flex items-center space-x-3">
              <Info className="h-5 w-5 text-danger" />
              <div>
                <p className="font-medium text-danger">Connection Failed</p>
                <p className="text-sm text-foreground-600">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Wallet Options */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Choose Your Wallet</h2>
          <p className="text-sm text-foreground-600">
            Select a wallet to connect and start managing your rewards
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          {walletOptions.map((wallet) => (
            <div
              key={wallet.type}
              className="border border-divider rounded-lg p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => handleConnect(wallet.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div>
                    <h3 className="font-semibold">{wallet.name}</h3>
                    <p className="text-sm text-foreground-600">{wallet.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {wallet.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-foreground/10 px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-foreground-400" />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Instant Rewards</h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-foreground-600 mb-4">
              Start earning rewards immediately after connecting your wallet. Your training contributions are automatically tracked and rewarded.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>COTRAIN tokens for training participation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>Exclusive NFTs for achievements</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>Staking rewards from token holdings</span>
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Security & Privacy</h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-foreground-600 mb-4">
              Your wallet connection is secure and private. We never store your private keys or have access to your funds.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>Non-custodial wallet integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>Encrypted transaction signing</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                <span>Local key management</span>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">New to Aptos Wallets?</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium mb-2">Download Wallet</h4>
              <p className="text-sm text-foreground-600">
                Choose and download a wallet app from the official store
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium mb-2">Create Account</h4>
              <p className="text-sm text-foreground-600">
                Set up your wallet and securely store your seed phrase
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium mb-2">Connect & Earn</h4>
              <p className="text-sm text-foreground-600">
                Connect to CoTrain and start earning rewards
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}