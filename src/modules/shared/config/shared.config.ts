import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NetworkType } from '../types/network.types';
import { AppConfig } from './config.types';

@Injectable()
export class SharedConfig implements AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get encryption() {
    return {
      publicKey: this.getEnvOrThrow('ENCRYPTION_PUBLIC_KEY'),
      privateKey: this.getEnvOrThrow('ENCRYPTION_PRIVATE_KEY'),
    };
  }

  get server() {
    return {
      host: this.getEnvOrDefault('SERVER_HOST', 'localhost'),
      port: this.getEnvAsIntOrDefault('SERVER_PORT', 3030),
    };
  }

  get redis() {
    return {
      url: this.getEnvOrThrow('REDIS_URL'),
    };
  }

  get networks() {
    return {
      [NetworkType.POLYGON]: {
        rpc: this.getEnvOrThrow('POLYGON_RPC'),
        chainId: 137,
      },
      [NetworkType.MUMBAI]: {
        rpc: this.getEnvOrThrow('MUMBAI_RPC'),
        chainId: 80001,
      },
      [NetworkType.BINANCE]: {
        rpc: this.getEnvOrThrow('BINANCE_RPC'),
        chainId: 56,
      },
      [NetworkType.BINANCE_TESTNET]: {
        rpc: this.getEnvOrThrow('BINANCE_TESTNET_RPC'),
        chainId: 97,
      },
      [NetworkType.ETHEREUM]: {
        rpc: this.getEnvOrThrow('ETH_RPC'),
        chainId: 1,
      },
      // [NetworkType.ETH_TESTNET]: {
      //   rpc: this.getEnvOrThrow('ETH_TESTNET_RPC'),
      //   chainId: 11155111,
      // },
      [NetworkType.HARDHAT]: {
        rpc: this.getEnvOrThrow('HARDHAT_RPC'),
        chainId: 31337,
      },
      [NetworkType.TRON]: {
        rpc: this.getEnvOrThrow('TRON_RPC'),
        chainId: 728126428,
      },
      [NetworkType.NILE]: {
        rpc: this.getEnvOrThrow('NILE_RPC'),
        chainId: 1001,
      },
      [NetworkType.SOLANA]: {
        rpc: this.getEnvOrThrow('SOLANA_RPC'),
        chainId: 101, // Solana mainnet
      },
      [NetworkType.SOLANA_DEVNET]: {
        rpc: this.getEnvOrThrow('SOLANA_DEVNET_RPC'),
        chainId: 103, // Solana devnet
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

  private getEnvOrThrow(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }

  private getEnvAsIntOrDefault(key: string, defaultValue: number): number {
    const value = this.configService.get<string>(key);
    return value ? parseInt(value, 10) : defaultValue;
  }
}
