export const ENV = {
  REDIS: {
    HOST: 'REDIS_HOST',
    PORT: 'REDIS_PORT',
    PASSWORD: 'REDIS_PASSWORD',
  },
  NETWORKS: {
    POLYGON: {
      RPC: 'POLYGON_RPC',
    },
    MUMBAI: {
      RPC: 'MUMBAI_RPC',
    },
    BINANCE: {
      RPC: 'BSC_RPC',
    },
    BINANCE_TESTNET: {
      RPC: 'BSC_TESTNET_RPC',
    },
    ETHEREUM: {
      RPC: 'ETH_RPC',
    },
    ETH_TESTNET: {
      RPC: 'ETH_TESTNET_RPC',
    },
  },
} as const;
