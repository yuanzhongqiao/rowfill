"use client"

import { Sheet } from "@prisma/client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchSheet } from "./actions"
import { PiSpinner } from "react-icons/pi"

export default function SheetPage() {
    const { slug } = useParams()
    const [sheet, setSheet] = useState<Sheet | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        if (slug && typeof slug === 'string') {
            const sheet = await fetchSheet(slug)
            setSheet(sheet)
        }
    }

    if (!sheet) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center h-full w-full text-muted-foreground">
                <PiSpinner className="animate-spin" />
                Loading...
            </div>
        )
    }

    return (
        <div className="h-full w-full">
            <div className="w-full border-b-[1px] border-gray-200 h-[50px]">

            </div>
        </div>
    )
}
