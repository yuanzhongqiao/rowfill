import { useEffect, useState } from "react"
import { getSourceIndex } from "./actions"
import { IndexedSource, Source } from "@prisma/client"
import { PiDownload } from "react-icons/pi"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { stripCodeBlockBackTicks } from "@/lib/utils"

export default function SourceIndexComponent({ sourceIndexId }: { sourceIndexId: string }) {

    const [sourceIndex, setSourceIndex] = useState<(IndexedSource & { source: Source }) | null>(null)


    const fetchData = async () => {
        const data = await getSourceIndex(sourceIndexId)
        setSourceIndex(data)
    }

    useEffect(() => {
        if (sourceIndexId) {
            fetchData()
        }
    }, [sourceIndexId])


    if (!sourceIndex) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="font-bold text-lg">Reference Text</h1>
                <div className="mdc">
                    <ReactMarkdown>{stripCodeBlockBackTicks(sourceIndex.referenceText || "No reference text")}</ReactMarkdown>
                </div>
            </div>
            <div>
                <h1 className="font-bold text-lg">Reference Image</h1>
                <Button variant="outline" className="mt-2" onClick={() => {
                    if (sourceIndex.referenceImageFileName) {
                        window.open(sourceIndex.referenceImageFileName, '_blank')
                    }
                }}>
                    <PiDownload />
                    Download
                </Button>
            </div>
            <div>
                <h1 className="font-bold text-lg">Source File</h1>
                <Button variant="outline" className="mt-2" onClick={() => {
                    if (sourceIndex.source.fileName) {
                        window.open(sourceIndex.source.fileName, '_blank')
                    }
                }}>
                    <PiDownload />
                    Download
                </Button>
            </div>
        </div>
    )
}