// wagmi.ts
import { Chain } from 'wagmi/chains';
import { mainnet, sepolia, bscTestnet } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isClient, hasWeb3Wallet, getEthereumProvider } from '@/src/lib/clientUtils';

// 定义自定义链 Anvil
const anvil: Chain = {
  id: 31337,
  name: 'Anvil',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ANVIL_RPC_URL || 'http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Anvil Explorer', url: process.env.NEXT_PUBLIC_ANVIL_RPC_URL || 'http://127.0.0.1:8545' },
  },
  testnet: true,
};

// 定义自定义链 Thinkium Test
const thinkium801: Chain = {
  id: 801,
  name: 'thinkium801',
  nativeCurrency: { name: 'TestTKM', symbol: 'TKM', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_THINKIUM_RPC_URL || 'https://rpc-testnet.ruleos.com'] },
  },
  testnet: true,
};

// 定义自定义链 Thinkium Test
const thinkium70001: Chain = {
  id: 70001,
  name: 'thinkium70001',
  nativeCurrency: { name: 'TKM', symbol: 'TKM', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_THINKIUM_RPC_URL || 'https://proxy1.thinkiumrpc.net'] },
  },
  testnet: false,
};

// 映射链名称到链配置
const CHAIN_MAP: Record<string, Chain> = {
  mainnet: mainnet,
  sepolia: sepolia,
  bscTestnet: bscTestnet,
  anvil: anvil,
  thinkium801: thinkium801,
  thinkium70001: thinkium70001,
};

// 从环境变量中获取所选的链名称
const selectedChainName = process.env.NEXT_PUBLIC_CHAIN || 'mainnet';

// 获取对应的链配置，如果未找到则默认使用 mainnet
const selectedChain = CHAIN_MAP[selectedChainName] || mainnet;

// 创建 wagmi 配置
export const config = createConfig({
  chains: [selectedChain],
  connectors: [
    injected({
      target() {
        // 使用安全的客户端检测工具
        if (!isClient() || !hasWeb3Wallet()) {
          return {
            id: 'fallback',
            name: 'Wallet',
            provider: null,
          };
        }

        const provider = getEthereumProvider();
        if (provider) {
          return {
            id: 'injected',
            name: 'Injected Wallet',
            provider: provider,
          };
        }

        // 如果没有找到钱包，返回一个安全的默认值
        return {
          id: 'fallback',
          name: 'Wallet',
          provider: null,
        };
      },
      shimDisconnect: true, // 确保断开连接时清理状态
    }),
  ],
  transports:
    selectedChain.id === sepolia.id
      ? {
          [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.api.onfinality.io/public'),
        }
      : {
          [selectedChain.id]: http(selectedChain.rpcUrls.default.http[0]),
        },
  ssr: false, // 静态导出模式下禁用 SSR
});
