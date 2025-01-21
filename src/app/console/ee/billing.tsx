"use client"

import { Billing } from "@prisma/client"
import { useEffect, useState } from "react"
import { getBillingAndCreateIfNotExists, getPlans, handleDowngradeToFree } from "./actions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function BillingComponent({ billingState }: { billingState: Billing }) {

    type Plan = {
        name: string
        price: string
        credits: string
        for: string
        purchaseUrl: string
    }

    const [billing, setBilling] = useState<Billing | null>(billingState)
    const [plans, setPlans] = useState<Plan[]>([])
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const plans = await getPlans()
        setPlans(plans)
    }

    const fetchBilling = async () => {
        const billing = await getBillingAndCreateIfNotExists()
        setBilling(billing)
    }

    const planButtonText = (plan: Plan) => {
        if (billing && billing.plan === plan.name) {
            return "Current Plan"
        }

        if (billing && billing.plan === "PRO" && plan.name === "FREE") {
            return "Downgrade"
        }

        if (billing && billing.plan === "FREE" && plan.name.includes("PRO_")) {
            return "Upgrade"
        }

        if (billing && billing.plan === "ENTERPRISE") {
            return "Contact Support"
        }

        return "Contact Support"
    }

    const handlePlanButton = async (plan: Plan) => {
        if (billing && billing.plan === "FREE" && plan.name !== "FREE") {
            router.push(plan.purchaseUrl)
            return
        }

        if (billing && (billing.plan === "FREE" || billing.plan === "PRO") && plan.name === "ENTERPRISE") {
            router.push(plan.purchaseUrl)
            return
        }

        if (billing && (billing.plan.includes("PRO_")) && plan.name === "FREE") {
            // Handle Downgrade
            await handleDowngradeToFree()
            await fetchBilling()
            toast({
                title: "Downgraded to Free",
                description: "You have been downgraded to the Free plan",
            })
            return
        }


        toast({
            title: "Failed to update plan",
            description: "Please contact support",
            variant: "destructive",
        })
    }

    return (
        <div>
            {/* TODO: Billing goes here */}
            {plans.map((plan, index) => (
                <div key={`plan-${index}`} className="flex justify-between items-center p-2 rounded-md border-b-[1px] border-gray-200">
                    <div className="flex items-center gap-3">
                        <p className="text-xl flex items-center gap-2 font-bold">{plan.price} / {plan.for}</p>
                        <div className="flex flex-col gap-1">
                            <p className="text-lg">{plan.name}</p>
                            <p className="text-sm">{plan.credits}/month</p>
                        </div>
                    </div>
                    <Button disabled={planButtonText(plan) === "Current Plan" || planButtonText(plan) === "Contact Support"} onClick={() => handlePlanButton(plan)}>{planButtonText(plan)}</Button>
                </div>
            ))}
        </div>
    )
}
