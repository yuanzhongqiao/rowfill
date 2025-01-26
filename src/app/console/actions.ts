"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { getPresignedUrlForGet, getPresignedUrlForUpload } from "@/lib/file"
import { queryVectorDB } from "@/core/memory"
import { generateAnswer } from "@/core/answer"
import { v4 as uuidv4 } from "uuid"

export async function fetchSheets() {
    const { organizationId, userId } = await getAuthToken()
    return await prisma.sheet.findMany({
        where: { organizationId, createdById: userId },
        orderBy: {
            createdAt: "desc"
        }
    })
}

export async function addSheet({ name, singleSource }: { name: string; singleSource: boolean }) {
    const { organizationId, userId } = await getAuthToken()
    return await prisma.sheet.create({
        data: {
            name,
            organizationId,
            createdById: userId,
            singleSource
        }
    })
}

export async function checkAuth() {
    const { organizationId, userId } = await getAuthToken()
    if (organizationId && userId) {
        return true
    }
    return false
}


export async function getCurrentOrganization() {
    const { userId, organizationId } = await getAuthToken()

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            members: {
                include: {
                    organization: true,
                },
            },
        },
    })

    if (!user) {
        throw new Error("User not found")
    }

    const currentOrganization = user.members.find(
        (member) => member.organizationId === organizationId
    )?.organization

    if (!currentOrganization) {
        throw new Error("Current organization not found")
    }

    const organizations = user.members.map((member) => member.organization)

    return { user, currentOrganization, organizations }
}


export async function updateUserName(name: string) {
    const { userId } = await getAuthToken()
    await prisma.user.update({
        where: { id: userId },
        data: { name },
    })
}

export async function updateOrganizationName(name: string) {
    const { organizationId } = await getAuthToken()
    await prisma.organization.update({
        where: { id: organizationId },
        data: { name },
    })
}

export async function resetOrganizationApiKey() {
    const { organizationId } = await getAuthToken()
    const apiKey = uuidv4()
    await prisma.organization.update({
        where: { id: organizationId },
        data: { apiKey: apiKey }
    })
    return apiKey
}

export async function addOrganization(name: string) {
    const { userId } = await getAuthToken()
    const newOrganization = await prisma.organization.create({
        data: { name },
    })
    await prisma.member.create({
        data: {
            userId,
            organizationId: newOrganization.id,
            role: "ADMIN",
        },
    })
    return newOrganization
}

export async function switchOrganization(organizationId: string) {
    const { userId } = await getAuthToken()

    // Check if the user is a member of the organization
    const member = await prisma.member.findFirst({
        where: {
            userId,
            organizationId,
        },
    })

    if (!member) {
        throw new Error("User is not a member of this organization")
    }

    // Generate new JWT token with the new organizationId
    const token = sign({ userId, organizationId }, process.env.JWT_SECRET || "", { expiresIn: "1d" })

    // Set new cookie
    let store = await cookies()

    store.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400, // 1 day
        path: "/",
    })
}

export async function fetchSources() {
    const { organizationId } = await getAuthToken()
    return await prisma.source.findMany({
        where: { organizationId },
    })
}


export async function getUploadUrlForSource(filename: string) {
    const { organizationId } = await getAuthToken()
    if (!organizationId) {
        throw new Error("User not authenticated")
    }
    const file = await getPresignedUrlForUpload(filename)
    return {
        url: file.url,
        filename: file.filename,
    }
}

export async function addSource(nickName: string, fileName: string, fileType: string) {
    const { organizationId, userId } = await getAuthToken()
    await prisma.source.create({
        data: { nickName, fileName, fileType, organizationId, uploadedById: userId },
    })

    return
}

export async function deleteSource(sourceId: string) {
    const { organizationId } = await getAuthToken()
    await prisma.source.delete({
        where: { id: sourceId, organizationId },
    })
}


export async function sendMessageToSearch(history: Array<{ role: "user" | "assistant", content: any }>, message: string) {
    const { organizationId } = await getAuthToken()

    const indexId = await queryVectorDB(message, organizationId)

    if (!indexId) {
        return {
            answer: "No documents found to answer this question",
            sources: []
        }
    }

    let sourceIndex = await prisma.indexedSource.findFirst({
        where: {
            organizationId,
            indexId: indexId
        }
    })

    if (!sourceIndex) {
        return {
            answer: "No documents found to answer this question",
            sources: []
        }
    }

    const query = `
    Answer the question: ${message}
    ${sourceIndex.referenceText && `Based on the following data: ${sourceIndex.referenceText}`}
    `

    if (sourceIndex.referenceImageFileName) {
        const imageUrl = await getPresignedUrlForGet(sourceIndex.referenceImageFileName)
        sourceIndex.referenceImageFileName = imageUrl.url
    }

    const answer = await generateAnswer(
        query,
        sourceIndex.referenceImageFileName ? [sourceIndex.referenceImageFileName] : [],
        history
    )

    const source = await prisma.source.findFirstOrThrow({
        where: {
            id: sourceIndex.sourceId,
            organizationId
        }
    })

    const sourceFile = await getPresignedUrlForGet(source.fileName)

    return {
        answer: answer,
        sources: [
            {
                title: source.nickName,
                url: sourceFile.url,
                referenceText: sourceIndex.referenceText || "",
                referenceImage: sourceIndex.referenceImageFileName ? sourceIndex.referenceImageFileName : ""
            }
        ]
    }

}
