import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    const port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : 6379;
    const host = process.env.REDIS_HOST || '127.0.0.1';

    this.client = new Redis({
      host,
      port,
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSecond?: number) {
    if (ttlSecond) {
      return this.client.set(key, value, 'EX', ttlSecond);
    }

    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    return this.client.quit();
  }
}
