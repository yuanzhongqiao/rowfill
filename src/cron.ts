import cron from "node-cron"
import { indexSource } from "@/core/indexer"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"


cron.schedule("*/10 * * * * *", async () => {
    try {
        const lock = await redis.get("cron-lock")

        if (lock) {
            return
        }
        
        await redis.set("cron-lock", "true")

        const sources = await prisma.source.findMany({
            where: {
                isIndexed: false
            }
        })

        for (const source of sources) {
            await indexSource(source.id)
        }

        await redis.del("cron-lock")

    } catch (err) {
        console.error(err)
        await redis.del("cron-lock")
    }
})
