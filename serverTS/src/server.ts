import { env } from "./config/env.js";
import app from "./app.js";
import { logger } from "./shared/utils/logger.js"
import { mongoConnect } from "./config/db.js";
import { redisConnect } from "./config/redis.js";

const connectServices = async () => {
    await mongoConnect();
    await redisConnect();
}


const svLogger = logger.child({ module: "Server" })
app.listen(env.PORT, () => {
    svLogger.info("Server running successfully");
    connectServices();
})