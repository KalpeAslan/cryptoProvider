import { Injectable } from '@nestjs/common';
import * as zlib from 'zlib';
import { RedisService as NestRedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { TransactionStatus } from '../types/transaction.types';
import { Transaction } from '../types/transaction.types';

const TRANSACTION_KEY = 'transactions';

@Injectable()
export class RedisRepository {
  private readonly redis: Redis;

  constructor(private readonly redisService: NestRedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    compress = false,
  ): Promise<void> {
    let data = JSON.stringify(value);
    if (compress) {
      data = 'COMPRESSED_' + zlib.gzipSync(data).toString('base64');
    }
    await this.redis.set(key, data);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  async get<T>(key: string, decompress = false): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    const parsedData = decompress
      ? zlib.gunzipSync(Buffer.from(data, 'base64')).toString()
      : data;
    return parsedData ? (JSON.parse(parsedData) as T) : null;
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [newCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
      );
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    return keys;
  }

  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async multiSet(
    entries: Record<string, any>,
    compress = false,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const [key, value] of Object.entries(entries)) {
      const data = compress
        ? zlib.gzipSync(JSON.stringify(value)).toString('base64')
        : JSON.stringify(value);
      pipeline.set(key, data);
    }
    await pipeline.exec();
  }

  async multiGet<T>(keys: string[], decompress = false): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const results = await this.redis.mget(...keys);
    return results.map((result) => {
      if (!result) return null;

      if (decompress && result.startsWith('COMPRESSED_')) {
        const compressedData = result.replace('COMPRESSED_', '');
        const decompressed = zlib
          .gunzipSync(Buffer.from(compressedData, 'base64'))
          .toString();
        return JSON.parse(decompressed) as T;
      }

      return JSON.parse(result) as T;
    });
  }

  async hashSet<T>(
    hashKey: string,
    field: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    await this.redis.hset(hashKey, field, JSON.stringify(value));
    if (ttl) {
      await this.redis.expire(hashKey, ttl);
    }
  }

  async hashGet<T>(hashKey: string, field: string): Promise<T | null> {
    const data = await this.redis.hget(hashKey, field);
    return data ? (JSON.parse(data) as T) : null;
  }

  async hashDelete(hashKey: string, field: string): Promise<number> {
    return this.redis.hdel(hashKey, field);
  }

  async hashExists(hashKey: string, field: string): Promise<boolean> {
    return (await this.redis.hexists(hashKey, field)) === 1;
  }

  async getAllHashFields<T>(hashKey: string): Promise<Record<string, T>> {
    const data = await this.redis.hgetall(hashKey);
    return Object.fromEntries(
      Object.entries(data).map(([field, value]) => [
        field,
        JSON.parse(value) as T,
      ]),
    );
  }

  async setMultipleHashFields(
    hashKey: string,
    fields: Record<string, any>,
    ttl?: number,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const [field, value] of Object.entries(fields)) {
      pipeline.hset(hashKey, field, JSON.stringify(value));
    }
    await pipeline.exec();
    if (ttl) {
      await this.redis.expire(hashKey, ttl);
    }
  }

  async getHashKeys(hashKey: string): Promise<string[]> {
    return this.redis.hkeys(hashKey);
  }

  async hashGetSingleField<T = string[]>(
    hashKey: string,
    fieldKey: string,
  ): Promise<T | null> {
    const data = await this.redis.hget(hashKey, fieldKey);
    return data ? (JSON.parse(data) as T) : null;
  }

  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<Transaction[]> {
    const transactions = await this.redis.hgetall(TRANSACTION_KEY);
    return Object.values(transactions)
      .map((tx) => JSON.parse(tx) as Transaction)
      .filter((tx) => tx.status === status);
  }
}
