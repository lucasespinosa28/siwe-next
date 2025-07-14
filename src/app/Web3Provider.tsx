"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { WagmiProvider } from "wagmi";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
  type GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { publicActions } from "viem";
import { mainnet, polygon, optimism, arbitrum, base } from "viem/chains";

const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
});// Assuming your config is in a separate file

const queryClient = new QueryClient();

// Add the getSiweMessageOptions function that was in your old _app.tsx
const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: "Sign in to the RainbowKit + SIWE example app",
});

export function Web3Provider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <WagmiProvider config={config}>
      {/* Pass the session from RootLayout to the SessionProvider */}
      <SessionProvider refetchInterval={0} session={session}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider
            getSiweMessageOptions={getSiweMessageOptions}
          >
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}

export const publicClient = config.getClient().extend(publicActions);