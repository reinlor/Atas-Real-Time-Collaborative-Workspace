import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../shared/utils/logger.js";

const dbLogger = logger.child({ module: "Database" });

mongoose.connection.removeAllListeners();

mongoose.connection.on("connected", () => {
    dbLogger.info("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
    dbLogger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
    dbLogger.info("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
    dbLogger.error({ err }, "MongoDB connection error");
});

export const mongoConnect = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
    } catch (error) {
        dbLogger.error({ err: error }, "Failed to connect to MongoDB");
        throw error;
    }
};

export const mongoDisconnect = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
    } catch (error) {
        dbLogger.error({ err: error }, "Failed to disconnect MongoDB");
        throw error;
    }
};

export const isMongoConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};