import { sendEmail } from "@/lib/email"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { OpenAI } from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { checkCredits, consumeCredits } from "./ee/billing"

export async function extractTableToSheet(sheetId: string) {
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            extractInProgress: true
        },
        include: {
            sheetSources: true,
            createdBy: true
        }
    })

    if (!sheet) {
        throw new Error("Sheet not found");
    }

    if (sheet.sheetSources.length !== 1) {
        throw new Error("Sheet must have exactly one source");
    }

    try {

        const columns = await prisma.sheetColumn.findMany({
            where: {
                sheetId: sheetId
            }
        })

        // Delete all rows in the sheet
        await prisma.extractedSheetRow.deleteMany({
            where: {
                sheetId: sheetId
            }
        })

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })

        const indexedSources = await prisma.indexedSource.findMany({
            where: {
                sourceId: sheet.sheetSources[0].sourceId
            }
        })

        const rowSchema = z.object(
            Object.fromEntries(
                columns.map((column) => [
                    column.name,
                    z.string().optional().describe(column.instruction)
                ])
            )
        )


        if (process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
            const creditsAvailable = await checkCredits(sheet.organizationId, indexedSources.length * 10)
            if (!creditsAvailable) {
                throw new Error("No credits available")
            }
        }

        for (let indexedSource of indexedSources) {
            const response = await openai.beta.chat.completions.parse({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You need to extract data from a tables or charts into rows of data"
                    },
                    {
                        role: "user",
                        content: indexedSource.referenceText || ""
                    }
                ],
                temperature: 0,
                response_format: zodResponseFormat(
                    z.object({
                        rows: z.array(rowSchema)
                    }),
                    "rows"
                )
            })

            const output = response.choices[0].message.parsed

            let rowCount = 1

            // logger.info(JSON.stringify(output))

            if (output) {

                for (let row of output.rows) {

                    for (let columnName in row) {
                        const foundColumn = columns.find((column) => column.name === columnName)

                        if (foundColumn) {

                            await prisma.extractedSheetRow.create({
                                data: {
                                    sheetId: sheetId,
                                    sheetColumnId: foundColumn.id,
                                    rowNumber: rowCount,
                                    organizationId: sheet.organizationId,
                                    value: row[columnName],
                                    indexedSourceId: indexedSource.id
                                }
                            })
                        }
                    }

                    rowCount += 1
                }
            }
        }

        if (process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
            await consumeCredits(sheet.organizationId, indexedSources.length * 10)
        }

        await prisma.sheet.update({
            where: {
                id: sheetId
            },
            data: {
                extractInProgress: false
            }
        })

        if (sheet.createdBy) {

            await sendEmail(
                sheet.createdBy.email,
                "Extraction Complete",
                `The extraction for sheet ${sheet.name} has been completed. You can now view the data in the sheet.`
            )
        }

    } catch (err) {
        logger.error(err)

        await prisma.sheet.update({
            where: {
                id: sheetId
            },
            data: {
                extractInProgress: false
            }
        })

        if (sheet.createdBy) {
            await sendEmail(
                sheet.createdBy.email,
                "Extraction Failed",
                `The extraction for sheet ${sheet.name} has failed. Please try again later.`
            )
        }
    }

}
