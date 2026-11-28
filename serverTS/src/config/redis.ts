import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../shared/utils/logger.js";

const rdLogger = logger.child({ module: "Redis" });

export type RedisClient = ReturnType<typeof createClient>;
export type RedisOptions = Parameters<typeof createClient>[0];

const options: RedisOptions = {
    url: env.REDIS_URL,
};

export const redisClient: RedisClient = createClient(options);

redisClient.on("ready", () => rdLogger.info("Redis ready"));
redisClient.on("end", () => rdLogger.warn("Redis disconnected"));
redisClient.on("reconnecting", () => rdLogger.warn("Redis reconnecting..."));
redisClient.on("error", (err) => rdLogger.error({ err }, "Redis client error"));

export const redisConnect = async (): Promise<void> => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        rdLogger.error({ err: error }, "Failed to establish Redis connection");
        throw error;
    }
};

export const redisDisconnect = async (): Promise<void> => {
    try {
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
    } catch (error) {
        rdLogger.error({ err: error }, "Failed to close Redis connection");
        throw error;
    }
};

export const isRedisConnected = async (): Promise<boolean> => {
    if (!redisClient.isReady) return false;
    try {
        return (await redisClient.ping()) === "PONG";
    } catch {
        return false;
    }
};