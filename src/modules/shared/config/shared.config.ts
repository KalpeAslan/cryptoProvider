import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NetworkType } from '../types/network.types';
import { AppConfig } from './config.types';
import { ENV } from '../constants/env.constants';

@Injectable()
export class SharedConfig implements AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get encryption() {
    return {
      key: this.getEnvOrDefault(ENV.ENCRYPTION.KEY),
    };
  }

  get server() {
    return {
      host: this.getEnvOrDefault(ENV.SERVER.HOST, 'localhost'),
      port: this.getEnvAsIntOrDefault(ENV.SERVER.PORT, 3030),
    };
  }

  get redis() {
    return {
      url: this.getEnvOrDefault(ENV.REDIS.URL, 'redis://localhost:6379'),
    };
  }

  get networks() {
    return {
      [NetworkType.POLYGON]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.POLYGON.RPC,
          'https://polygon-rpc.com',
        ),
        chainId: 137,
      },
      [NetworkType.MUMBAI]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.MUMBAI.RPC,
          'https://rpc-mumbai.maticvigil.com',
        ),
        chainId: 80001,
      },
      [NetworkType.BINANCE]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.BINANCE.RPC,
          'https://bsc-dataseed.binance.org',
        ),
        chainId: 56,
      },
      [NetworkType.BINANCE_TESTNET]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.BINANCE_TESTNET.RPC,
          'https://data-seed-prebsc-1-s1.binance.org:8545',
        ),
        chainId: 97,
      },
      [NetworkType.ETHEREUM]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.ETHEREUM.RPC,
          'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
        ),
        chainId: 1,
      },
      [NetworkType.ETH_TESTNET]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.ETH_TESTNET.RPC,
          'https://sepolia.gateway.tenderly.co',
        ),
        chainId: 11155111,
      },
      [NetworkType.HARDHAT]: {
        rpc: this.getEnvOrDefault(
          ENV.NETWORKS.HARDHAT.RPC,
          'http://127.0.0.1:8545',
        ),
        chainId: 31337,
      },
    };
  }

  get queue() {
    return {
      name: 'transactions',
    };
  }

  private getEnvOrDefault(key: string, defaultValue?: string): string {
    return this.configService.get<string>(key) ?? defaultValue ?? '';
  }

  private getEnvAsIntOrDefault(key: string, defaultValue: number): number {
    const value = this.configService.get<string>(key);
    return value ? parseInt(value, 10) : defaultValue;
  }
}
