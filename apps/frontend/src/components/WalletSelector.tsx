"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { 
  Copy, 
  LogOut, 
  Wallet,
  ExternalLink
} from "lucide-react";
import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody
} from "@heroui/react";
import { toast } from "react-hot-toast";

// Utility function to truncate address
function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function WalletSelector() {
  const { 
    account, 
    connected, 
    disconnect, 
    wallet,
    wallets,
    connect
  } = useWallet();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address.toString());
      toast.success("Address copied to clipboard");
    } catch {
      toast.error("Failed to copy address");
    }
  }, [account?.address]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  }, [disconnect]);

  const handleConnect = useCallback(async (walletName: string) => {
    try {
      await connect(walletName);
      onOpenChange(); // Close modal
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  }, [connect, onOpenChange]);

  // If wallet is connected, show connected state
  if (connected && account) {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button variant="bordered" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">
              {truncateAddress(account.address?.toString() || "")}
            </span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Wallet actions">
          <DropdownItem key="address" textValue="Wallet Address" isReadOnly>
            <div className="flex flex-col">
              <span className="text-xs text-foreground-600">Address</span>
              <span className="font-mono text-sm">
                {truncateAddress(account.address?.toString() || "", 8, 6)}
              </span>
            </div>
          </DropdownItem>
          <DropdownItem key="copy" onPress={copyAddress} startContent={<Copy className="h-4 w-4" />}>
            Copy Address
          </DropdownItem>
          {wallet?.url ? (
            <DropdownItem 
              key="wallet" 
              href={wallet.url}
              target="_blank"
              startContent={<ExternalLink className="h-4 w-4" />}
            >
              Open {wallet.name}
            </DropdownItem>
          ) : null}
          <DropdownItem 
            key="disconnect" 
            onPress={handleDisconnect} 
            startContent={<LogOut className="h-4 w-4" />}
            className="text-danger"
            color="danger"
          >
            Disconnect
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  // If no wallet connected, show connect button
  return (
    <>
      <Button 
        onPress={onOpen} 
        color="primary"
        variant="solid"
        startContent={<Wallet className="h-4 w-4" />}
      >
        Connect Wallet
      </Button>
      
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Connect Wallet</h3>
            <p className="text-sm text-foreground-600">
              Choose a wallet to connect to CoTrain
            </p>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-3">
              {wallets?.length ? (
                wallets.map((wallet) => (
                  <Card 
                    key={wallet.name} 
                    className="cursor-pointer hover:bg-foreground/5 transition-colors"
                    isPressable
                    onPress={() => handleConnect(wallet.name)}
                  >
                    <CardBody className="flex flex-row items-center gap-4 p-4">
                      {wallet.icon && (
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name}
                          className="w-8 h-8 rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{wallet.name}</h4>
                        {wallet.url && (
                          <p className="text-sm text-foreground-600">
                            {wallet.url}
                          </p>
                        )}
                      </div>
                      {!wallet.readyState && (
                        <Button
                          size="sm"
                          variant="flat"
                          as="a"
                          href={wallet.url}
                          target="_blank"
                        >
                          Install
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-foreground-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Wallets Available</h3>
                  <p className="text-foreground-600 mb-4">
                    Please install a compatible Aptos wallet to continue.
                  </p>
                  <div className="space-y-2">
                    <Button
                      as="a"
                      href="https://petra.app/"
                      target="_blank"
                      variant="bordered"
                      size="sm"
                      startContent={<ExternalLink className="h-4 w-4" />}
                    >
                      Install Petra Wallet
                    </Button>
                    <Button
                      as="a"
                      href="https://martianwallet.xyz/"
                      target="_blank"
                      variant="bordered"
                      size="sm"
                      startContent={<ExternalLink className="h-4 w-4" />}
                    >
                      Install Martian Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}