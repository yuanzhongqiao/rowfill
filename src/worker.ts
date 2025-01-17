import { Worker } from "bullmq"
import { extractTableToSheet } from "./core/extractTable"
import { logger } from "@/lib/logger"
import { indexSource } from "@/core/indexer"
import { prisma } from "@/lib/prisma"

// Define the worker process
new Worker(
    "queue",
    async (job) => {
        if (job.name === "extractTableToSheet") {
            try {
                await extractTableToSheet(job.data.sheetId)
            } catch (err) {
                logger.error(err)
            }
        }

        if (job.name === "indexSource") {
            try {
                await indexSource(job.data.sourceId)
            } catch (err) {
                logger.error(err)
            }
        }
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
