export const ENV = {
  SERVER: {
    HOST: 'SERVER_HOST',
    PORT: 'SERVER_PORT',
  },
  REDIS: {
    URL: 'REDIS_URI',
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
