import cron from 'node-cron'
import { redis } from './lib/redis'
import { indexSource } from './core/indexer'
import { prisma } from './lib/prisma'

cron.schedule('*/10 * * * * *', async () => {
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

    } catch (err) {
        console.error(err)
    } finally {
        await redis.del("cron-lock")
    }
})
