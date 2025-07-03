import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "@/components/cotrain/ui/toaster";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { PropsWithChildren } from "react";
import { AutoConnectProvider } from "@/components/AutoConnectProvider";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import { ConditionalNavigation } from "@/components/ConditionalNavigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CoTrain - Distributed AI Training System",
  description:
    "CoTrain is a blockchain-based distributed AI training platform with Aptos wallet integration.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex justify-center min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AutoConnectProvider>
            <ReactQueryClientProvider>
              <WalletProvider>
                <AuthProvider>
                  <AppProvider>
                    <div className="min-h-screen flex flex-col">
                      <ConditionalNavigation />
                      <main className="flex-1">
                        {children}
                      </main>
                    </div>
                    <Toaster />
                  </AppProvider>
                </AuthProvider>
              </WalletProvider>
            </ReactQueryClientProvider>
          </AutoConnectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
