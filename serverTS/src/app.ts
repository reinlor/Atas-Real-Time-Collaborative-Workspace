import express, { Express } from "express";
import { helmetConfig } from "./config/helmet.js";
import { corsConfig } from "./config/cors.js";

const app: Express = express();

app.use(helmetConfig);
app.use(corsConfig);

export default app;