import express, { Express } from "express";
import { helmetMiddleware } from "./middleware/helmet.js";
import { corsMiddleware } from "./middleware/cors.js";
const app: Express = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

export default app;