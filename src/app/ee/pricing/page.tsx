import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { PiCheck } from "react-icons/pi";

export default function PricingPage() {

    if (!process.env.EE_ENABLED || process.env.EE_ENABLED !== "true") {
        return (
            <div className="flex flex-col gap-5 items-center justify-center h-screen">
                <Image src="/logo.svg" alt="404" width={50} height={50} />
                <p className="text-lg">You are not authorized to access this page</p>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader className="flex flex-col items-center">
                    <Image src="/logo.svg" alt="Rowfill Logo" width={50} height={50} />
                    <CardTitle className="text-lg pt-2">Professional Plan</CardTitle>
                    <p className="text-lg font-bold">Starts at ${process.env.PRO_PLAN_PRICE_MONTHLY}/month</p>
                    <Button>Get Started</Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-5">
                    <p className="flex items-center gap-2"><PiCheck /> {process.env.PRO_PLAN_CREDITS} Credits</p>
                    <p className="flex items-center gap-2"><PiCheck /> Unlimited Sheets</p>
                    <p className="flex items-center gap-2"><PiCheck /> Unlimited Sources</p>
                    <p className="flex items-center gap-2"><PiCheck /> AI Answering Agent</p>
                    <p className="flex items-center gap-2"><PiCheck /> AI Extraction Agent</p>
                    <p className="flex items-center gap-2"><PiCheck /> AI Document Search Agent</p>
                    <p className="flex items-center gap-2"><PiCheck /> Unlimited Users</p>
                    <p className="flex items-center gap-2"><PiCheck /> Email Support</p>
                    <p className="flex items-center gap-2"><PiCheck /> Priority Support</p>
                </CardContent>
            </Card>
            <div className="absolute bottom-5 right-5 flex gap-3 items-center">
                <Link href="/ee/legal/privacy-policy">Privacy Policy</Link>
                <Link href="/ee/legal/refund-policy">Refund Policy</Link>
                <Link href="/ee/legal/terms-of-service">Terms of Service</Link>
            </div>
        </div>
    )
}
