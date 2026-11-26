import helmet, { type HelmetOptions } from "helmet";
import { env } from "./env.js";

const isProduction = env.NODE_ENV === "production";

export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },

  crossOriginResourcePolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "no-referrer" },
  strictTransportSecurity: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: false }
    : false,
};

export const helmetConfig = helmet(helmetOptions);