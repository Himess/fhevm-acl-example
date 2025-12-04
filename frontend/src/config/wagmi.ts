import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

// Zama Devnet (FHEVM Testnet)
export const zamaDevnet = defineChain({
  id: 9000,
  name: 'Zama Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZAMA',
    symbol: 'ZAMA',
  },
  rpcUrls: {
    default: {
      http: ['https://devnet.zama.ai'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://main.explorer.zama.ai' },
  },
  testnet: true,
});

// Sepolia for testing
export const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'SepoliaETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Confidential Salary Demo',
  projectId: 'demo-project-id', // Get from WalletConnect Cloud
  chains: [zamaDevnet, sepolia],
  transports: {
    [zamaDevnet.id]: http(),
    [sepolia.id]: http(),
  },
});
