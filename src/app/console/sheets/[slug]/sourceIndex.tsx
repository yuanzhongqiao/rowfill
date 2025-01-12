import { useEffect, useState } from "react"
import { getSourceIndex } from "./actions"
import { IndexedSource, Source } from "@prisma/client"
import { PiDownload } from "react-icons/pi"
import { Button } from "@/components/ui/button"

export default function SourceIndexComponent({ sourceIndexId }: { sourceIndexId: string }) {

    const [sourceIndex, setSourceIndex] = useState<(IndexedSource & { source: Source }) | null>(null)


    const fetchData = async () => {
        const data = await getSourceIndex(sourceIndexId)
        setSourceIndex(data)
    }

    useEffect(() => {
        fetchData()
    }, [])


    if (!sourceIndex) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1>Reference Text</h1>
                <p>{sourceIndex.referenceText}</p>
            </div>
            <div>
                <h1>Reference Image</h1>
                <Button variant="outline" onClick={() => {
                    if (sourceIndex.referenceImageFileName) {
                        window.open(sourceIndex.referenceImageFileName, '_blank')
                    }
                }}>
                    <PiDownload />
                    Download
                </Button>
            </div>
            <div>
                <h1>Source File</h1>
                <Button variant="outline" onClick={() => {
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