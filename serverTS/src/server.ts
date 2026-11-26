import { env } from "./config/env.js";
import app from "./app.js";
import { logger } from "./shared/utils/logger.js"

const svLogger = logger.child({ module: "Server" })
app.listen(env.PORT, () => {
    svLogger.info("Server running successfully");
})