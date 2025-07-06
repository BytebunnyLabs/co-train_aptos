"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button, Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab } from "@heroui/react"
import { Loader2 } from "lucide-react"
import { CheckCircle, ExternalLink, Cpu, Hash, Link } from "lucide-react"

interface TerminalPageProps {
  onNavigate?: (page: string) => void
  isConnecting?: boolean
  setIsConnecting?: (connecting: boolean) => void
  isTraining?: boolean
  setIsTraining?: (training: boolean) => void
  progress?: number
  setProgress?: (progress: number) => void
  contributors?: any[]
  setContributors?: (contributors: any[]) => void
  logs?: any[]
  setLogs?: (logs: any[]) => void
  currentTime?: string
  commandHistory?: string[]
  setCommandHistory?: (history: string[]) => void
  historyIndex?: number
  setHistoryIndex?: (index: number) => void
  currentCommand?: string
  setCurrentCommand?: (command: string) => void
  addNotification?: (notification: any) => void
  commandOutput?: any[]
  setCommandOutput?: (output: any[]) => void
  showContributeModal?: boolean
  setShowContributeModal?: (show: boolean) => void
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  availableCommands?: any
  getStatusColor?: (status: string) => string
  executeCommand?: (cmd: string) => void
  handleCommandSubmit?: (e: React.FormEvent) => void
  handleKeyDown?: (e: React.KeyboardEvent) => void
}

export function TerminalPage({
  onNavigate = () => {},
  isConnecting = false,
  setIsConnecting = () => {},
  isTraining = false,
  setIsTraining = () => {},
  progress = 0,
  setProgress = () => {},
  contributors = [],
  setContributors = () => {},
  logs = [],
  setLogs = () => {},
  currentTime = new Date().toLocaleTimeString(),
  commandHistory = [],
  setCommandHistory = () => {},
  historyIndex = -1,
  setHistoryIndex = () => {},
  currentCommand = '',
  setCurrentCommand = () => {},
  commandOutput = [],
  setCommandOutput = () => {},
  showContributeModal = false,
  setShowContributeModal = () => {},
  selectedTab = 'terminal',
  setSelectedTab = () => {},
  availableCommands = {},
  getStatusColor = (status: string) => status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-blue-400',
  executeCommand = () => {},
  handleCommandSubmit = () => {},
  handleKeyDown = () => {},
  addNotification = () => {},
}: TerminalPageProps) {
  const [steps, setSteps] = useState({ current: 0, total: 1000 })

  useEffect(() => {
    if (isTraining) {
      const trainingInterval = setInterval(() => {
        setSteps((prev) => ({
          ...prev,
          current: Math.min(prev.current + Math.floor(Math.random() * 3) + 1, prev.total),
        }))
      }, 1000)

      return () => clearInterval(trainingInterval)
    }
  }, [isTraining])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono text-sm p-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span>C - {progress.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="bordered"
            size="sm"
            onPress={() => onNavigate("history")}
            className="bg-transparent border-purple-400 text-purple-400 font-mono text-xs"
          >
            HISTORY
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => onNavigate("training")}
            className="bg-transparent border-green-400 text-green-400 font-mono text-xs"
          >
            TRAINING OPTIONS
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => setShowContributeModal?.(true)}
            isDisabled={isConnecting}
            className="bg-transparent border-green-400 text-green-400 font-mono text-xs"
          >
            {isTraining ? "STOP TRAINING" : "CONTRIBUTE COMPUTE"}
          </Button>
          <button className="text-green-400 text-xs hover:text-green-300">⛶ FULL SCREEN</button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span>
            {steps.current}/{steps.total} STEPS
          </span>
          <span>CONTRIBUTORS {contributors.filter((c) => c.status !== "OFFLINE").length}</span>
        </div>
        <div className="mb-2">
          <span className="text-xs">PROGRESS</span>
        </div>
        <div className="w-full bg-gray-800 h-1 mb-4">
          <div className="bg-green-400 h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Command Terminal */}
        <div className="mb-8">
          <div className="text-xs text-gray-500 mb-4">COMMAND TERMINAL</div>
          <div className="border border-gray-800 bg-black h-96 p-4 overflow-y-auto">
            {/* Command Output */}
            <div className="space-y-1 mb-4">
              {commandOutput.map((entry, index) => (
                <div key={index} className="text-xs">
                  <div className="text-gray-500">
                    [{entry.timestamp}] cotrain@system:~$ {entry.command}
                  </div>
                  <div
                    className={`whitespace-pre-line ml-4 ${
                      entry.type === "success"
                        ? "text-green-400"
                        : entry.type === "error"
                          ? "text-red-400"
                          : "text-green-400"
                    }`}
                  >
                    {entry.output}
                  </div>
                </div>
              ))}
            </div>

            {/* Command Input */}
            <form onSubmit={handleCommandSubmit} className="flex items-center text-xs">
              <span className="text-gray-500 mr-2">cotrain@system:~$</span>
              <input
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-green-400 outline-none font-mono"
                placeholder="Type command here..."
                autoFocus
              />
            </form>
          </div>
        </div>

        {/* Right Panel - Network Status */}
        <div className="space-y-8">
          {/* Network Visualization */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-4">NETWORK TOPOLOGY</div>
            <div className="h-48 border border-gray-800 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-8">
                  {contributors.slice(0, 6).map((contributor, index) => (
                    <div key={contributor.id} className="relative">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          contributor.status === "TRAINING"
                            ? "bg-green-400 animate-pulse"
                            : contributor.status === "ONLINE"
                              ? "bg-blue-400"
                              : contributor.status === "CONNECTING"
                                ? "bg-yellow-400 animate-pulse"
                                : "bg-gray-600"
                        }`}
                      />
                      {contributor.status === "TRAINING" && (
                        <div className="absolute -inset-2 border border-green-400 rounded-full animate-ping opacity-30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-4">SYSTEM METRICS</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Training Status:</span>
                <span className={isTraining ? "text-green-400" : "text-gray-400"}>
                  {isTraining ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network Nodes:</span>
                <span className="text-green-400">{contributors.filter((c) => c.status !== "OFFLINE").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Steps:</span>
                <span className="text-green-400">{steps.current.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Progress:</span>
                <span className="text-green-400">{progress.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors Table */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-500 mb-2 border-b border-gray-800 pb-2">
          <span>#</span>
          <span>CONTRIBUTOR</span>
          <span>CONTRIBUTIONS</span>
          <span>STATUS</span>
        </div>
        <div className="space-y-1">
          {contributors.map((contributor) => (
            <div key={contributor.id} className="grid grid-cols-4 gap-4 text-xs py-1 hover:bg-gray-900">
              <span className="text-gray-500">{contributor.id}</span>
              <span className="text-green-400">{contributor.name}</span>
              <span className="text-green-400">{contributor.contributions.toLocaleString()}</span>
              <span className={getStatusColor(contributor.status)}>
                {contributor.status}
                {contributor.status === "CONNECTING" && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-800 pt-4">
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>ATTEMPTING TO CONNECT</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>NETWORK CONNECTED</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>
            POS: {steps.current}, {contributors.length}
          </span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Contribute Modal */}
      <Modal isOpen={showContributeModal} onOpenChange={setShowContributeModal} size="4xl" className="bg-black border-gray-800 text-white">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-2xl font-bold text-white">Contribute Compute to COTRAIN-1</h2>
          </ModalHeader>
          <ModalBody>
            <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as string)} className="w-full">
              <Tab key="fully-managed" title="Fully Managed">
                <div className="space-y-6 mt-6">
              <p className="text-gray-300">
                Rent and contribute compute, and have it fully managed by CoTrain. This option is for less technical
                users, or users without their own GPU hardware.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Select GPUs and Image</h3>
                    <p className="text-gray-400 mb-4">
                      Select the GPUs you want to contribute. The compute pool image will be automatically selected.
                    </p>
                    <Button
                      variant="bordered"
                      className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                      onPress={() => {}}
                    >
                      View Documentation <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Rent & Deploy GPUs</h3>
                    <p className="text-gray-400">
                      Deploying GPUs will provision the compute and automatically connect you to the compute pool. Note
                      that you will be billed for the compute you rent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Track Progress & Contributions</h3>
                    <p className="text-gray-400">
                      Monitor your contributions on the dashboard. Your name and profile picture will be visible on the
                      leaderboard and map. You can edit your profile in settings.
                    </p>
                  </div>
                </div>
              </div>
                </div>
              </Tab>
              <Tab key="self-hosted" title="Self-Hosted">
                <div className="space-y-6 mt-6">
              <p className="text-gray-300">
                Permissionlessly contribute your own GPUs to the compute pool. This option is for more technical users
                with their own GPU hardware.
              </p>

              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Supported Hardware</h3>
                <p className="text-gray-400 mb-4">
                  The compute pool only supports the following hardware specifications.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">GPU Type:</span>
                    <span className="text-gray-300">H200 (141GB)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">GPU Count:</span>
                    <span className="text-gray-300">8 GPUs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">Socket Type:</span>
                    <span className="text-gray-300">Any</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-300 mb-4">Here's a quick overview of the steps you'll need to follow:</p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Download Worker CLI</h3>
                      <p className="text-gray-400">Download the worker CLI and run it on your own GPU hardware.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Create Wallet & Fund with Testnet ETH</h3>
                      <p className="text-gray-400">
                        Create a wallet with a private key and address that will be your worker's identity in the
                        compute pool. Fund the wallet with testnet ETH to deploy the worker.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Run Worker</h3>
                      <p className="text-gray-400">
                        Once you've set up the worker, run it and start contributing compute to the pool.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Track Progress & Contributions</h3>
                      <p className="text-gray-400">
                        Monitor your contributions on the dashboard. Your name and profile picture will be visible on
                        the leaderboard and map. You can edit your profile in settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                </div>
              </Tab>
            </Tabs>

            {/* Completion Notice */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <h4 className="text-green-400 font-semibold">Compute pool has completed</h4>
                <p className="text-green-300 text-sm">
                  The compute pool has completed, and is no longer accepting contributions.
                </p>
              </div>
            </div>

            {/* Notification Button */}
            <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600" variant="bordered" onPress={() => {}}>
              Get notified of future compute pools
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
}
