import { getPresignedUrlForGet } from "@/lib/file"
import { prisma } from "@/lib/prisma"
import { convertPdfToImages } from "@/lib/pdf"
import { transcribeAudio } from "./transcribe"
import { imageToMarkdown } from "./imageToMarkdown"
import { sendEmail } from "@/lib/email"
import { indexTextToVectorDB } from "./memory"

export async function indexSource(sourceId: string) {
    const source = await prisma.source.findFirstOrThrow({
        where: {
            id: sourceId
        }
    })

    const file = await getPresignedUrlForGet(source.fileName)

    // PDF
    if (source.fileType === "application/pdf") {

        const images = await convertPdfToImages(file.url, source.fileName)

        for (const image of images) {

            const imageFile = await getPresignedUrlForGet(image)
            const referenceText = await imageToMarkdown(imageFile.url)
            const indexId = await indexTextToVectorDB(referenceText, source.organizationId, source.id)

            await prisma.indexedSource.create({
                data: {
                    indexId: indexId,
                    referenceImageFileName: imageFile.filename,
                    sourceId: source.id,
                    organizationId: source.organizationId,
                    referenceText: referenceText
                }
            })
        }
    }

    // Image
    if (source.fileType === "image/jpeg" || source.fileType === "image/jpg" || source.fileType === "image/png") {
        const referenceText = await imageToMarkdown(file.url)
        const indexId = await indexTextToVectorDB(referenceText, source.organizationId, source.id)
        await prisma.indexedSource.create({
            data: {
                indexId: indexId,
                referenceImageFileName: source.fileName,
                sourceId: source.id,
                organizationId: source.organizationId,
                referenceText: referenceText
            }
        })
    }

    // Audio
    if (source.fileType === "audio/mp3") {
        const transcription = await transcribeAudio(file.url)

        const indexId = await indexTextToVectorDB(transcription, source.organizationId, source.id)

        await prisma.indexedSource.create({
            data: {
                indexId: indexId,
                referenceText: transcription,
                sourceId: source.id,
                organizationId: source.organizationId
            }
        })

    }

    // Video
    if (source.fileType === "video/mp4") {
        // TODO: Index Video
    }

    // Docx
    if (source.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // TODO: Index Docx
    }

    const user = await prisma.user.findFirstOrThrow({
        where: {
            id: source.uploadedById
        }
    })

    await sendEmail(
        user.email,
        "Source Indexed",
        `The source you uploaded, ${source.nickName} has been indexed.`
    )

    return {
        completed: true
    }
}
