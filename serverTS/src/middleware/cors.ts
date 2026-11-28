import { env } from "../config/env.js";
import cors, { type CorsOptions } from "cors";

const allowedOrigins = env.ORIGIN_URI.split(",").map((origin) => origin.trim());

const corsOptions: CorsOptions = {
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);