'use client';

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Avatar,
  Chip,
  Divider,
  Spinner,
  Link
} from '@heroui/react';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle,
  Disconnect,
  RefreshCw
} from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useUIStore } from '@/lib/stores';

interface WalletConnectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnection({ isOpen, onClose }: WalletConnectionProps) {
  const { 
    connected,
    connecting,
    wallet,
    wallets,
    account,
    connect,
    disconnect,
    signAndSubmitTransaction
  } = useWallet();
  
  const { showSuccess, showError } = useUIStore();
  
  const [copiedAddress, setCopiedAddress] = React.useState(false);
  const [aptBalance, setAptBalance] = React.useState(0);
  const [balanceLoading, setBalanceLoading] = React.useState(false);

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      showSuccess(`Connected to ${walletName} successfully`);
    } catch (error) {
      showError(`Failed to connect to ${walletName}`);
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      showSuccess('Wallet disconnected successfully');
      onClose();
    } catch (error) {
      showError('Failed to disconnect wallet');
      console.error('Wallet disconnection error:', error);
    }
  };

  const handleCopyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address);
        setCopiedAddress(true);
        showSuccess('Address copied to clipboard');
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        showError('Failed to copy address');
      }
    }
  };

  const handleRefreshBalance = async () => {
    if (!account?.address) return;
    
    try {
      setBalanceLoading(true);
      // TODO: Implement APT balance fetching using Aptos SDK
      // This would use the Aptos client to fetch account balance
      setBalanceLoading(false);
      showSuccess('Balance refreshed');
    } catch (error) {
      setBalanceLoading(false);
      showError('Failed to refresh balance');
      console.error('Balance refresh error:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>{connected ? 'Wallet Connected' : 'Connect Wallet'}</span>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Connected State */}
          {connected && wallet && account ? (
            <div className="space-y-4">
              {/* Wallet Info */}
              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={wallet.icon}
                      name={wallet.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-sm text-foreground-600">Connected</p>
                    </div>
                    <Chip color="success" size="sm" variant="flat">
                      Active
                    </Chip>
                  </div>

                  <Divider />

                  {/* Account Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-foreground-600">Address</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm bg-foreground/10 px-2 py-1 rounded">
                          {formatAddress(account.address)}
                        </code>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={handleCopyAddress}
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          as={Link}
                          href={`https://explorer.aptoslabs.com/account/${account.address}`}
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Balance */}
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground-600">APT Balance</p>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onClick={handleRefreshBalance}
                          isLoading={balanceLoading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {balanceLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <p className="text-lg font-semibold">{aptBalance.toFixed(4)} APT</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="flat"
                  startContent={<ExternalLink className="h-4 w-4" />}
                  as={Link}
                  href={`https://explorer.aptoslabs.com/account/${account.address}`}
                  target="_blank"
                  size="sm"
                >
                  View on Explorer
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  startContent={<Disconnect className="h-4 w-4" />}
                  onClick={handleDisconnect}
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            /* Wallet Selection */
            <div className="space-y-4">
              <p className="text-sm text-foreground-600">
                Choose a wallet to connect to the CoTrain network and start earning rewards.
              </p>

              <div className="grid gap-3">
                {wallets.map((wallet) => (
                  <Card 
                    key={wallet.name}
                    isPressable
                    className={`${!wallet.readyState ? 'opacity-60' : 'hover:shadow-md'} transition-all`}
                    onPress={() => wallet.readyState && handleConnect(wallet.name)}
                  >
                    <CardBody className="flex flex-row items-center space-x-3 py-4">
                      <Avatar
                        src={wallet.icon}
                        name={wallet.name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-xs text-foreground-600">{wallet.description || 'Aptos Wallet'}</p>
                      </div>
                      
                      {wallet.readyState !== 'Installed' ? (
                        <div className="flex items-center space-x-2">
                          <Chip size="sm" color="warning" variant="flat">
                            {wallet.readyState === 'NotDetected' ? 'Not Installed' : 'Loading'}
                          </Chip>
                          <Button
                            size="sm"
                            variant="light"
                            as={Link}
                            href={wallet.url}
                            target="_blank"
                            isIconOnly
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : connecting ? (
                        <Spinner size="sm" />
                      ) : (
                        <Chip size="sm" color="success" variant="flat">
                          Available
                        </Chip>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Help Text */}
              <Card className="bg-primary/10 border-primary/20">
                <CardBody className="py-3">
                  <p className="text-sm text-primary">
                    💡 Don't have a wallet? We recommend Petra for the best experience with Aptos.
                  </p>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            {connected ? 'Close' : 'Cancel'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}