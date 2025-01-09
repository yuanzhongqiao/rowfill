import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Source } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { PiFile, PiPlus, PiSpinner, PiTrash } from "react-icons/pi";
import { fetchSources, getUploadUrlForSource, addSource, deleteSource } from "./actions";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function SourcesDialog() {
    const [sources, setSources] = useState<Source[]>([])
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const [uploadError, setUploadError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const fetchedSources = await fetchSources()
        setSources(fetchedSources)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        for (let file of e.target.files) {
            try {
                setUploading(true);
                // Get presigned URL
                const { url, filename } = await getUploadUrlForSource(file.name);

                // Upload file to S3
                const instance = axios.create()
                await instance.put(url, file)

                // Save source in database
                await addSource(file.name, filename)

                // Refresh sources list
                await fetchData()
                setUploadError('')
            } catch (error) {
                console.error('Error uploading file:', error)
                setUploadError('Error uploading file(s)')
            } finally {
                setUploading(false);
            }
        }
    }

    const handleDelete = async (sourceId: string) => {
        try {
            await deleteSource(sourceId)
            await fetchData()
            toast({
                title: 'Source deleted',
                description: 'The source has been deleted',
                variant: 'destructive',
            })
        } catch (error) {
            console.error('Error deleting source:', error)
            toast({
                title: 'Error deleting source',
                description: 'An error occurred while deleting the source',
                variant: 'destructive',
            })
        }
    }

    const filteredSources = sources.filter(source =>
        source.nickname.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <DialogTitle>Sources</DialogTitle>
            <div className="flex gap-2 mt-5">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
                <Button size="icon" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <PiSpinner className="animate-spin" /> : <PiPlus />}
                </Button>
                <input
                    type="file"
                    ref={fileRef}
                    multiple
                    className="hidden"
                    accept=".docx,.pdf,.jpeg,.jpg,.png"
                    onChange={handleFileChange}
                />
            </div>
            {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
            <ScrollArea className="h-[350px] mt-5">
                <div className="flex flex-col gap-3 pr-5 py-2">
                    {filteredSources.map((source) => (
                        <div key={source.id} className="flex border-[1px] border-gray-200 rounded-md p-5 justify-between">
                            <div className="flex items-center gap-2">
                                <PiFile size={20} />
                                <p className="text-sm">{source.nickname}</p>
                                <p className="text-xs px-1 py-0.5 bg-gray-200 rounded-md">{source.isIndexed ? 'Indexed' : 'Not indexed'}</p>
                            </div>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(source.id)}><PiTrash /></Button>
                        </div>
                    ))}
                </div>
                {sources.length === 0 || filteredSources.length === 0 && <div className="flex items-center justify-center h-[350px] text-muted-foreground">No sources found</div>}
            </ScrollArea>
        </div>
    )
}
