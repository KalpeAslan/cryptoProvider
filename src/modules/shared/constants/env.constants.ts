export const ENV = {
  SERVER: {
    HOST: 'SERVER_HOST',
    PORT: 'SERVER_PORT',
  },
  REDIS: {
    URL: 'REDIS_URI',
  },
  ENCRYPTION: {
    KEY: 'ENCRYPTION_KEY',
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
    HARDHAT: {
      RPC: 'HARDHAT_RPC',
    },
  },
} as const;
