import { prisma } from "@/lib/prisma"

export async function checkCredits(organizationId: string, credits: number): Promise<boolean> {
    const billing = await prisma.billing.findFirst({
        where: {
            organizationId: organizationId
        }
    })

    if (billing) {
        return billing.credits >= credits
    }

    return false
}

export async function consumeCredits(organizationId: string, credits: number): Promise<boolean> {

    const billing = await prisma.billing.findFirstOrThrow({
        where: {
            organizationId: organizationId
        }
    })

    await prisma.billing.update({
        where: {
            organizationId: organizationId
        },
        data: {
            credits: billing.credits - credits
        }
    })

    return false
}
