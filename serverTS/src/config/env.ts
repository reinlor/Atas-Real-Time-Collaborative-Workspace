import { config as loadDotenv } from "dotenv";
import { z } from "zod";
loadDotenv({ quiet: true })

// ENUMS
const NODE_ENVS = ["development", "production", "test"] as const;
const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const envSchema = z.object({
    // SERVER
    NODE_ENV: z.enum(NODE_ENVS).default("production"),
    PORT: z.preprocess(
        (val) => (typeof val === "string" ? Number(val) : val),
        z.number().int().min(1).max(65535),
    ).default(3000),
    ORIGIN_URI: z.string().trim()
        .pipe(z.url({ protocol: /^https?$/, error: "CLIENT_URL must be a valid http(s) URL" }))
        .transform((value) => new URL(value).origin).optional(),

    // LOGGER
    LOG_LEVEL: z.enum(LOG_LEVELS).default("debug"),

    // JWT
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_FORGOT_PASS_SECRET: z.string().min(32, "JWT_FORGOT_PASS_SECRET must be at least 32 characters"),
    JWT_VERIFICATION_SECRET: z.string().min(32, "JWT_VERIFICATION_SECRET must be at least 32 characters"),

    // DB & REDIS CONNECTIONs
    MONGODB_URI: z.string({
        error: (issue) => issue.input === undefined ? "MONGODB_URI is required" : "MONGODB_URI must be a string",
    }).trim().regex(/^mongodb(\+srv)?:\/\/\S+$/, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
    REDIS_URL: z.string({
        error: (issue) => issue.input === undefined ? "REDIS_URL is required" : "REDIS_URL must be a string"
    }).trim().regex(/^rediss?:\/\/(?:([^:@\s]+)?(?::([^@\s]+))?@)?([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(?::(\d{1,5}))?(?:\/(\d+))?(?:\?[^\s]*)?$/,
        "REDIS_URL must be a valid redis:// or rediss:// URL"),

    // GOOGLE CLIENT
    GOOGLE_CLIENT_ID: z.string({
        error: (issue) => issue.input === undefined ? "GOOGLE_CLIENT_ID is required" : "GOOGLE_CLIENT_ID must be a string",
    }).trim().regex(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/, "GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com"),
    GOOGLE_CLIENT_SECRET: z.string({
        error: (issue) => issue.input === undefined ? "GOOGLE_CLIENT_SECRET is required" : "GOOGLE_CLIENT_SECRET must be a string",
    }).trim().min(10, "GOOGLE_CLIENT_SECRET is too short"),

    // NODE MAILER
    EMAIL_USER: z.email({
        error: (issue) => issue.input === undefined ? "EMAIL_USER is required" : "EMAIL_USER must be a valid email address",
    }),
    EMAIL_PASS: z.string({
        error: (issue) => issue.input === undefined ? "EMAIL_PASS is required" : "EMAIL_PASS must be a string",
    }).trim().min(8, "EMAIL_PASS is too short"),

    // GEMINI
    GEMINI_API_KEY: z.string({
        error: (issue) => issue.input === undefined ? "GEMINI_API_KEY is required" : "GEMINI_API_KEY must be a string",
    }).trim().min(10, "GEMINI_API_KEY is too short"),
    GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash")
})

export type Env = z.infer<typeof envSchema>;

type EnvSource = Record<string, unknown>;
export function parseEnv(source: EnvSource = process.env) {
    const cleaned = Object.fromEntries(
        Object.entries(source).filter(
            ([, value]) => value !== undefined && (typeof value !== "string" || value.trim() !== ""),
        ),
    );

    return envSchema.safeParse(cleaned);
};

function loadEnv(): Readonly<Env> {
    const result = parseEnv();

    if (!result.success) {
        console.error("Invalid environment variables:\n" + z.prettifyError(result.error));
        process.exit(1);
    }

    return Object.freeze(result.data);
};

export const env: Readonly<Env> = loadEnv();