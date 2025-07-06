"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { useAutoConnect } from "./AutoConnectProvider";
import { toast } from "react-hot-toast";

// AIP-62 标准钱包插件导入
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
import { FewchaWallet } from "fewcha-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
// import { AptosConnectWallet } from "@aptos-connect/wallet-adapter-plugin"; // 抽象类，无法直接实例化
// import { NightlyWallet } from "@nightlylabs/wallet-selector-aptos"; // 与当前 Aptos SDK 版本不兼容

// 支持的 AIP-62 钱包列表
const supportedWallets = [
  new PetraWallet(),
  new MartianWallet(), 
  new MSafeWalletAdapter(),
  new OKXWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new FewchaWallet(),
  // AptosConnect 和 Nightly 暂时禁用，因为兼容性问题
];

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { autoConnect } = useAutoConnect();

  return (
    <AptosWalletAdapterProvider
      autoConnect={autoConnect}
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={(error) => {
        console.error("Wallet error:", error);
        toast.error(error || "Unknown wallet error");
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};