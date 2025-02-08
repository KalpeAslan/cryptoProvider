export enum NetworkType {
  POLYGON = 'polygon',
  MUMBAI = 'mumbai',
  BINANCE = 'binance',
  BINANCE_TESTNET = 'binanceTestnet',
  ETHEREUM = 'ethereum',
  ETH_TESTNET = 'sepolia',
  HARDHAT = 'hardhat',
}

export interface NetworkConfig {
  rpc: string;
  chainId: number;
}

export type NetworksConfig = {
  [key in NetworkType]: NetworkConfig;
};
