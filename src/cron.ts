import cron from "node-cron"
import { indexSource } from "@/core/indexer"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

cron.schedule("*/5 * * * *", async () => {
    try {
        const lock = await redis.get("cron-lock")

        console.log("CRON Lock Status", lock)

        if (lock) {
            return
        }

        await redis.set("cron-lock", "true")

        console.log("Starting CRON")

        const sources = await prisma.source.findMany({
            where: {
                isIndexed: false,
                isIndexing: false
            }
        })

        for (const source of sources) {

            console.log(`Indexing source of ${source.id}`)

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
                        isIndexed: true
                    }
                })

                console.log(`Indexed source of ${source.id}`)


            } catch (err) {
                await prisma.source.update({
                    where: {
                        id: source.id
                    },
                    data: {
                        isIndexing: false,
                        isIndexed: false
                    }
                })

                console.log(err)
                console.log(`Failed to index source of ${source.id}`)
            }
        }

        await redis.del("cron-lock")

    } catch (err) {
        console.error(err)
        await redis.del("cron-lock")
    }
})
