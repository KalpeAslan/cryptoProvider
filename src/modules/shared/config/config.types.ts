import { RedisConfig } from '../types/redis.types';
import { NetworksConfig } from '../types/network.types';

export interface ServerConfig {
  host: string;
  port: number;
}

export interface AppConfig {
  server: ServerConfig;
  redis: RedisConfig;
  networks: NetworksConfig;
  queue: {
    name: string;
  };
  encryption: {
    publicKey: string;
    privateKey: string;
  };
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
  };
}

export interface MicroserviceConfig {
  name: string;
  transport: string;
  options: {
    host: string;
    port: number;
  };
}
