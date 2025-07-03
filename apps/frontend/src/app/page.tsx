"use client";

import { useAutoConnect } from "@/components/AutoConnectProvider";
import { DisplayValue, LabelValueGrid } from "@/components/LabelValueGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
import { MultiAgent } from "@/components/transactionFlows/MultiAgent";
import { SingleSigner } from "@/components/transactionFlows/SingleSigner";
import { Sponsor } from "@/components/transactionFlows/Sponsor";
import { TransactionParameters } from "@/components/transactionFlows/TransactionParameters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
import { AlertCircle, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

const isTelegramMiniApp =
  typeof window !== "undefined" &&
  (window as any).TelegramWebviewProxy !== undefined;
if (isTelegramMiniApp) {
  initTelegram();
}



// CoTrain App imports
import type React from "react"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/cotrain/navigation"
import { Footer } from "@/components/cotrain/footer"
import { LandingPage } from "@/components/cotrain/landing-page"
import { AboutPage } from "@/components/cotrain/pages/about-page"
import { DocsPage } from "@/components/cotrain/pages/docs-page"
import { TerminalPage } from "@/components/cotrain/pages/terminal-page"
import { TrainingPage } from "@/components/cotrain/pages/training-page"
import { HistoryPage } from "@/components/cotrain/pages/history-page"
import { Web3Dashboard } from "@/components/dashboard/web3-dashboard"
import { ErrorBoundary } from "@/components/cotrain/ui/error-boundary"
import { NotificationContainer } from "@/components/cotrain/ui/notification"
import { useAppStore, initializeStores } from "@/store"
import { getCurrentTimestamp } from "@/utils/cotrain"

// Types are now imported from the centralized types file

export default function Home() {
  const [currentPage, setCurrentPage] = useState<string>("home")
  
  // Use centralized state management
  const { user, training, network, ui } = useAppStore()
  
  // Local state for UI interactions
  const [isConnecting, setIsConnecting] = useState(true)
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(getCurrentTimestamp())
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState("")

  const [commandOutput, setCommandOutput] = useState<
    Array<{ timestamp: string; command: string; output: string; type: "success" | "error" | "info" }>
  >([
    {
      timestamp: getCurrentTimestamp(),
      command: "system",
      output: "CoTrain Distributed AI Training System v2.1.0",
      type: "info",
    },
    { timestamp: getCurrentTimestamp(), command: "system", output: "Type 'help' for available commands", type: "info" },
  ])

  // Initialize stores on component mount
  useEffect(() => {
    initializeStores()
  }, [])

  // Initialize system logs
  useEffect(() => {
    network.addSystemLog({
      message: "COTRAIN DISTRIBUTED AI TRAINING SYSTEM",
      type: "INFO",
      category: "SYSTEM"
    })
    network.addSystemLog({
      message: "INITIALIZING NETWORK CONNECTION...",
      type: "INFO",
      category: "NETWORK"
    })
  }, [])

  // Simulate connection process
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false)
      network.addSystemLog({
        message: "CONNECTION ESTABLISHED",
        type: "SUCCESS",
        category: "NETWORK"
      })
      network.addSystemLog({
        message: "READY FOR TRAINING",
        type: "INFO",
        category: "SYSTEM"
      })
      ui.addNotification({
        type: "success",
        title: "Connected",
        message: "Successfully connected to CoTrain network",
        duration: 5000
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [network, ui])

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimestamp())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <LandingPage
            onNavigate={setCurrentPage}
            isConnecting={isConnecting}
            contributors={network.contributors}
            logs={network.logs}
            currentTime={currentTime}
          />
        )
      case "training":
        return (
          <TrainingPage
            trainingOptions={training.options}
            onNavigate={setCurrentPage}
            onTrainingSelect={(option) => {
              setIsTraining(true)
              setProgress(0)
              ui.addNotification({
                type: "info",
                title: "Training Started",
                message: `Started training ${option.title}`,
                duration: 5000
              })
            }}
          />
        )
      case "history":
        return <HistoryPage userTrainingHistory={training.history} onNavigate={setCurrentPage} />
      case "terminal":
        return (
          <TerminalPage
            commandOutput={commandOutput}
            setCommandOutput={setCommandOutput}
            currentCommand={currentCommand}
            setCurrentCommand={setCurrentCommand}
            commandHistory={commandHistory}
            setCommandHistory={setCommandHistory}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
            addNotification={(notification) => ui.addNotification({ ...notification, duration: 5000 })}
          />
        )
      case "docs":
        return <DocsPage />
      case "about":
        return <AboutPage />
      case "dashboard":
        return <Web3Dashboard />
      default:
        return (
          <LandingPage
            onNavigate={setCurrentPage}
            isConnecting={isConnecting}
            contributors={network.contributors}
            logs={network.logs}
            currentTime={currentTime}
          />
        )
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1">{renderPage()}</main>
        <Footer />
        <NotificationContainer notifications={ui.notifications} onClose={(id) => {}} />
      </div>
    </ErrorBoundary>
  )
}
