"use client"

import { Sheet, SheetColumn, SheetColumnValue, SheetSource, Source } from "@prisma/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { deleteColumnFromSheet, fetchSheet, updateSheetName } from "./actions"
import { PiDownload, PiList, PiListBold, PiPencil, PiPlay, PiPlayBold, PiPlayFill, PiPlus, PiSpinner, PiTrash } from "react-icons/pi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import SourcesDialog from "./sourcesDialog"
import { useSheetStore } from "../../shared"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ColumnDialog from "./columnDialog"
import { useToast } from "@/hooks/use-toast"

export default function SheetPage() {
    const { slug } = useParams()
    const [sheet, setSheet] = useState<Sheet | null>(null)
    const [sources, setSources] = useState<(SheetSource & { source: Source })[]>([])
    const [columns, setColumns] = useState<SheetColumn[]>([])
    const [columnValues, setColumnValues] = useState<{ [key: string]: SheetColumnValue }>({})
    const [nameEdit, setNameEdit] = useState(false)
    const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false)
    const [columnDialogOpen, setColumnDialogOpen] = useState(false)
    const { setDueForRefresh } = useSheetStore()
    const [columnDialogData, setColumnDialogData] = useState<SheetColumn | null>(null)
    const router = useRouter()
    const { toast } = useToast()

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

    const handleDeleteColumn = async (columnId: string) => {
        try {
            await deleteColumnFromSheet(sheet.id, columnId)
            await fetchData()
            toast({
                title: "Column Deleted",
                description: "The column has been deleted from the sheet",
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "An error occurred while deleting the column",
                variant: "destructive",
            })
        }
    }

    const handleDeleteSheet = async () => {
        // await deleteSheet(sheet.id)
        router.push("/console")
        setDueForRefresh(sheet.id)
    }

    return (
        <div className="h-full w-full" onClick={() => handleNameEdit()}>
            <div className="w-full border-b-[1px] border-gray-200 h-[50px] flex justify-between items-center px-5">
                <div>
                    {nameEdit ? (
                        <Input
                            className="w-[250px]"
                            placeholder="Enter a name"
                            value={sheet.name}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameEdit()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSheet({ ...sheet, name: e.target.value })}
                        />
                    ) : (
                        <p onDoubleClick={() => setNameEdit(true)} className="text-gray-700 font-medium">
                            {sheet.name}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button>
                        <PiPlay />
                        Run All
                    </Button>
                    <Button>
                        <PiDownload />
                        Export as CSV
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <PiList />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <PiTrash /> Delete Sheet
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="border-r-[1px] border-gray-200">Source</TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.id} className="border-r-[1px] border-gray-200">
                                <div className="flex items-center justify-between">
                                    {column.name}
                                    <div className="flex items-center gap-1">
                                        <button className="hover:bg-gray-200 bg-gray-100 rounded p-2"><PiPlayFill className="text-green-600" /></button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="hover:bg-gray-200 bg-gray-100 rounded p-2"><PiListBold className="text-black" /></button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => { setColumnDialogData(column); setColumnDialogOpen(true) }}>
                                                    <PiPencil /> Edit Column
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteColumn(column.id)}>
                                                    <PiTrash className="text-red-500" /> Delete Column
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="bg-gray-100">
                            <button onClick={() => setColumnDialogOpen(true)} className="flex items-center gap-2 hover:underline">
                                <PiPlus />Add Column
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sources.map((source) => (
                        <TableRow key={source.id}>
                            <TableCell className="border-r-[1px] border-gray-200">{source.source.nickname}</TableCell>
                            {columns.map((column) => (
                                <TableCell className="border-r-[1px] border-gray-200" key={`${source.id}_${column.id}`}>{columnValues[`${source.id}_${column.id}`].value || "N/A"}</TableCell>
                            ))}
                            <TableCell className="bg-gray-100">
                                <button onClick={() => setColumnDialogOpen(true)} className="flex items-center gap-2">
                                    <PiPlus />
                                    Add Column
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell className="bg-gray-100 border-r-[1px] border-gray-200">
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
                        <TableCell colSpan={columns.length + 1} className="bg-gray-50"></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Dialog open={columnDialogOpen} onOpenChange={(open) => { setColumnDialogOpen(open); setColumnDialogData(null) }}>
                <ColumnDialog open={columnDialogOpen} defaultData={columnDialogData} sheetId={sheet.id} onSubmit={() => { fetchData(); setColumnDialogOpen(false); setColumnDialogData(null) }} />
            </Dialog>
        </div>
    )
}
