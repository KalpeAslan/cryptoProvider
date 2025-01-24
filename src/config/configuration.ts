import { AppConfig } from '../modules/shared/config/config.types';
import { NetworkType } from '../modules/shared/types/network.types';

export default (): AppConfig => ({
  server: {
    host: (process.env.SERVER_HOST as string) || 'localhost',
    port: parseInt((process.env.SERVER_PORT as string) || '3030', 10),
  },
  redis: {
    url: (process.env.REDIS_URL as string) || 'redis://localhost:6379',
  },
  networks: {
    [NetworkType.POLYGON]: {
      rpc:
        (process.env.POLYGON_RPC as string) || 'https://polygon.llamarpc.com',
      chainId: 137,
    },
    [NetworkType.MUMBAI]: {
      rpc:
        (process.env.MUMBAI_RPC as string) ||
        'https://rpc-mumbai.maticvigil.com',
      chainId: 80001,
    },
    [NetworkType.BINANCE]: {
      rpc: (process.env.BSC_RPC as string) || 'https://binance.llamarpc.com',
      chainId: 56,
    },
    [NetworkType.BINANCE_TESTNET]: {
      rpc:
        (process.env.BSC_TESTNET_RPC as string) ||
        'https://bsc-testnet.public.blastapi.io',
      chainId: 97,
    },
    [NetworkType.ETHEREUM]: {
      rpc: (process.env.ETH_RPC as string) || 'https://eth.llamarpc.com',
      chainId: 1,
    },
    [NetworkType.ETH_TESTNET]: {
      rpc:
        (process.env.ETH_TESTNET_RPC as string) ||
        'https://gateway.tenderly.co/public/sepolia',
      chainId: 11155111,
    },
  },
  queue: {
    name: 'transactions',
  },
});
