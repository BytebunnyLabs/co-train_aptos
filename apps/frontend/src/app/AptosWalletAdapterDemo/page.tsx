"use client";

import { useAutoConnect } from "@/components/AutoConnectProvider";
import { DisplayValue, LabelValueGrid } from "@/components/LabelValueGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import { MultiAgent } from "@/components/transactionFlows/MultiAgent";
import { SingleSigner } from "@/components/transactionFlows/SingleSigner";
import { Sponsor } from "@/components/transactionFlows/Sponsor";
import { TransactionParameters } from "@/components/transactionFlows/TransactionParameters";
import { Alert, AlertDescription, AlertTitle } from "@/components/cotrain/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cotrain/ui/card";
import { Label } from "@/components/cotrain/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/cotrain/ui/radio-group";
import { Switch } from "@/components/cotrain/ui/switch";
import { isMainnet } from "@/utils";
import { Network } from "@aptos-labs/ts-sdk";
import { WalletSelector as AntdWalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { WalletConnector as MuiWalletSelector } from "@aptos-labs/wallet-adapter-mui-design";
import {
  AccountInfo,
  AdapterWallet,
  AptosChangeNetworkOutput,
  NetworkInfo,
  WalletInfo,
  isAptosNetwork,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { init as initTelegram } from "@telegram-apps/sdk";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

// Imports for registering a browser extension wallet plugin on page load
import { MyWallet } from "@/utils/standardWallet";
import { registerWallet } from "@aptos-labs/wallet-standard";

// Example of how to register a browser extension wallet plugin.
// Browser extension wallets should call registerWallet once on page load.
// When you click "Connect Wallet", you should see "Example Wallet"
(function () {
  if (typeof window === "undefined") return;
  const myWallet = new MyWallet();
  registerWallet(myWallet);
})();

type WalletSelectorType = "shadcn" | "antd" | "mui";
type TransactionType = "single" | "sponsor" | "multi-agent";

export default function AptosWalletAdapterDemo() {
  const {
    connect,
    account,
    network,
    connected,
    disconnect,
    wallet,
    wallets,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
    changeNetwork,
  } = useWallet();
  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [walletSelectorType, setWalletSelectorType] =
    useState<WalletSelectorType>("shadcn");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("single");

  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        initTelegram();
        setIsTelegramMiniApp(true);
      } catch {
        // Not a Telegram Mini App
        setIsTelegramMiniApp(false);
      }
    }
  }, []);

  const renderWalletSelector = () => {
    switch (walletSelectorType) {
      case "antd":
        return <AntdWalletSelector />;
      case "mui":
        return <MuiWalletSelector />;
      default:
        return <ShadcnWalletSelector />;
    }
  };

  const renderTransactionFlow = () => {
    switch (transactionType) {
      case "sponsor":
        return <Sponsor />;
      case "multi-agent":
        return <MultiAgent />;
      default:
        return <SingleSigner />;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 max-w-screen-xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold">Aptos Wallet Adapter Demo</h1>
      </div>

      {/* Telegram Mini App Alert */}
      {isTelegramMiniApp && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Telegram Mini App Detected</AlertTitle>
          <AlertDescription>
            You are running this app inside Telegram. Some wallet features may
            be limited.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Wallet Selector Type */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Selector Type</CardTitle>
              <CardDescription>
                Choose the UI library for the wallet selector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={walletSelectorType}
                onValueChange={(value) =>
                  setWalletSelectorType(value as WalletSelectorType)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shadcn" id="shadcn" />
                  <Label htmlFor="shadcn">shadcn/ui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="antd" id="antd" />
                  <Label htmlFor="antd">Ant Design</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mui" id="mui" />
                  <Label htmlFor="mui">Material UI</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Transaction Type */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Type</CardTitle>
              <CardDescription>
                Choose the type of transaction to demonstrate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={transactionType}
                onValueChange={(value) =>
                  setTransactionType(value as TransactionType)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Single Signer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sponsor" id="sponsor" />
                  <Label htmlFor="sponsor">Sponsor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multi-agent" id="multi-agent" />
                  <Label htmlFor="multi-agent">Multi Agent</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {renderTransactionFlow()}
      </div>
    </div>
  );
}
