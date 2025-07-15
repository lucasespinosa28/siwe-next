"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
  type GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { config } from "./wagmiConfig"; // Import the config

const queryClient = new QueryClient();

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
    // Use the imported config here
    <WagmiProvider config={config}>
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