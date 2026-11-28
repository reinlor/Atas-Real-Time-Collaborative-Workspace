import pino from "pino";
import { env } from "../../config/env.js";

const SENSITIVE_KEYS = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
    "secret",
    "clientSecret",
    "apiKey",
    "api_key",
] as const;

const redactPaths = [
    "req.headers.authorization",
    "req.headers.cookie",
    'req.headers["x-api-key"]',
    'res.headers["set-cookie"]',
    "req.query.token",
    "req.params.token",
    ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]),
];

const reqSerializer: typeof pino.stdSerializers.req = (req) => {
    const serialized = pino.stdSerializers.req(req);
    if (typeof serialized.url === "string") {
        serialized.url = serialized.url.split("?")[0];
    }
    return serialized;
};

export const logger = pino({
    level: env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: redactPaths,
    serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
        req: reqSerializer,
        res: pino.stdSerializers.res,
    },
    ...(env.NODE_ENV === "development"
        ? {
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:HH:MM:ss",
                    ignore: "pid,hostname",
                },
            },
        }
        : {
            formatters: { level: (label) => ({ level: label }) },
        }),
});