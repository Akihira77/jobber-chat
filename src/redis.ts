import { Redis } from "ioredis"
import { REDIS_HOST } from "./config"
import { Logger } from "winston"
import typia from "typia"

export class RedisClient {
    public client: Redis

    constructor(private readonly logger: (location?: string) => Logger) {
        this.client = new Redis(`${REDIS_HOST}`)
    }

    public getDataFromCache(key: string): Promise<string | null> {
        try {
            return this.client.get(key)
        } catch (error) {
            this.logger("redis.ts - getDataFromCache()").error(
                "ChatService Redis Cache getDataFromCache() method error:",
                error
            )
            return Promise.resolve(null)
        }
    }

    public setDataToCache(
        key: string,
        value: any,
        expiry: boolean = true,
        ttl: number
    ): Promise<string | null> {
        try {
            if (expiry) {
                return this.client.set(
                    key,
                    typia.json.stringify(value),
                    "EX",
                    ttl
                )
            }

            return this.client.set(key, typia.json.stringify(value), "NX")
        } catch (error) {
            this.logger("redis.ts - setDataFromCache()").error(
                "ChatService Redis Cache setDataFromCache() method error:",
                error
            )
            return Promise.resolve(null)
        }
    }

    public async removeDataFromCache(key: string): Promise<boolean> {
        try {
            return (await this.client.del(key)) > 0
        } catch (error) {
            this.logger("redis.ts - getDataFromCache()").error(
                "ChatService Redis Cache getDataFromCache() method error:",
                error
            )
            return false
        }
    }

    public flushCacheData(): void {
        try {
            this.client.flushall()
        } catch (error) {
            this.logger("redis.ts - flushCachedData()").error(error)
        }
    }
}
