import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { publicActions } from "viem";
import { mainnet, polygon, optimism, arbitrum, base } from "viem/chains";

export const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    // It's crucial to use an environment variable for the Project ID
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true,
});

export const publicClient = config.getClient().extend(publicActions)