import cron from "node-cron"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { logger } from "@/lib/logger"
import { queue } from "@/lib/queue"

cron.schedule("*/5 * * * *", async () => {
    try {
        const lock = await redis.get("cron-lock")

        logger.info("CRON Lock Status", lock)

        if (lock) {
            return
        }

        await redis.set("cron-lock", "true")

        logger.info("Starting CRON")

        const sources = await prisma.source.findMany({
            where: {
                isIndexed: false,
                isIndexing: false,
                indexRunCount: {
                    lte: 3 // Max Retries
                }
            }
        })

        for (const source of sources) {
            await prisma.source.update({
                where: {
                    id: source.id
                },
                data: {
                    isIndexing: true
                }
            })
            
            await queue.add("indexSource", { sourceId: source.id })
        }

        await redis.del("cron-lock")

    } catch (err) {
        logger.error(err)
        await redis.del("cron-lock")
    }
})
