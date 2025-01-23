export interface RedisConfig {
  url: string;
  connectTimeout?: number;
}

export interface RedisRetryStrategy {
  (times: number): number;
}

export interface RedisModuleConfig {
  config: RedisConfig;
}

export interface RedisEntry<T> {
  key: string;
  value: T;
}

export interface RedisHashField<T> {
  field: string;
  value: T;
}

export interface RedisHashOperations<T> {
  hashKey: string;
  fields: Record<string, T>;
  ttl?: number;
}
