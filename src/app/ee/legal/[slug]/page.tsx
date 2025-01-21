import axios from "axios"
import Image from "next/image"

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    let legalPageContent = ""

    const eeEnabled = process.env.EE_ENABLED && process.env.EE_ENABLED === 'true'

    if (!eeEnabled) {
        return (
            <div className="flex flex-col gap-5 items-center justify-center h-screen">
                <Image src="/logo.svg" alt="404" width={50} height={50} />
                <p className="text-lg">You are not authorized to access this page</p>
            </div>
        )
    }

    if (slug === "privacy-policy" && process.env.PRIVACY_POLICY_URL) {
        const response = await axios.get(process.env.PRIVACY_POLICY_URL || "")
        legalPageContent = response.data
    }


    if (slug === "refund-policy" && process.env.REFUND_POLICY_URL) {
        const response = await axios.get(process.env.REFUND_POLICY_URL || "")
        legalPageContent = response.data
    }

    if (slug === "terms-of-service" && process.env.TERMS_OF_SERVICE_URL) {
        const response = await axios.get(process.env.TERMS_OF_SERVICE_URL || "")
        legalPageContent = response.data
    }

    if (legalPageContent) {
        return (
            <div className="p-10">
                <Image src="/logo-full.svg" alt="Rowfill" width={150} height={150} />
                <div className="mt-10" dangerouslySetInnerHTML={{ __html: legalPageContent }} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5 items-center justify-center h-screen">
            <Image src="/logo.svg" alt="404" width={50} height={50} />
            <p className="text-lg">Unable to find the legal page</p>
        </div>
    )
}
