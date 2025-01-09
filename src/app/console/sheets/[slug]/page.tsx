"use client"

import { Sheet, SheetColumn, SheetColumnValue, SheetSource, Source } from "@prisma/client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchSheet, updateSheetName } from "./actions"
import { PiPlus, PiSpinner, PiTrash } from "react-icons/pi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import SourcesDialog from "./sourcesDialog"
import { useSheetStore } from "../../shared"

export default function SheetPage() {
    const { slug } = useParams()
    const [sheet, setSheet] = useState<Sheet | null>(null)
    const [sources, setSources] = useState<(SheetSource & { source: Source })[]>([])
    const [columns, setColumns] = useState<SheetColumn[]>([])
    const [columnValues, setColumnValues] = useState<{ [key: string]: SheetColumnValue }>({})
    const [nameEdit, setNameEdit] = useState(false)
    const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false)
    const { setDueForRefresh } = useSheetStore()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        if (slug && typeof slug === 'string') {
            try {
                const data = await fetchSheet(slug)
                setSheet(data.sheet)
                setSources(data.sources as (SheetSource & { source: Source })[])
                setColumns(data.columns)
                setColumnValues(data.columnValues)
            } catch (error) {
                console.error("Error fetching sheet data:", error)
            }
        }
    }

    if (!sheet) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center h-full w-full text-muted-foreground">
                <PiSpinner className="animate-spin text-2xl" />
            </div>
        )
    }

    const handleNameEdit = () => {
        if (sheet.name === "" || sheet.name.length < 3) {
            setSheet({ ...sheet, name: "Untitled" })
            updateSheetName(sheet.id, "Untitled")
        } else {
            updateSheetName(sheet.id, sheet.name)
        }
        setNameEdit(false)
        setDueForRefresh(sheet.id)
    }

    return (
        <div className="h-full w-full" onClick={() => handleNameEdit()}>
            <div className="w-full border-b-[1px] border-gray-200 h-[50px] flex justify-between items-center px-5">
                <div>
                    {nameEdit ? <Input className="w-[250px]" placeholder="Enter a name" value={sheet.name} onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()} onClick={(e) => e.stopPropagation()} onChange={(e) => setSheet({ ...sheet, name: e.target.value })} /> : <p onDoubleClick={() => setNameEdit(true)} className="text-gray-700 font-medium">{sheet.name}</p>}
                </div>
                <div>
                    <Button variant="destructive" size="icon" onClick={() => setNameEdit(false)}><PiTrash /></Button>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Source</TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.id}>{column.name}</TableHead>
                        ))}
                        <TableHead className="bg-gray-100">
                            <button className="flex items-center gap-2 hover:underline">
                                <PiPlus />Add Column
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sources.map((source) => (
                        <TableRow key={source.id}>
                            <TableCell className="bg-gray-100">{source.source.nickname}</TableCell>
                            {columns.map((column) => (
                                <TableCell key={`${source.id}_${column.id}`}>{columnValues[`${source.id}_${column.id}`].value || "N/A"}</TableCell>
                            ))}
                            <TableCell className="bg-gray-100">
                                <button className="flex items-center gap-2">
                                    <PiPlus />
                                    Add Column
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell className="bg-gray-100">
                            <Dialog open={sourcesDialogOpen} onOpenChange={setSourcesDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="flex items-center gap-2 hover:underline">
                                        <PiPlus />
                                        Add Source
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <SourcesDialog sheetId={sheet.id} onAdd={() => { fetchData(); setSourcesDialogOpen(false) }} />
                                </DialogContent>
                            </Dialog>
                        </TableCell>
                        <TableCell colSpan={columns.length - 1}></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}
