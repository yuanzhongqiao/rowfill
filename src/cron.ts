import cron from "node-cron"
import { indexSource } from "@/core/indexer"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { logger } from "./lib/logger"

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

            logger.info(`Indexing source of ${source.id}`)

            try {
                await prisma.source.update({
                    where: {
                        id: source.id
                    },
                    data: {
                        isIndexing: true
                    }
                })

                await indexSource(source.id)

                await prisma.source.update({
                    where: {
                        id: source.id
                    },
                    data: {
                        isIndexing: false,
                        isIndexed: true,
                        indexRunCount: {
                            increment: 1
                        }
                    }
                })

                logger.info(`Indexed source of ${source.id}`)


            } catch (err) {
                await prisma.source.update({
                    where: {
                        id: source.id
                    },
                    data: {
                        isIndexing: false,
                        isIndexed: false,
                        indexRunCount: {
                            increment: 1
                        }
                    }
                })

                logger.info(err)
                logger.info(`Failed to index source of ${source.id}`)
            }
        }

        await redis.del("cron-lock")

    } catch (err) {
        logger.error(err)
        await redis.del("cron-lock")
    }
})
