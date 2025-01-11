import { Button } from "@/components/ui/button"
import { DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Source } from "@prisma/client"
import { useEffect, useState } from "react"
import { PiCheck, PiFile, PiFloppyDisk, PiX } from "react-icons/pi"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { fetchSources } from "../../actions"
import { updateSourceToSheet, fetchSheetSources } from "./actions"

export default function SourcesDialog({ sheetId, onAdd }: { sheetId: string, onAdd: () => void }) {
    const [sources, setSources] = useState<Source[]>([])
    const [search, setSearch] = useState("")
    const [selectedSources, setSelectedSources] = useState<string[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const fetchedSources = await fetchSources()
        const fetchedSheetSources = await fetchSheetSources(sheetId)
        setSources(fetchedSources)
        setSelectedSources(fetchedSheetSources.map(source => source.sourceId))
    }

    const handleAdd = async () => {
        await updateSourceToSheet(selectedSources, sheetId)
        onAdd()
    }

    const handleSelect = (sourceId: string) => {
        if (selectedSources.includes(sourceId)) {
            setSelectedSources(selectedSources.filter(id => id !== sourceId))
        } else {
            setSelectedSources([...selectedSources, sourceId])
        }
    }

    const filteredSources = sources.filter(source =>
        source.nickName.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <DialogTitle>Sheet Sources</DialogTitle>
            <div className="flex gap-2 mt-5">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
            </div>
            <ScrollArea className="h-[350px] mt-5">
                <div className="flex flex-col gap-3 pr-5 py-2">
                    {filteredSources.map((source) => (
                        <div key={source.id} className="flex border-[1px] border-gray-200 rounded-md p-5 justify-between">
                            <div className="flex items-center gap-2">
                                <PiFile size={20} />
                                <p className="text-sm max-w-[200px] text-ellipsis truncate overflow-hidden">{source.nickName}</p>
                                <p className="text-xs px-1 py-0.5 bg-gray-200 rounded-md">{source.isIndexed ? "Indexed" : source.isIndexing ? "Indexing" : "Not indexed"}</p>
                            </div>
                            <Button disabled={!source.isIndexed} size="icon" onClick={() => handleSelect(source.id)}>{selectedSources.includes(source.id) ? <PiX /> : <PiCheck />}</Button>
                        </div>
                    ))}
                </div>
                {sources.length === 0 || filteredSources.length === 0 && <div className="flex items-center justify-center h-[350px] text-muted-foreground">No sources found</div>}
            </ScrollArea>
            <DialogFooter className="flex justify-end mt-5">
                <Button disabled={selectedSources.length === 0} onClick={handleAdd}><PiFloppyDisk /> Save</Button>
            </DialogFooter>
        </div>
    )
}
