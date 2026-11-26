import express, { Express } from "express";
import { helmetConfig } from "./config/helmet.js";
import { corsConfig } from "./config/cors.js";
import { redisConnect, redisDisconnect, isRedisConnected } from "./config/redis.js";
const app: Express = express();

app.use(helmetConfig);
app.use(corsConfig);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

export default app;