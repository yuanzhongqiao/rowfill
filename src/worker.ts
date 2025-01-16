import { Worker } from "bullmq";
import { logger } from "./lib/logger";

// Define the worker process
new Worker(
    "queue",
    async (job) => {
        logger.info("Worker running")
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0") || 0
        }
    }
)
