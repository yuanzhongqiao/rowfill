'use server'

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function signupUser(data: { name: string, email: string, organizationName: string }) {
    try {
        await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: data.organizationName,
                },
            })

            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                },
            })

            await tx.member.create({
                data: {
                    organizationId: organization.id,
                    userId: user.id,
                    role: "ADMIN",
                },
            })
        })
        return { success: true }
    } catch (error) {
        logger.error('Signup error:', error)
        return { success: false }
    }
}
