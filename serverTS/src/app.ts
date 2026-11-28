import express, { Express } from "express";
import { helmetMiddleware } from "./middleware/helmet.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
const app: Express = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(errorHandler);

export default app;