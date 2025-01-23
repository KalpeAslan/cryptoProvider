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
      rpc: (process.env.POLYGON_RPC as string) || 'https://polygon-rpc.com',
      chainId: 137,
    },
    [NetworkType.MUMBAI]: {
      rpc:
        (process.env.MUMBAI_RPC as string) ||
        'https://rpc-mumbai.maticvigil.com',
      chainId: 80001,
    },
    [NetworkType.BINANCE]: {
      rpc:
        (process.env.BSC_RPC as string) || 'https://bsc-dataseed.binance.org',
      chainId: 56,
    },
    [NetworkType.BINANCE_TESTNET]: {
      rpc:
        (process.env.BSC_TESTNET_RPC as string) ||
        'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
    },
    [NetworkType.ETHEREUM]: {
      rpc:
        (process.env.ETH_RPC as string) ||
        'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      chainId: 1,
    },
    [NetworkType.ETH_TESTNET]: {
      rpc:
        (process.env.ETH_TESTNET_RPC as string) ||
        'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
      chainId: 11155111,
    },
  },
  queue: {
    name: 'transactions',
  },
});
