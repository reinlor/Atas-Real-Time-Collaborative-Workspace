import express, { Express } from "express";
import helmet from "helmet";
import { corsConfig } from "./config/cors.js";

const app: Express = express();

app.use(helmet());
app.use(corsConfig);

export default app;